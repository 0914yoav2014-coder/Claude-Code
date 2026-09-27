/*
 * Line illustrations (Via Carota-style menu drawings). They fill any image slot
 * that has no photo yet, so the page reads as designed rather than empty.
 * Once a real photo is set (`src` in content.js) the photo replaces them.
 * All drawings: 64×64 viewBox, stroke = currentColor, no fills.
 */
window.CICCHETTI_ILLOS = (() => {
  const svg = (body) =>
    `<svg class="illo" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;

  return {
    spritz: svg(`
      <path d="M19 14h22l-2.6 19a8.4 8.4 0 0 1-16.8 0z"/>
      <path d="M20.2 21h19.6"/><path d="M30 42v13"/><path d="M23 56h14"/>
      <circle cx="43" cy="14" r="6.5"/><path d="M43 7.5v13M36.5 14h13M38.4 9.4l9.2 9.2M47.6 9.4l-9.2 9.2"/>
      <path d="M34 5l-4.5 29"/>
      <circle cx="26" cy="27" r="1"/><circle cx="31" cy="30" r="1"/><circle cx="34" cy="25" r="1"/>`),

    wine: svg(`
      <path d="M22 8h20l-1.5 16a8.5 8.5 0 0 1-17 0z"/><path d="M22.8 17h18.4"/>
      <path d="M32 33v18"/><path d="M24 56h16"/>`),

    pasta: svg(`
      <path d="M9 32h46c0 11-10 20-23 20S9 43 9 32z"/>
      <path d="M17 32c2-7 10-10 15-6 5-4 13-1 15 6"/>
      <path d="M22 32c2-4 7-5 10-2 3-3 8-2 10 2"/>
      <path d="M44 6l-9 22M47 7l-9 22"/><path d="M38.5 26.5l4.5 1.8"/>
      <path d="M24 56h16"/>`),

    bread: svg(`
      <path d="M8 30q0-9 9-9h30q9 0 9 9v11q0 7-7 7H15q-7 0-7-7z"/>
      <circle cx="18" cy="30" r="1.3"/><circle cx="27" cy="36" r="1.3"/><circle cx="36" cy="29" r="1.3"/>
      <circle cx="45" cy="36" r="1.3"/><circle cx="22" cy="41" r="1.3"/><circle cx="40" cy="42" r="1.3"/>
      <path d="M30 14c6-5 14-5 20-2"/><path d="M36 11.5l-1.5-3M41 10.5l-.5-3.5M46 11l1-3.2"/>`),

    fish: svg(`
      <path d="M8 32c9-11 27-13 37 0-10 13-28 11-37 0z"/>
      <path d="M45 32l11-9v18z"/><circle cx="17" cy="30" r="1.4"/>
      <path d="M26 25c3 4 3 10 0 14M33 24.5c2.5 4.5 2.5 10.5 0 15"/>
      <path d="M12 50c5 3 11 3 16 0s11-3 16 0 11 3 16 0"/>`),

    pizza: svg(`
      <circle cx="32" cy="32" r="23"/><circle cx="32" cy="32" r="18.5"/>
      <path d="M32 13.5v37M13.5 32h37M18.9 18.9l26.2 26.2"/>
      <circle cx="24" cy="25" r="2.2"/><circle cx="40" cy="27" r="2.2"/><circle cx="27" cy="40" r="2.2"/><circle cx="39" cy="39" r="2.2"/>
      <path d="M20 34.5l3 1.5M42 20l1.5 2.8M35 44l2.5-1"/>`),

    dessert: svg(`
      <path d="M10 46h36V30L10 22z"/><path d="M10 30h36M10 38h36"/>
      <path d="M13 23.5c3 1.5 6-1 9 .5s6-1 9 .5 6-1 9 .5"/>
      <path d="M50 16c3 3 3 8 0 11"/><path d="M50 27v22"/><path d="M8 52h48"/>`),

    pan: svg(`
      <circle cx="28" cy="34" r="19"/><path d="M47 34h12"/>
      <circle cx="22" cy="31" r="4.5"/><circle cx="33" cy="38" r="4.5"/>
      <path d="M16 40c2 1 4 1 6 0M30 27c2-1 4-1 6 0"/>
      <path d="M36 25l2-2M18 44l-2 2"/>`),

    board: svg(`
      <path d="M8 26h40a6 6 0 0 1 6 6v8a6 6 0 0 1-6 6H8z"/><path d="M54 36h4"/>
      <circle cx="17" cy="33" r="3.5"/><path d="M25 30h8v6h-8z"/><circle cx="41" cy="33" r="3"/>
      <path d="M14 41h6M28 41h8M40 41h5"/>`),

    olive: svg(`
      <path d="M6 50C20 44 36 30 56 12"/>
      <path d="M18 44c-2-6 1-10 6-11-1 5-2 9-6 11z"/><path d="M28 36c-1-6 3-9 8-9-2 5-3 8-8 9z"/>
      <path d="M40 25c0-6 4-8 9-7-2 4-4 7-9 7z"/>
      <path d="M22 46c5 0 8 3 8 7-4 0-7-2-8-7z"/><path d="M33 38c5 1 7 4 6 8-4-1-6-3-6-8z"/>
      <ellipse cx="46" cy="33" rx="3.2" ry="4.2" transform="rotate(-30 46 33)"/>
      <ellipse cx="14" cy="36" rx="3.2" ry="4.2" transform="rotate(-30 14 36)"/>`),

    arch: svg(`
      <path d="M12 58V30a20 20 0 0 1 40 0v28"/><path d="M18 58V31a14 14 0 0 1 28 0v27"/>
      <path d="M6 58h52"/><path d="M26 20h12M32 14v6"/>`),

    chef: svg(`
      <path d="M20 30c-6 0-9-5-7-10s8-6 11-3c1-6 6-9 11-8s8 6 7 11c4-2 9 0 9 5s-4 7-8 6"/>
      <path d="M22 30h22v8H22z"/><path d="M26 30v8M40 30v8"/>
      <path d="M22 44c3 6 8 9 11 9s8-3 11-9"/>`),

    shaker: svg(`
      <path d="M22 22h20l-3 34H25z"/><path d="M24 22l2-7h12l2 7"/><path d="M28 15v-4h8v4"/>
      <path d="M23.2 34h17.6"/><path d="M46 12l6-4M47 18l7-1M46 24l6 3"/>`)
  };
})();
