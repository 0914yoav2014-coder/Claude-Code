/* Airplanes Around the World: page behaviour. Content lives in data.js. */
(function () {
  "use strict";

  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const planes = Object.fromEntries(PLANES.map((p) => [p.id, p]));
  const routes = Object.fromEntries(ROUTES.map((r) => [r.id, r]));
  const art = (id, uid) => (window.PLANE_ART[id] ? window.PLANE_ART[id](uid) : "");
  const arrow = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 12h15m-5-5.5 5.5 5.5-5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  /* ---------------------------------------------------------------- analytics (F8)
   * Pushes to window.dataLayer (Google Tag Manager, Plausible's GTM bridge, etc.) when
   * present, and always fires an "aatw:track" DOM event a tag manager can listen for. */
  const sent = new Set();
  function track(name, props = {}, once = false) {
    if (once) { if (sent.has(name)) return; sent.add(name); }
    const payload = Object.assign({ event: name }, props);
    if (Array.isArray(window.dataLayer)) window.dataLayer.push(payload);
    document.dispatchEvent(new CustomEvent("aatw:track", { detail: payload }));
  }

  /* ---------------------------------------------------------------- theme toggle (F10) */
  const root = document.documentElement, themeBtn = $("#theme-toggle");
  const isDark = () => root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  const syncThemeLabel = () => themeBtn.setAttribute("aria-label", isDark() ? "Switch to light mode" : "Switch to dark mode");
  themeBtn.addEventListener("click", () => {
    root.dataset.theme = isDark() ? "light" : "dark";
    try { localStorage.setItem("aatw-theme", root.dataset.theme); } catch (e) {}
    syncThemeLabel();
  });
  syncThemeLabel();

  /* ---------------------------------------------------------------- nav */
  const nav = $("#nav"), navToggle = $("#nav-toggle");
  const setMenu = (open) => {
    nav.classList.toggle("is-open", open);
    navToggle.setAttribute("aria-expanded", String(open));
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  };
  navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("is-open")));
  $("#nav-menu").addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { setMenu(false); navToggle.focus(); } });
  const solid = () => nav.classList.toggle("is-solid", window.scrollY > 24);
  addEventListener("scroll", solid, { passive: true });
  solid();

  document.querySelectorAll("[data-start]").forEach((a) =>
    a.addEventListener("click", () => track("start_exploring_click", { location: a.dataset.start })));

  /* ---------------------------------------------------------------- illustrations already in the markup */
  document.querySelectorAll("[data-art]").forEach((el) => { el.innerHTML = art(el.dataset.art, el.dataset.uid || "x"); });

  /* ---------------------------------------------------------------- airplane cards (F4) */
  $("#cards").innerHTML = PLANES.map((p) => `
    <article class="card">
      <div class="card__art">${art(p.id, "card")}</div>
      <div class="card__body">
        <span class="tag">${esc(p.nickname)}</span>
        <h3>${esc(p.name)}</h3>
        <dl class="stats">
          <div><dt>Cruising speed</dt><dd>${esc(p.speed)}</dd></div>
          <div><dt>Passengers</dt><dd>${esc(p.passengers)}${p.passengersNote ? `<small>${esc(p.passengersNote)}</small>` : ""}</dd></div>
        </dl>
        <p class="card__fact"><strong>Fun fact:</strong> ${esc(p.fact)}</p>
        <div class="card__actions">
          <button class="btn btn--quiet" type="button" data-open="${p.id}">More details</button>
          <button class="btn btn--quiet" type="button" data-show="${p.route}">See its route</button>
        </div>
      </div>
    </article>`).join("");

  /* ---------------------------------------------------------------- fun facts (F7) */
  $("#facts-list").innerHTML = FACTS.map((f) => `
    <li class="fact">
      <span class="fact__number">${esc(f.number)}</span>
      <span class="fact__unit">${esc(f.unit)}</span>
      <p>${esc(f.text)}</p>
      <a class="fact__source" href="${esc(f.source)}" rel="noopener" target="_blank">Source: ${esc(f.sourceLabel)}</a>
    </li>`).join("");

  /* ---------------------------------------------------------------- routes + globe (F2, F3) */
  const routeCard = $("#route-card"), routeList = $("#route-list");
  let selected = routes[CONFIG.defaultRoute] ? CONFIG.defaultRoute : ROUTES[0].id;
  let globe = null;

  routeList.innerHTML = ROUTES.map((r) => `
    <li><button class="route-btn" type="button" data-route="${r.id}" aria-pressed="false">
      <span class="route-btn__dot" aria-hidden="true"></span>
      <span class="route-btn__text"><strong>${esc(r.from.city)} → ${esc(r.to.city)}</strong><span>${esc(planes[r.plane].name)}</span></span>
      <span class="route-btn__dist">${esc(r.distance)}</span>
    </button></li>`).join("");

  function renderRoute(id) {
    const r = routes[id], p = planes[r.plane];
    routeCard.innerHTML = `
      <div class="route-card__top">
        <div class="route-card__art" aria-hidden="true">${art(p.id, "route")}</div>
        <div>
          <p class="route-card__plane">${esc(p.nickname)}</p>
          <h3>${esc(p.name)}</h3>
        </div>
      </div>
      <p class="route-card__path">
        <span>${esc(r.from.city)} <small>${esc(r.from.code)}</small></span>${arrow}<span>${esc(r.to.city)} <small>${esc(r.to.code)}</small></span>
      </p>
      <dl>
        <div><dt>Distance</dt><dd>${esc(r.distance)}</dd></div>
        <div><dt>Flight time</dt><dd>${esc(r.time)}</dd></div>
        <div><dt>Airline</dt><dd>${esc(r.airline)}${r.flight ? ` · ${esc(r.flight)}` : ""}</dd></div>
      </dl>
      <p class="route-card__note">${esc(r.note)}</p>
      <button class="btn btn--ghost" type="button" data-open="${p.id}">Meet the ${esc(p.name.replace(/^(Airbus|Boeing|DHC-6|Britten-Norman) /, ""))}</button>`;
    routeList.querySelectorAll(".route-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.route === id)));
  }

  function selectRoute(id, opts = {}) {
    selected = id;
    if (globe) globe.select(id, opts); else renderRoute(id);
  }

  routeList.addEventListener("click", (e) => {
    const b = e.target.closest(".route-btn");
    if (!b) return;
    track("globe_interact", { type: "list", route: b.dataset.route });
    selectRoute(b.dataset.route);
  });

  renderRoute(selected);

  // The globe loads only once its section is near the screen, so the hero paints first.
  const mountEl = $("#globe-mount");
  const mount = () => {
    if (globe || !window.Globe) return;
    globe = window.Globe.mount(mountEl, {
      routes: ROUTES,
      selected,
      onSelect: (id, o) => {
        selected = id;
        renderRoute(id);
        if (o && o.user) track("globe_interact", { type: "route", route: id });
      },
      // route picks are tracked by onSelect; drags and arrow keys once per visit
      onInteract: (type) => { if (type !== "route") track("globe_interact", { type }, true); },
    });
  };
  const whenIdle = window.requestIdleCallback ? (fn) => requestIdleCallback(fn, { timeout: 800 }) : (fn) => setTimeout(fn, 1);
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      if (entries.some((en) => en.isIntersecting)) { io.disconnect(); whenIdle(mount); }
    }, { rootMargin: "300px 0px" });
    io.observe(mountEl);
  } else mount();

  /* ---------------------------------------------------------------- airplane details dialog */
  const dialog = $("#plane-dialog"), sheet = $("#sheet-body");
  function openPlane(id) {
    const p = planes[id], r = routes[p.route];
    sheet.innerHTML = `
      <button class="icon-btn sheet__close" type="button" data-close aria-label="Close">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>
      </button>
      <div class="sheet__art" aria-hidden="true">${art(p.id, "sheet")}</div>
      <div class="sheet__body">
        <span class="tag">${esc(p.nickname)}</span>
        <h2 id="sheet-title">${esc(p.name)}</h2>
        <p class="sheet__story">${esc(p.story)}</p>
        <dl>
          <div><dt>Made by</dt><dd>${esc(p.maker)}</dd></div>
          <div><dt>First flight</dt><dd>${esc(p.firstFlight)}</dd></div>
          <div><dt>Cruising speed</dt><dd>${esc(p.speed)}</dd></div>
          <div><dt>Passengers</dt><dd>${esc(p.passengers)}${p.passengersNote ? ` (${esc(p.passengersNote)})` : ""}</dd></div>
          <div><dt>Famous route</dt><dd>${esc(r.from.city)} → ${esc(r.to.city)}</dd></div>
          <div><dt>Distance · time</dt><dd>${esc(r.distance)} · ${esc(r.time)}</dd></div>
        </dl>
        <p class="sheet__fact"><strong>Fun fact:</strong> ${esc(p.fact)}</p>
        <p class="sheet__source"><a href="${esc(p.source)}" rel="noopener" target="_blank">Source</a></p>
        <div class="sheet__actions">
          <button class="btn btn--primary" type="button" data-show="${p.route}">See it on the globe</button>
          <button class="btn btn--quiet" type="button" data-close>Close</button>
        </div>
      </div>`;
    if (typeof dialog.showModal === "function") dialog.showModal(); else dialog.setAttribute("open", "");
    track("plane_details_open", { plane: id });
  }
  const closeDialog = () => { if (dialog.open) dialog.close ? dialog.close() : dialog.removeAttribute("open"); };
  dialog.addEventListener("click", (e) => {
    if (e.target === dialog || e.target.closest("[data-close]")) closeDialog(); // backdrop or close button
  });

  // One delegated handler for every "More details" and "See its route" button on the page.
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) { openPlane(open.dataset.open); return; }
    const show = e.target.closest("[data-show]");
    if (show) {
      closeDialog();
      selectRoute(show.dataset.show);
      $("#globe").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      const btn = routeList.querySelector(`[data-route="${show.dataset.show}"]`);
      if (btn) btn.focus({ preventScroll: true });
      track("globe_interact", { type: "card", route: show.dataset.show });
    }
  });

  /* ---------------------------------------------------------------- email sign-up (F5) */
  const form = $("#signup-form"), email = $("#signup-email"), age = $("#signup-age"), status = $("#signup-status");
  const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  const say = (msg, kind) => { status.textContent = msg; status.className = "signup__status" + (kind ? " is-" + kind : ""); };
  email.addEventListener("input", () => { if (email.getAttribute("aria-invalid")) { email.removeAttribute("aria-invalid"); say(""); } });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const value = email.value.trim();
    if (!value) { email.setAttribute("aria-invalid", "true"); email.focus(); return say("Please type your email address.", "error"); }
    if (!EMAIL.test(value)) { email.setAttribute("aria-invalid", "true"); email.focus(); return say("That email doesn't look right. Check for typos, like a missing @ or dot.", "error"); }
    if (!age.checked) { age.focus(); return say("Please tick the box to confirm your age, or ask a parent first.", "error"); }

    const btn = form.querySelector("button[type=submit]");
    btn.disabled = true;
    say("Signing you up…");
    try {
      if (CONFIG.signupEndpoint) {
        const res = await fetch(CONFIG.signupEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: value, ageConfirmed: true, consentText: age.parentElement.textContent.trim(), at: new Date().toISOString() }),
        });
        if (!res.ok) throw new Error(String(res.status));
      } else {
        await new Promise((r) => setTimeout(r, 400)); // preview: no endpoint configured yet
      }
      form.reset();
      say("You're on the list! Your first airplane lands in your inbox next week.", "ok");
      track("signup_success");
    } catch (err) {
      say("Sorry, something went wrong on our side. Please try again in a minute.", "error");
      track("signup_error", { reason: String(err && err.message) });
    } finally {
      btn.disabled = false;
    }
  });

  /* ---------------------------------------------------------------- footer */
  if (CONFIG.contactEmail) {
    const li = $("[data-contact]");
    li.hidden = false;
    li.querySelector("a").href = "mailto:" + CONFIG.contactEmail;
  }
  $("#footer-social").innerHTML = (CONFIG.social || []).map((s) => `<li><a href="${esc(s.url)}" rel="noopener">${esc(s.label)}</a></li>`).join("");
  if (!(CONFIG.social || []).length) $("#footer-social").remove();
  $("#year").textContent = new Date().getFullYear();
})();
