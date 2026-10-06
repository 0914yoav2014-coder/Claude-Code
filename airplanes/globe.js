/* Interactive globe (PRD F2) with a static-map fallback (F3).
 *
 * Globe.mount(el, { routes, selected, onSelect, onInteract }) → { select(id) }
 *
 * The globe is a hand-rolled orthographic projection on <canvas>: land is a grid of
 * dots (land.js), so hiding the far side is just "skip dots facing away", no clipping.
 * Routes are great-circle arcs lifted above the surface; a small plane glides along each.
 * With reduced motion, or no canvas, the same routes are drawn on a flat SVG map.
 */
(function () {
  "use strict";

  const RAD = Math.PI / 180;
  const SHORT = 2 * RAD; // routes shorter than this (~220 km) become a pin
  const COL = {
    oceanIn: "#18406E", oceanOut: "#0A1C33", glow: "rgba(110, 180, 255, 0.28)",
    land: "#A9D3FF", route: "rgba(214, 233, 255, 0.5)", routeHover: "rgba(235, 245, 255, 0.9)",
    sel: "#FF8A3D", selGlow: "rgba(255, 138, 61, 0.28)", plane: "#FFFFFF",
  };

  const vec = ([lat, lon]) => {
    const c = Math.cos(lat * RAD);
    return [c * Math.cos(lon * RAD), c * Math.sin(lon * RAD), Math.sin(lat * RAD)];
  };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]); return [a[0] / l, a[1] / l, a[2] / l]; };
  const toLatLon = (v) => [Math.asin(Math.max(-1, Math.min(1, v[2]))) / RAD, Math.atan2(v[1], v[0]) / RAD];

  /* Points along the great circle a→b; `lift` raises the middle of the arc off the surface. */
  function greatCircle(a, b, n, lift) {
    const d = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
    const s = Math.sin(d) || 1;
    const out = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const ka = Math.sin((1 - t) * d) / s, kb = Math.sin(t * d) / s;
      const h = 1 + lift * Math.sin(Math.PI * t);
      out.push([(ka * a[0] + kb * b[0]) * h, (ka * a[1] + kb * b[1]) * h, (ka * a[2] + kb * b[2]) * h]);
    }
    return out;
  }

  function landPoints() {
    const L = window.LAND, pts = [];
    for (let r = 0; r < L.rows; r++) {
      const lat = 90 - ((r + 0.5) * 180) / L.rows;
      const n = Math.max(1, Math.round((360 * Math.cos(lat * RAD)) / L.step));
      const runs = L.runs[r];
      for (let k = 0; k < runs.length; k += 2)
        for (let i = runs[k]; i < runs[k] + runs[k + 1]; i++) pts.push([lat, -180 + ((i + 0.5) * 360) / n]);
    }
    return pts;
  }

  function prepRoutes(routes) {
    return routes.map((r) => {
      const a = vec(r.from.at), b = vec(r.to.at);
      const d = Math.acos(Math.max(-1, Math.min(1, dot(a, b))));
      const short = d < SHORT;
      return {
        r, a, b, short,
        center: toLatLon(norm([a[0] + b[0], a[1] + b[1], a[2] + b[2]])),
        pts: short ? null : greatCircle(a, b, 72, Math.min(0.22, 0.05 + d * 0.12)),
        flat: greatCircle(a, b, short ? 1 : 96, 0).map(toLatLon),
      };
    });
  }

  /* ---------------------------------------------------------------- canvas globe */
  function canvasGlobe(el, opts) {
    const canvas = document.createElement("canvas");
    canvas.className = "globe__canvas";
    canvas.tabIndex = 0;
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Spinning globe showing six airplane routes. Drag or use the arrow keys to turn it; the route list has the same information.");
    el.appendChild(canvas);
    const ctx = canvas.getContext("2d");

    const land = landPoints().map(vec);
    const N = land.length;
    const sx = new Float32Array(N), sy = new Float32Array(N), sz = new Float32Array(N);
    const routes = prepRoutes(opts.routes);
    const byId = Object.fromEntries(routes.map((r) => [r.r.id, r]));

    let size = 0, R = 0, cx = 0, cy = 0, dpr = 1;
    let lon0 = 20, lat0 = 20;           // view centre, degrees
    let vLon = 0, vLat = 0;             // drag inertia, degrees per ms
    let selected = opts.selected, hover = null;
    let pausedUntil = 0, tween = null, dragging = null;
    let running = false, visible = false, last = 0, raf = 0;
    let screen = {};                    // route id → projected polyline (for hit tests)

    function resize() {
      const w = el.clientWidth;
      if (!w) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = w;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * dpr);
      canvas.style.height = w + "px";
      R = (w / 2) * 0.8;
      cx = cy = w / 2;
      draw(performance.now());
    }

    function frame(now) {
      raf = 0;
      const dt = Math.min(64, now - (last || now));
      last = now;
      if (tween) {
        const k = Math.min(1, (now - tween.t0) / tween.dur);
        const e = 1 - Math.pow(1 - k, 3);
        lon0 = tween.lon + tween.dLon * e;
        lat0 = tween.lat + tween.dLat * e;
        if (k >= 1) tween = null;
      } else if (!dragging) {
        if (Math.abs(vLon) > 1e-4 || Math.abs(vLat) > 1e-4) {
          lon0 += vLon * dt; lat0 = clampLat(lat0 + vLat * dt);
          const f = Math.pow(0.93, dt / 16);
          vLon *= f; vLat *= f;
        } else if (now > pausedUntil) {
          lon0 += dt * 0.004; // ~4° a second
        }
      }
      draw(now);
      if (running) raf = requestAnimationFrame(frame);
    }

    const clampLat = (v) => Math.max(-65, Math.min(65, v));

    function draw(now) {
      if (!size) return;
      const cosL = Math.cos(lon0 * RAD), sinL = Math.sin(lon0 * RAD);
      const cosP = Math.cos(lat0 * RAD), sinP = Math.sin(lat0 * RAD);
      const proj = (v, out) => {
        const X = v[0] * cosL + v[1] * sinL, Y = -v[0] * sinL + v[1] * cosL;
        out[0] = cx + R * Y;
        out[1] = cy - R * (cosP * v[2] - sinP * X);
        out[2] = sinP * v[2] + cosP * X;
        return out;
      };

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      // atmosphere + ocean
      let g = ctx.createRadialGradient(cx, cy, R * 0.92, cx, cy, R * 1.16);
      g.addColorStop(0, COL.glow); g.addColorStop(1, "rgba(110, 180, 255, 0)");
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R * 1.16, 0, 7); ctx.fill();
      g = ctx.createRadialGradient(cx - R * 0.35, cy - R * 0.4, R * 0.1, cx, cy, R);
      g.addColorStop(0, COL.oceanIn); g.addColorStop(1, COL.oceanOut);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();

      // land dots, in four depth bands so the limb fades out
      const p = [0, 0, 0];
      for (let i = 0; i < N; i++) { proj(land[i], p); sx[i] = p[0]; sy[i] = p[1]; sz[i] = p[2]; }
      const base = Math.max(1.2, R * 0.0085);
      ctx.fillStyle = COL.land;
      for (let band = 0; band < 4; band++) {
        const lo = band / 4, hi = (band + 1) / 4;
        const s = base * (0.6 + 0.4 * hi);
        ctx.globalAlpha = 0.22 + 0.7 * hi;
        ctx.beginPath();
        for (let i = 0; i < N; i++) {
          const z = sz[i];
          if (z > lo && z <= hi) ctx.rect(sx[i] - s / 2, sy[i] - s / 2, s, s);
        }
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // routes
      screen = {};
      const t = now / 7000;
      const order = routes.slice().sort((a, b) => (a.r.id === selected) - (b.r.id === selected));
      ctx.lineCap = "round"; ctx.lineJoin = "round";
      for (const rt of order) {
        const isSel = rt.r.id === selected, isHover = rt.r.id === hover;
        if (rt.short) { drawPin(rt, proj, now, isSel, isHover); continue; }
        const pts = rt.pts.map((v) => {
          const q = proj(v, [0, 0, 0]);
          const dx = (q[0] - cx) / R, dy = (q[1] - cy) / R;
          q[3] = q[2] > 0 || dx * dx + dy * dy > 1; // in front, or poking out past the limb
          return q;
        });
        screen[rt.r.id] = pts;
        const stroke = (style, width) => {
          ctx.strokeStyle = style; ctx.lineWidth = width; ctx.beginPath();
          let pen = false;
          for (const q of pts) {
            if (!q[3]) { pen = false; continue; }
            pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]);
            pen = true;
          }
          ctx.stroke();
        };
        if (isSel) { stroke(COL.selGlow, 7); stroke(COL.sel, 2.4); }
        else stroke(isHover ? COL.routeHover : COL.route, isHover ? 2 : 1.4);

        // endpoints
        for (const end of [rt.a, rt.b]) {
          const q = proj(end, [0, 0, 0]);
          if (q[2] <= 0) continue;
          ctx.fillStyle = isSel ? COL.sel : "#FFFFFF";
          ctx.beginPath(); ctx.arc(q[0], q[1], isSel ? 3.6 : 2.4, 0, 7); ctx.fill();
        }

        // the plane gliding along the arc
        const phase = (t + rt.r.id.length * 0.137) % 1;
        const i = Math.min(pts.length - 2, Math.floor(phase * (pts.length - 1)));
        const q0 = pts[i], q1 = pts[i + 1];
        if (q0[3] && q1[3]) drawPlane(q0[0], q0[1], Math.atan2(q1[1] - q0[1], q1[0] - q0[0]), isSel);
      }
      if (selected) labels(byId[selected], proj);
    }

    function drawPin(rt, proj, now, isSel, isHover) {
      const q = proj(rt.a, [0, 0, 0]);
      if (q[2] <= 0.05) return;
      screen[rt.r.id] = [[q[0], q[1], q[2], true]];
      const phase = (now / 1600 + rt.r.id.length * 0.31) % 1;
      ctx.strokeStyle = isSel ? COL.sel : "#FFFFFF";
      ctx.globalAlpha = (1 - phase) * 0.8;
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.arc(q[0], q[1], 4 + phase * 12, 0, 7); ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = isSel ? COL.sel : isHover ? "#FFFFFF" : "#DCEBFF";
      ctx.beginPath(); ctx.arc(q[0], q[1], isSel ? 4.4 : 3.4, 0, 7); ctx.fill();
    }

    function drawPlane(x, y, ang, isSel) {
      ctx.save();
      ctx.translate(x, y); ctx.rotate(ang);
      ctx.fillStyle = isSel ? COL.plane : "rgba(255,255,255,0.85)";
      const s = isSel ? 1.25 : 0.9;
      ctx.scale(s, s);
      ctx.beginPath();
      ctx.moveTo(7, 0); ctx.lineTo(-1, -1.4); ctx.lineTo(-3, -6.5); ctx.lineTo(-5, -6.5); ctx.lineTo(-4, -1.4);
      ctx.lineTo(-7, -1.2); ctx.lineTo(-8.5, -3.4); ctx.lineTo(-9.5, -3.4); ctx.lineTo(-9, 0);
      ctx.lineTo(-9.5, 3.4); ctx.lineTo(-8.5, 3.4); ctx.lineTo(-7, 1.2); ctx.lineTo(-4, 1.4);
      ctx.lineTo(-5, 6.5); ctx.lineTo(-3, 6.5); ctx.lineTo(-1, 1.4); ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function labels(rt, proj) {
      const ends = rt.short ? [[rt.a, rt.r.from.city]] : [[rt.a, rt.r.from.code], [rt.b, rt.r.to.code]];
      ctx.font = "600 12px Inter, system-ui, sans-serif";
      ctx.textBaseline = "middle";
      for (const [v, text] of ends) {
        const q = proj(v, [0, 0, 0]);
        if (q[2] <= 0.05) continue;
        const w = ctx.measureText(text).width + 12;
        const x = Math.min(size - w - 4, Math.max(4, q[0] - w / 2)), y = q[1] - 22;
        ctx.fillStyle = "rgba(8, 22, 42, 0.85)";
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y - 10, w, 20, 10) : ctx.rect(x, y - 10, w, 20); ctx.fill();
        ctx.fillStyle = "#FFFFFF";
        ctx.fillText(text, x + 6, y + 0.5);
      }
    }

    function hit(px, py) {
      let best = null, bestD = 16;
      for (const id in screen) {
        const pts = screen[id];
        for (let i = 0; i < pts.length; i++) {
          const a = pts[i];
          if (!a[3]) continue;
          let d;
          const b = pts[i + 1];
          if (b && b[3]) {
            const ux = b[0] - a[0], uy = b[1] - a[1], L2 = ux * ux + uy * uy || 1;
            const k = Math.max(0, Math.min(1, ((px - a[0]) * ux + (py - a[1]) * uy) / L2));
            d = Math.hypot(px - (a[0] + k * ux), py - (a[1] + k * uy));
          } else d = Math.hypot(px - a[0], py - a[1]);
          if (d < bestD) { bestD = d; best = id; }
        }
      }
      return best;
    }

    const local = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const interacted = (type) => { pausedUntil = performance.now() + 4000; opts.onInteract && opts.onInteract(type); };

    canvas.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      const [x, y] = local(e);
      dragging = { x, y, x0: x, y0: y, t: performance.now(), moved: false };
      tween = null; vLon = vLat = 0;
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => {
      const [x, y] = local(e);
      if (!dragging) {
        const h = hit(x, y);
        if (h !== hover) { hover = h; canvas.style.cursor = h ? "pointer" : ""; if (!running) draw(performance.now()); }
        return;
      }
      const now = performance.now(), dt = Math.max(1, now - dragging.t);
      const dLon = -((x - dragging.x) / R) / RAD, dLat = ((y - dragging.y) / R) / RAD;
      lon0 += dLon; lat0 = clampLat(lat0 + dLat);
      vLon = dLon / dt; vLat = dLat / dt;
      dragging.x = x; dragging.y = y; dragging.t = now;
      if (Math.hypot(x - dragging.x0, y - dragging.y0) > 6 && !dragging.moved) {
        dragging.moved = true; canvas.classList.add("is-dragging");
      }
      if (!running) draw(now);
    });
    const endDrag = (e) => {
      if (!dragging) return;
      const d = dragging; dragging = null;
      canvas.classList.remove("is-dragging");
      if (performance.now() - d.t > 80) vLon = vLat = 0; // let go after stopping → no fling
      if (d.moved) { interacted("drag"); return; }
      vLon = vLat = 0;
      if (e.type !== "pointerup") return;
      const id = hit(d.x0, d.y0);
      if (id) { interacted("route"); api.select(id, { rotate: false, user: true }); }
    };
    canvas.addEventListener("pointerup", endDrag);
    canvas.addEventListener("pointercancel", endDrag);
    canvas.addEventListener("pointerleave", () => { if (hover && !dragging) { hover = null; canvas.style.cursor = ""; } });
    canvas.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 30 : 10;
      const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
      if (!moves[e.key]) return;
      e.preventDefault();
      interacted("keys");
      rotateTo(lon0 + moves[e.key][0], lat0 + moves[e.key][1], 350);
    });

    function rotateTo(lon, lat, dur) {
      let dLon = ((lon - lon0) % 360 + 540) % 360 - 180; // shortest way round
      tween = { t0: performance.now(), dur, lon: lon0, lat: lat0, dLon, dLat: clampLat(lat) - lat0 };
      vLon = vLat = 0;
      if (!running) { lon0 += dLon; lat0 = clampLat(lat); tween = null; draw(performance.now()); }
    }

    function setRunning(on) {
      running = on;
      if (on && !raf) { last = 0; raf = requestAnimationFrame(frame); }
      if (!on && raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    new ResizeObserver(resize).observe(el);
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; setRunning(visible && !document.hidden); }).observe(el);
    document.addEventListener("visibilitychange", () => setRunning(visible && !document.hidden));

    const api = {
      select(id, o = {}) {
        if (!byId[id]) return;
        selected = id;
        if (o.rotate !== false) {
          const [lat, lon] = byId[id].center;
          rotateTo(lon, lat - 8, 900);
          pausedUntil = performance.now() + 6000;
        }
        if (!running) draw(performance.now());
        opts.onSelect && opts.onSelect(id, o);
      },
    };
    const [lat, lon] = byId[selected] ? byId[selected].center : [20, 20];
    lon0 = lon; lat0 = clampLat(lat - 8);
    resize();
    return api;
  }

  /* ---------------------------------------------------------------- flat map fallback */
  function flatMap(el, opts) {
    const W = 720, H = 360;
    const X = (lon) => ((lon + 180) / 360) * W, Y = (lat) => ((90 - lat) / 180) * H;
    let d = "";
    for (const [lat, lon] of landPoints()) d += `M${X(lon).toFixed(1)} ${Y(lat).toFixed(1)}h0`;
    const routes = prepRoutes(opts.routes);

    const routeSvg = routes.map((rt) => {
      const { r } = rt;
      if (rt.short) {
        const [lat, lon] = r.from.at;
        return `<g class="map__route" data-route="${r.id}"><circle class="map__hit" cx="${X(lon)}" cy="${Y(lat)}" r="12"/><circle class="map__pin" cx="${X(lon)}" cy="${Y(lat)}" r="4"/></g>`;
      }
      let path = "", prev = null;
      for (const [lat, lon] of rt.flat) {
        path += (prev === null || Math.abs(lon - prev) > 180 ? "M" : "L") + X(lon).toFixed(1) + " " + Y(lat).toFixed(1);
        prev = lon;
      }
      const ends = [r.from.at, r.to.at].map(([lat, lon]) => `<circle class="map__end" cx="${X(lon)}" cy="${Y(lat)}" r="3"/>`).join("");
      return `<g class="map__route" data-route="${r.id}"><path class="map__hit" d="${path}"/><path class="map__line" d="${path}"/>${ends}</g>`;
    }).join("");

    el.innerHTML =
      `<svg class="map" viewBox="0 0 ${W} ${H}" role="img" aria-label="World map showing six airplane routes; the route list has the same information.">` +
      `<rect width="${W}" height="${H}" rx="18" class="map__sea"/>` +
      `<path class="map__land" d="${d}"/>${routeSvg}<g class="map__labels"></g></svg>`;
    const svgEl = el.querySelector("svg"), labelsEl = el.querySelector(".map__labels");
    const byId = Object.fromEntries(routes.map((r) => [r.r.id, r]));

    function paint(id) {
      svgEl.querySelectorAll(".map__route").forEach((g) => g.classList.toggle("is-selected", g.dataset.route === id));
      const sel = svgEl.querySelector(`.map__route[data-route="${id}"]`);
      if (sel) sel.parentNode.insertBefore(sel, labelsEl); // selected route on top
      const r = byId[id].r;
      const ends = byId[id].short ? [[r.from.at, r.from.city]] : [[r.from.at, r.from.code], [r.to.at, r.to.code]];
      labelsEl.innerHTML = ends.map(([[lat, lon], text]) => {
        const w = text.length * 7.4 + 14, x = Math.min(W - w - 4, Math.max(4, X(lon) - w / 2)), y = Y(lat) - 26;
        return `<rect x="${x}" y="${y}" width="${w}" height="20" rx="10"/><text x="${x + w / 2}" y="${y + 14}" text-anchor="middle">${text}</text>`;
      }).join("");
    }

    svgEl.addEventListener("click", (e) => {
      const g = e.target.closest(".map__route");
      if (!g) return;
      opts.onInteract && opts.onInteract("route");
      api.select(g.dataset.route, { user: true });
    });

    const api = { select(id, o = {}) { if (!byId[id]) return; paint(id); opts.onSelect && opts.onSelect(id, o); } };
    paint(opts.selected);
    return api;
  }

  window.Globe = {
    mount(el, opts) {
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const c = document.createElement("canvas");
      const ok = !!(c.getContext && c.getContext("2d")) && "ResizeObserver" in window && "IntersectionObserver" in window;
      el.classList.add(ok && !reduce ? "is-globe" : "is-map");
      if (el.parentElement) el.parentElement.classList.toggle("has-map", !(ok && !reduce));
      return ok && !reduce ? canvasGlobe(el, opts) : flatMap(el, opts);
    },
  };
})();
