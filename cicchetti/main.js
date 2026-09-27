/* Cicchetti — interactions. Vanilla JS, no dependencies (~10KB unminified). */
(() => {
  "use strict";

  const { CONFIG, i18n, menu, drinks, gallery, reviews, hours } = window.CICCHETTI;
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch { /* storage blocked */ } }
  };

  /* ---------------- Language ---------------- */
  const params = new URLSearchParams(location.search);
  let lang = params.get("lang") || store.get("cicchetti.lang") || "en";
  if (!i18n[lang]) lang = "en";
  const t = (key) => i18n[lang][key] ?? i18n.en[key] ?? key;
  const pick = (obj) => (obj && (obj[lang] || obj.en)) || "";

  function applyLang() {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === "he" ? "rtl" : "ltr";
    $$("[data-i18n]").forEach((el) => { el.innerHTML = t(el.dataset.i18n); });
    $$("[data-i18n-aria]").forEach((el) => el.setAttribute("aria-label", t(el.dataset.i18nAria)));
    const langBtn = $("#lang");
    langBtn.lang = lang === "he" ? "en" : "he";
    renderMenu(currentTab, false);
    renderDrinks();
    renderGallery();
    renderReviews();
    renderHours();
    requestAnimationFrame(moveInk);
  }

  $("#lang").addEventListener("click", () => {
    lang = lang === "en" ? "he" : "en";
    store.set("cicchetti.lang", lang);
    const url = new URL(location.href);
    lang === "he" ? url.searchParams.set("lang", "he") : url.searchParams.delete("lang");
    history.replaceState(null, "", url);
    applyLang();
  });

  /* ---------------- Config-driven links ---------------- */
  $$(".js-book").forEach((a) => (a.href = CONFIG.bookingUrl));
  $$(".js-phone").forEach((a) => (a.href = CONFIG.phoneHref));
  $$(".js-phone-text").forEach((s) => (s.textContent = CONFIG.phone));
  $$(".js-ig").forEach((a) => (a.href = CONFIG.instagram));
  $$(".js-fb").forEach((a) => (a.href = CONFIG.facebook));
  $$(".js-directions").forEach((a) => (a.href = CONFIG.directionsUrl));
  $("#year").textContent = new Date().getFullYear();

  if (CONFIG.draft && store.get("cicchetti.draftDismissed") !== "1") {
    const banner = $("#draft");
    banner.hidden = false;
    const setH = () => document.documentElement.style.setProperty("--draft-h", banner.hidden ? "0px" : `${banner.offsetHeight}px`);
    setH();
    new ResizeObserver(setH).observe(banner); // re-measure when the language swaps the text
    $(".draft__close", banner).addEventListener("click", () => {
      banner.hidden = true;
      setH();
      store.set("cicchetti.draftDismissed", "1");
    });
  }

  /* ---------------- Shared: placeholder frame ---------------- */
  // Real photography replaces these: pass { src, alt } and an <img> renders instead.
  function frame({ shot, cls = "", src, alt = "", tag }) {
    const div = document.createElement("div");
    div.className = `ph ${cls}`;
    if (src) {
      div.innerHTML = `<img src="${src}" alt="${alt}" loading="lazy" decoding="async">`;
      div.dataset.shot = "";
    } else {
      div.dataset.shot = `${t("shot")} · ${shot}`;
      div.setAttribute("role", "img");
      div.setAttribute("aria-label", `${t("shot")}: ${shot}`);
    }
    if (tag) div.insertAdjacentHTML("afterbegin", `<span class="ph__tag">${tag}</span>`);
    return div;
  }
  const sampleTag = (item) => (CONFIG.draft && item.sample ? `<span class="tag">${t("sample")}</span>` : "");

  /* ---------------- Nav ---------------- */
  const nav = $("#nav");
  const hero = $(".hero");
  new IntersectionObserver(([e]) => nav.classList.toggle("is-solid", !e.isIntersecting), {
    rootMargin: `-${parseInt(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 72}px 0px 0px 0px`
  }).observe(hero);

  const burger = $("#burger");
  const drawer = $("#drawer");
  function setDrawer(open) {
    burger.setAttribute("aria-expanded", String(open));
    drawer.hidden = !open;
    document.body.classList.toggle("menu-open", open);
    nav.classList.toggle("is-solid", open || hero.getBoundingClientRect().bottom < 72);
    if (open) $("a", drawer).focus();
  }
  burger.addEventListener("click", () => setDrawer(burger.getAttribute("aria-expanded") !== "true"));
  drawer.addEventListener("click", (e) => { if (e.target.closest("a")) setDrawer(false); });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !drawer.hidden) { setDrawer(false); burger.focus(); }
  });

  // Current-section indicator
  const navLinks = $$(".nav__links a");
  const sectionObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      navLinks.forEach((a) => a.setAttribute("aria-current", String(a.hash === `#${e.target.id}`)));
    });
  }, { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => sectionObs.observe(s));

  /* ---------------- Hero: optional video + parallax ---------------- */
  const heroMedia = $("#heroMedia");
  const saveData = navigator.connection && navigator.connection.saveData;
  if (CONFIG.heroVideo && !saveData && !reduceMotion.matches) {
    const v = document.createElement("video");
    Object.assign(v, { muted: true, loop: true, autoplay: true, playsInline: true, poster: CONFIG.heroVideo.poster || "" });
    v.setAttribute("aria-hidden", "true");
    if (CONFIG.heroVideo.webm) v.insertAdjacentHTML("beforeend", `<source src="${CONFIG.heroVideo.webm}" type="video/webm">`);
    if (CONFIG.heroVideo.mp4) v.insertAdjacentHTML("beforeend", `<source src="${CONFIG.heroVideo.mp4}" type="video/mp4">`);
    heroMedia.prepend(v);
  }

  let ticking = false;
  function parallax() {
    ticking = false;
    if (reduceMotion.matches) return;
    const y = scrollY;
    if (y > innerHeight * 1.2) return;
    heroMedia.style.transform = `translate3d(0, ${y * 0.1}px, 0)`; // → 0.9× scroll speed
    $(".hero__inner").style.opacity = String(Math.max(0, 1 - y / (innerHeight * 0.7)));
  }
  addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(parallax); } }, { passive: true });

  /* ---------------- Reveal on scroll ---------------- */
  const revealObs = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      revealObs.unobserve(e.target);
    });
  }, { rootMargin: "0px 0px -10% 0px", threshold: 0.05 });
  function observeReveals(root = document) {
    // Stagger siblings within the same parent
    const groups = new Map();
    $$(".reveal:not(.is-in), .person__img:not(.is-in)", root).forEach((el) => {
      const k = el.parentElement;
      const i = groups.get(k) || 0;
      groups.set(k, i + 1);
      el.style.setProperty("--d", i);
      revealObs.observe(el);
    });
  }

  /* ---------------- Menu tabs ---------------- */
  const tabs = $$("#tabs [role=tab]");
  const panel = $("#panel");
  const ink = $(".tabs__ink");
  let currentTab = "aperitivo";

  function moveInk() {
    const active = tabs.find((b) => b.dataset.tab === currentTab);
    if (!active) return;
    const parent = active.parentElement.getBoundingClientRect();
    const r = active.getBoundingClientRect();
    ink.style.width = `${r.width}px`;
    ink.style.transform = `translateX(${r.left - parent.left + active.parentElement.scrollLeft}px)`;
  }
  addEventListener("resize", moveInk);

  function renderMenu(key, animate = true) {
    currentTab = key;
    tabs.forEach((b) => {
      const on = b.dataset.tab === key;
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    panel.setAttribute("aria-labelledby", `tab-${key}`);
    moveInk();

    const build = () => {
      panel.innerHTML = "";
      menu[key].forEach((item, i) => {
        const d = pick(item);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "dish";
        btn.style.setProperty("--i", i);
        const wrap = document.createElement("div");
        wrap.className = "dish__imgwrap";
        wrap.append(frame({ shot: item.shot, src: item.src, alt: d.name }));
        btn.append(wrap);
        btn.insertAdjacentHTML("beforeend",
          `<h3 class="dish__name">${d.name}${sampleTag(item)}</h3><p class="dish__desc">${d.desc}</p>`);
        btn.addEventListener("click", () => openLightbox({ title: d.name, desc: d.desc, shot: item.shot, src: item.src }, btn));
        panel.append(btn);
      });
      panel.scrollLeft = 0;
    };

    if (!animate || reduceMotion.matches) { build(); return; }
    panel.classList.add("is-swapping");
    setTimeout(() => {
      build();
      panel.classList.add("is-swapping");
      requestAnimationFrame(() => requestAnimationFrame(() => panel.classList.remove("is-swapping")));
    }, 220);
  }

  tabs.forEach((b) => b.addEventListener("click", () => { if (b.dataset.tab !== currentTab) renderMenu(b.dataset.tab); }));
  $("#tabs").addEventListener("keydown", (e) => {
    const keys = document.documentElement.dir === "rtl" ? ["ArrowLeft", "ArrowRight"] : ["ArrowRight", "ArrowLeft"];
    const idx = tabs.findIndex((b) => b.dataset.tab === currentTab);
    let next = null;
    if (e.key === keys[0]) next = (idx + 1) % tabs.length;
    else if (e.key === keys[1]) next = (idx - 1 + tabs.length) % tabs.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = tabs.length - 1;
    if (next === null) return;
    e.preventDefault();
    renderMenu(tabs[next].dataset.tab);
    tabs[next].focus();
  });

  /* ---------------- Drinks ---------------- */
  function renderDrinks() {
    $("#drinks").innerHTML = drinks.map((dr) => {
      const d = pick(dr);
      return `<li><strong>${d.name}${sampleTag(dr)}</strong><span class="note">${d.note}</span></li>`;
    }).join("");
  }

  /* ---------------- Gallery ---------------- */
  const shapeClass = { wide: "ph--wide", tall: "ph--gtall", square: "ph--square" };
  const shapeRatio = { wide: "3 / 2", tall: "2 / 3", square: "1" };
  function renderGallery() {
    const ul = $("#masonry");
    ul.innerHTML = "";
    gallery.forEach((g) => {
      const li = document.createElement("li");
      const btn = document.createElement("button");
      btn.type = "button";
      const label = pick(g.shot);
      btn.setAttribute("aria-label", label);
      btn.append(frame({ shot: label, cls: `${shapeClass[g.shape]}${g.tone === "dark" ? " ph--dark" : ""}`, src: g.src, alt: g.alt && pick(g.alt) }));
      btn.addEventListener("click", () => openLightbox({ shot: label, src: g.src, gallery: true, ratio: shapeRatio[g.shape] }, btn));
      // 2–4px cursor-follow tactility on fine pointers only
      btn.addEventListener("pointermove", (e) => {
        if (e.pointerType !== "mouse" || reduceMotion.matches) return;
        const r = btn.getBoundingClientRect();
        btn.style.setProperty("--mx", `${((e.clientX - r.left) / r.width - 0.5) * 6}px`);
        btn.style.setProperty("--my", `${((e.clientY - r.top) / r.height - 0.5) * 6}px`);
      });
      li.append(btn);
      ul.append(li);
    });
  }

  /* ---------------- Reviews ---------------- */
  let reviewTimer = null;
  function renderReviews() {
    const box = $("#quotes");
    clearInterval(reviewTimer);
    const r = CONFIG.rating;
    const ratingEl = $("#rating");
    if (r && r.value) {
      ratingEl.hidden = false;
      ratingEl.innerHTML = `<strong>${r.value.toFixed(1)}</strong><span class="ltr">★</span> · ${r.count.toLocaleString(lang === "he" ? "he-IL" : "en-US")} · ${r.source}`;
    }
    if (!reviews.length) {
      box.innerHTML = `<p class="quotes__empty">${t("reviews.empty")}</p>`;
      return;
    }
    box.innerHTML = reviews.map((rv, i) =>
      `<figure class="quote" ${i ? "hidden" : ""} aria-roledescription="slide" aria-label="${i + 1} / ${reviews.length}">
         <blockquote><p>${pick(rv.text)}</p></blockquote>
         <footer>— ${rv.source}${rv.date ? `, ${rv.date}` : ""}</footer>
       </figure>`).join("") +
      `<div class="quotes__ctrl">
         <button type="button" data-dir="-1" aria-label="${t("reviews.prev")}"><span>←</span></button>
         <button type="button" data-dir="1" aria-label="${t("reviews.next")}"><span>→</span></button>
       </div>`;
    const slides = $$(".quote", box);
    let at = 0;
    const show = (n) => {
      at = (n + slides.length) % slides.length;
      slides.forEach((s, i) => (s.hidden = i !== at));
    };
    $$(".quotes__ctrl button", box).forEach((b) => b.addEventListener("click", () => show(at + Number(b.dataset.dir))));
    const start = () => { if (!reduceMotion.matches) reviewTimer = setInterval(() => show(at + 1), 7000); };
    const stop = () => clearInterval(reviewTimer);
    ["mouseenter", "focusin", "touchstart"].forEach((ev) => box.addEventListener(ev, stop, { passive: true }));
    ["mouseleave", "focusout"].forEach((ev) => box.addEventListener(ev, () => { stop(); start(); }));
    start();
  }

  /* ---------------- Hours ---------------- */
  function renderHours() {
    $("#hours").innerHTML = hours.rows.map((row) =>
      `<dt>${pick(row.days)}</dt><dd>${row.slots.map((s) =>
        `<span><b>${t(`slot.${s.name}`)}</b><span class="ltr">${s.time}</span></span>`).join("")}</dd>`).join("");
    $(".js-hours-verify").hidden = !(CONFIG.draft && hours.verify);
  }

  /* ---------------- Location hover → pin ---------------- */
  const loc = $("#location");
  $("#infoCard").addEventListener("mouseenter", () => loc.classList.add("is-hover"));
  $("#infoCard").addEventListener("mouseleave", () => loc.classList.remove("is-hover"));

  // Palette-styled Google Map when a key is configured (brief §6.7)
  if (CONFIG.googleMapsApiKey) {
    window.__initCicchettiMap = () => {
      // Geocode the verified street address rather than hardcoding coordinates.
      new google.maps.Geocoder().geocode({ address: "58 Yehuda HaLevi St, Tel Aviv-Yafo, Israel" }, (res, status) => {
        if (status !== "OK" || !res[0]) return; // designed fallback card stays visible
        const pos = res[0].geometry.location;
        const map = new google.maps.Map($("#map"), {
          center: pos, zoom: 16, disableDefaultUI: true, zoomControl: true,
          styles: [
            { elementType: "geometry", stylers: [{ color: "#EFE6D6" }] },
            { elementType: "labels.text.fill", stylers: [{ color: "#5A4F47" }] },
            { elementType: "labels.text.stroke", stylers: [{ color: "#F6EFE4" }] },
            { featureType: "road", elementType: "geometry", stylers: [{ color: "#D7C9AF" }] },
            { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#CDBB9C" }] },
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "poi.park", elementType: "geometry", stylers: [{ visibility: "on" }, { color: "#C9CDB0" }] },
            { featureType: "transit", stylers: [{ visibility: "off" }] },
            { featureType: "water", stylers: [{ color: "#C8C9BD" }] }
          ]
        });
        new google.maps.Marker({
          position: pos, map, title: "Cicchetti",
          icon: { path: google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#B5562F", fillOpacity: 1, strokeColor: "#F6EFE4", strokeWeight: 3 }
        });
      });
    };
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(CONFIG.googleMapsApiKey)}&callback=__initCicchettiMap`;
    s.async = true;
    document.head.append(s);
  }

  /* ---------------- Lightbox ---------------- */
  const lb = $("#lightbox");
  let lbReturn = null;
  function openLightbox({ title = "", desc = "", shot, src, gallery: isGallery, ratio }, from) {
    lbReturn = from;
    lb.classList.toggle("lightbox--gallery", !!isGallery);
    lb.style.setProperty("--lb-ar", ratio || "3 / 2");
    const media = $("#lbMedia");
    media.innerHTML = "";
    media.append(frame({ shot, src, alt: title || shot }));
    $("#lb-title").textContent = title || shot;
    $("#lbDesc").textContent = desc;
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    $("#lbClose").focus();
  }
  function closeLightbox() {
    if (lb.hidden) return;
    lb.hidden = true;
    document.body.style.overflow = "";
    if (lbReturn) lbReturn.focus();
  }
  $("#lbClose").addEventListener("click", closeLightbox);
  lb.addEventListener("click", (e) => { if (e.target === lb) closeLightbox(); });
  addEventListener("keydown", (e) => {
    if (lb.hidden) return;
    if (e.key === "Escape") closeLightbox();
    if (e.key === "Tab") { e.preventDefault(); $("#lbClose").focus(); } // only one focusable control
  });
  // Swipe down to close on touch
  let touchY = null;
  lb.addEventListener("touchstart", (e) => (touchY = e.touches[0].clientY), { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (touchY !== null && e.changedTouches[0].clientY - touchY > 80) closeLightbox();
    touchY = null;
  });

  /* ---------------- Amici form ---------------- */
  const form = $("#amiciForm");
  const fields = {
    name: [$("#f-name"), $("#e-name"), (v) => v.trim().length > 0, "amici.errName"],
    email: [$("#f-email"), $("#e-email"), (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()), "amici.errEmail"],
    consent: [$("#f-consent"), $("#e-consent"), (_, el) => el.checked, "amici.errConsent"]
  };
  function check(key) {
    const [el, err, ok, msg] = fields[key];
    const valid = ok(el.value, el);
    el.setAttribute("aria-invalid", String(!valid));
    err.textContent = valid ? "" : t(msg);
    return valid;
  }
  Object.keys(fields).forEach((k) => {
    const el = fields[k][0];
    // Re-validate live once a field has been flagged, so errors clear as the guest types
    const evs = el.type === "checkbox" ? ["change"] : ["input", "blur"];
    evs.forEach((ev) => el.addEventListener(ev, () => { if (el.getAttribute("aria-invalid")) check(k); }));
  });
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    form.classList.add("was-validated");
    const results = Object.keys(fields).map(check);
    if (results.includes(false)) {
      fields[Object.keys(fields)[results.indexOf(false)]][0].focus();
      return;
    }
    const data = {
      firstName: $("#f-name").value.trim(), email: $("#f-email").value.trim(), phone: $("#f-phone").value.trim(),
      consent: true, consentText: t("amici.consent"), consentAt: new Date().toISOString(), lang
    };
    const ok = $("#amiciOk");
    const submit = $("button[type=submit]", form);
    submit.disabled = true;
    try {
      if (CONFIG.amiciEndpoint) {
        const res = await fetch(CONFIG.amiciEndpoint, {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data)
        });
        if (!res.ok) throw new Error(res.status);
        ok.innerHTML = t("amici.ok");
      } else {
        ok.innerHTML = `${t("amici.ok")}${CONFIG.draft ? `<small>${t("amici.preview")}</small>` : ""}`;
      }
      $$(".field, button[type=submit]", form).forEach((el) => (el.hidden = true));
      ok.hidden = false;
      ok.setAttribute("tabindex", "-1");
      ok.focus();
    } catch {
      ok.hidden = false;
      ok.textContent = t("amici.errSend");
      submit.disabled = false;
    }
  });

  /* ---------------- Boot ---------------- */
  applyLang();
  observeReveals();
  // Hero is above the fold: reveal it on load rather than waiting for the observer
  requestAnimationFrame(() => $$(".hero .reveal").forEach((el) => el.classList.add("is-in")));
  parallax();
})();
