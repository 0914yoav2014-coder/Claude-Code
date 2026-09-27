/*
 * Cicchetti — site content & configuration.
 *
 * This is the single file restaurant staff (or a CMS export) edits.
 * Anything marked `verify: true` or listed in CONFIG.pending is NOT yet
 * confirmed with the venue and must be checked before launch.
 * See README.md → "Launch checklist".
 */

window.CICCHETTI = {
  CONFIG: {
    // Preview mode shows the draft banner and "sample" tags on unverified content.
    // Set to false only after every item in README's launch checklist is done.
    draft: true,

    // [VERIFY] Confirm the live Ontopo booking URL with the venue.
    bookingUrl: "https://ontopo.co.il/cicchetti",

    phone: "+972 3-685-3499",
    phoneHref: "tel:+97236853499",
    instagram: "https://www.instagram.com/cicchetti_tlv/",
    facebook: "https://www.facebook.com/cicchetti.tlv",
    address: { street: "58 Yehuda HaLevi Street", city: "Tel Aviv-Yafo", country: "IL" },
    directionsUrl: "https://www.google.com/maps/dir/?api=1&destination=58+Yehuda+HaLevi+St,+Tel+Aviv-Yafo",

    // Hero loop (8–14s, muted, <6MB). Leave null until the shoot is delivered;
    // the atmospheric fallback renders instead.
    heroVideo: null, // e.g. { mp4: "media/hero.mp4", webm: "media/hero.webm", poster: "media/hero.avif" }

    // Optional: Google Maps JS API key → palette-styled map. Without it the
    // designed location card renders (no default-styled iframe, per brief §6.7).
    googleMapsApiKey: null,

    // Amici signup → your ESP/CRM endpoint (Klaviyo, Mailchimp, …). POSTs JSON.
    amiciEndpoint: null,

    // Live rating: supply from a build step that reads the Google Business
    // Profile on deploy day. Never hardcode a number you haven't checked same-day.
    rating: null // e.g. { value: 4.5, count: 4400, source: "Google", checked: "2026-10-01" }
  },

  // Hours are approximate ranges from research — [VERIFY] against the
  // Google Business Profile. `verify: true` shows a note in draft mode.
  hours: {
    verify: true,
    rows: [
      { days: { en: "Sun – Thu", he: "א׳ – ה׳" }, slots: [
        { name: "aperitivo", time: "16:00 – 18:00" },
        { name: "dinner", time: "18:00 – 23:00" } ] },
      { days: { en: "Fri", he: "ו׳" }, slots: [
        { name: "brunch", time: "11:00 – 14:30" },
        { name: "dinner", time: "18:00 – 23:00" } ] },
      { days: { en: "Sat", he: "ש׳" }, slots: [
        { name: "brunch", time: "11:00 – 14:30" },
        { name: "dinner", time: "18:00 – 23:00" } ] }
    ]
  },

  // Menu: the three confirmed dayparts. Dishes are ILLUSTRATIVE SAMPLES from
  // the brief — replace with the current menu. `sample: true` tags them in draft mode.
  menu: {
    aperitivo: [
      { sample: true, en: { name: "Warm focaccia", desc: "Torn at the table, still steaming, olive oil pooling in the dimples." },
        he: { name: "פוקאצ׳ה חמה", desc: "נקרעת ליד השולחן, עוד מעלה אדים, שמן זית בכל גומה." }, shot: "Focaccia, torn, oil sheen" },
      { sample: true, en: { name: "Cicchetti board", desc: "Whatever the kitchen is excited about tonight, one bite each." },
        he: { name: "מגש צ׳יקטי", desc: "מה שהמטבח מתלהב ממנו הערב, ביס אחד מכל דבר." }, shot: "Board, overhead ¾, hands reaching" },
      { sample: true, en: { name: "House spritz", desc: "Bitter, bright, and gone faster than you planned." },
        he: { name: "ספריץ הבית", desc: "מריר, בהיר, ונגמר מהר ממה שתכננתם." }, shot: "Spritz on the bar, window light" }
    ],
    dinner: [
      { sample: true, en: { name: "Asparagus gnocchi", desc: "Pillow-soft, spring-green, finished with brown butter." },
        he: { name: "ניוקי אספרגוס", desc: "רכים כמו כרית, ירוקים של אביב, חמאה חומה בסוף." }, shot: "Gnocchi, shallow DOF, butter gloss" },
      { sample: true, en: { name: "Egg-yolk carbonara", desc: "No cream, no shortcuts — yolk, pecorino, pepper, patience." },
        he: { name: "קרבונרה חלמונים", desc: "בלי שמנת ובלי קיצורי דרך — חלמון, פקורינו, פלפל וסבלנות." }, shot: "Carbonara, fork mid-twirl" },
      { sample: true, en: { name: "Shrimp from the grill", desc: "Charred at the edges, lemon, chilli, fingers encouraged." },
        he: { name: "שרימפס מהגריל", desc: "חרוכים בקצוות, לימון, צ׳ילי, ומותר עם הידיים." }, shot: "Shrimp, smoke, ¾ angle" },
      { sample: true, en: { name: "Seasonal crudo", desc: "Today's catch, sliced thin, dressed at the last second." },
        he: { name: "קרודו עונתי", desc: "הדג של היום, פרוס דק, מתובל ברגע האחרון." }, shot: "Crudo, cold light on ice-plate" },
      { sample: true, en: { name: "Tiramisù", desc: "Made every morning, gone every night." },
        he: { name: "טירמיסו", desc: "נעשה כל בוקר, נגמר כל ערב." }, shot: "Tiramisù, spoon breaking the top" }
    ],
    brunch: [
      { sample: true, en: { name: "Eggs in purgatory", desc: "Tomato, chilli, bread for mopping. Friday, sorted." },
        he: { name: "ביצים בגיהנום", desc: "עגבניות, צ׳ילי ולחם לניגוב. שישי מסודר." }, shot: "Skillet, sunlit table" },
      { sample: true, en: { name: "Ricotta & honey toast", desc: "Whipped ricotta, wildflower honey, black pepper." },
        he: { name: "טוסט ריקוטה ודבש", desc: "ריקוטה מוקצפת, דבש פרחי בר, פלפל שחור." }, shot: "Toast, honey drip, macro" },
      { sample: true, en: { name: "Brunch spritz", desc: "Because it's the weekend and nobody is driving." },
        he: { name: "ספריץ בראנץ׳", desc: "כי זה סוף שבוע ואף אחד לא נוהג." }, shot: "Two spritzes clinking" }
    ]
  },

  // Signature drinks — SAMPLES. Replace with Avi Kashi's real list.
  drinks: [
    { sample: true, en: { name: "Negroni Sbagliato", note: "The 'mistake' that became the house pour." },
      he: { name: "נגרוני סבלייאטו", note: "ה״טעות״ שהפכה למזיגת הבית." } },
    { sample: true, en: { name: "Bellini, Tel Aviv summer", note: "White peach when it's in season, and only then." },
      he: { name: "בליני של קיץ תל אביבי", note: "אפרסק לבן כשיש עונה, ורק אז." } },
    { sample: true, en: { name: "Amaro flight", note: "Three bitters, three stories, one slow evening." },
      he: { name: "טעימת אמרו", note: "שלושה מרירים, שלושה סיפורים, ערב אחד איטי." } }
  ],

  // Gallery: shot-list slots. Replace `src` with real photography (AVIF/WebP).
  // `shape` drives the masonry rhythm: wide | tall | square.
  gallery: [
    { shape: "wide",   shot: { en: "Facade at golden hour — Jerusalem stone", he: "החזית בשעת הזהב — אבן ירושלמית" } },
    { tone: "dark", shape: "tall",   shot: { en: "Bar, Avi mid-pour", he: "הבר, אבי באמצע מזיגה" } },
    { shape: "square", shot: { en: "Crudo, close", he: "קרודו, תקריב" } },
    { shape: "tall",   shot: { en: "Stone archway detail", he: "פרט קשת אבן" } },
    { shape: "square", shot: { en: "Guests mid-laugh", he: "אורחים באמצע צחוק" } },
    { tone: "dark", shape: "wide",   shot: { en: "Dining room, blue hour", he: "חדר האוכל, השעה הכחולה" } },
    { shape: "square", shot: { en: "Hands sharing a plate", he: "ידיים חולקות צלחת" } },
    { shape: "tall",   shot: { en: "Chef at the pass", he: "השף בפס" } },
    { tone: "dark", shape: "square", shot: { en: "Wood counter, candle", he: "דלפק עץ, נר" } },
    { tone: "dark", shape: "wide",   shot: { en: "Yehuda HaLevi at night", he: "יהודה הלוי בלילה" } }
  ],

  // Reviews: EMPTY on purpose. Add 4–6 real, permissioned excerpts
  // (or accurately quoted public platform reviews), e.g.:
  // { text: { en: "…", he: "…" }, source: "Google", date: "2026-08" }
  reviews: [],

  // UI strings. English also lives in index.html for no-JS / SEO.
  // Hebrew is written natively, not translated — have a native copywriter sign off.
  i18n: {
    en: {
      "draft": "Preview build — menu, hours, photography and booking link are placeholders pending verification with the venue.",
      "nav.concept": "Concept", "nav.menu": "Menu", "nav.people": "Chef & Bar", "nav.gallery": "Gallery",
      "nav.reviews": "Reviews", "nav.location": "Location", "cta.book": "Book a Table", "cta.menu": "See Tonight's Menu",
      "lang.switch": "עברית", "lang.label": "Switch to Hebrew",
      "hero.eyebrow": "Yehuda HaLevi, Tel Aviv",
      "hero.title": "Small plates.<br>Big appetite.",
      "hero.sub": "A Venetian neighbourhood bar, reinterpreted for Tel Aviv. Aperitivo, dinner, and weekend brunch.",
      "concept.eyebrow": "The concept",
      "concept.title": "Not exactly a restaurant. Nor a wine bar.",
      "concept.body": "Cicchetti started as a Venetian habit — a glass of wine, a few bites, standing up, no reservation required. We kept the habit and lost the rules. Fresh pasta, wood smoke, and whatever the sea gave us this morning, served the way Tel Aviv actually eats: a little at a time, with everyone reaching across the table.",
      "concept.quote": "A bit of booze, a lot of soul.",
      "concept.quoteBy": "Avi Kashi, Host & Cocktail Director",
      "menu.eyebrow": "The menu", "menu.title": "A little at a time.",
      "menu.aperitivo": "Aperitivo", "menu.dinner": "Dinner", "menu.brunch": "Brunch",
      "menu.aperitivoNote": "Late afternoon", "menu.dinnerNote": "Evenings", "menu.brunchNote": "Friday & Saturday",
      "menu.allergens": "Allergens & dietary notes", "menu.allergensBody": "Tell your server about any allergy — the kitchen adapts most dishes. A full allergen list is available at the bar.",
      "menu.seasonal": "The menu changes with the season. What's here is a taste, not a promise.",
      "people.eyebrow": "Chef & Bar", "people.title": "Two people, one table.",
      "chef.role": "Executive Chef", "chef.name": "Michael Gartofsky",
      "chef.bio": "Simple and precise. Michael cooks seasonal small plates rooted in traditional Italian regional technique — fewer ingredients, more attention, and a menu that moves when the market does.",
      "chef.quote": "Chef's own words, coming soon.",
      "host.role": "Host & Cocktail Director", "host.name": "Avi Kashi",
      "host.bio": "Avi runs the room and the bar: a short, opinionated wine list leaning Italian, and cocktails built for the hour before dinner — bitter, bright, and never too sweet.",
      "host.quote": "A bit of booze, a lot of soul.",
      "drinks.title": "From the bar",
      "gallery.eyebrow": "The room", "gallery.title": "Warm light, low hum.",
      "reviews.eyebrow": "Guests", "reviews.title": "What people say on the way out.",
      "reviews.empty": "Guest words, verbatim and with permission — being gathered now.",
      "reviews.prev": "Previous review", "reviews.next": "Next review",
      "location.eyebrow": "Find us", "location.title": "An old Tel Aviv house on Yehuda HaLevi.",
      "location.address": "58 Yehuda HaLevi Street<br>Tel Aviv-Yafo",
      "location.hours": "Hours", "location.directions": "Get Directions", "location.call": "Call us",
      "location.access": "Access",
      "location.accessBody": "Step-free entrance. There is no wheelchair-accessible restroom — the building is heritage-protected and can't be altered. Call ahead and we'll make the evening work.",
      "location.delivery": "Delivery & takeaway: ask us — details confirmed soon.",
      "location.mapNote": "Yehuda HaLevi Street, in the heart of old Tel Aviv",
      "hours.verify": "Hours shown are provisional.",
      "slot.aperitivo": "Aperitivo", "slot.dinner": "Dinner", "slot.brunch": "Brunch",
      "amici.eyebrow": "Cicchetti Amici",
      "amici.title": "The table's always a little warmer for friends.",
      "amici.body": "Seasonal menu previews before anyone else, invitations to small evenings at the bar, and something for your birthday. A few emails a season — never more.",
      "amici.name": "First name", "amici.email": "Email", "amici.phone": "Phone for WhatsApp updates (optional)",
      "amici.consent": "Yes, send me Cicchetti Amici updates by email (and WhatsApp, if I added a number). I can unsubscribe anytime.",
      "amici.submit": "Join the Amici",
      "amici.ok": "You're in. Watch your inbox — first invite coming soon.",
      "amici.preview": "(Preview: not sent — no signup service connected yet.)",
      "amici.errName": "Tell us what to call you.", "amici.errEmail": "That email doesn't look quite right.",
      "amici.errConsent": "We need your OK before we write to you.", "amici.errSend": "Something went wrong on our side. Try again in a moment?",
      "footer.hours": "Aperitivo · Dinner · Brunch Fri–Sat",
      "footer.amici": "Join Cicchetti Amici", "footer.privacy": "Privacy",
      "sample": "Sample", "shot": "Photo to come",
      "lightbox.close": "Close"
    },
    he: {
      "draft": "גרסת תצוגה מקדימה — התפריט, השעות, הצילומים וקישור ההזמנה ממתינים לאישור המסעדה.",
      "nav.concept": "הקונספט", "nav.menu": "תפריט", "nav.people": "שף ובר", "nav.gallery": "גלריה",
      "nav.reviews": "ביקורות", "nav.location": "איך מגיעים", "cta.book": "הזמנת שולחן", "cta.menu": "לתפריט של הערב",
      "lang.switch": "English", "lang.label": "Switch to English",
      "hero.eyebrow": "יהודה הלוי, תל אביב",
      "hero.title": "צלחות קטנות.<br>תיאבון גדול.",
      "hero.sub": "בר שכונתי ונציאני, בגרסה תל אביבית. אפריטיבו, ערב, ובראנץ׳ בסופ״ש.",
      "concept.eyebrow": "הקונספט",
      "concept.title": "לא בדיוק מסעדה. גם לא בר יין.",
      "concept.body": "צ׳יקטי התחיל כהרגל ונציאני — כוס יין, כמה ביסים, בעמידה, בלי להזמין מראש. את ההרגל שמרנו, את החוקים השארנו בוונציה. פסטה טרייה, עשן עצים ומה שהים הביא הבוקר, מוגשים כמו שתל אביב באמת אוכלת: קצת-קצת, וכולם מושיטים יד מעבר לשולחן.",
      "concept.quote": "קצת אלכוהול, הרבה נשמה.",
      "concept.quoteBy": "אבי קאשי, מארח ומנהל הבר",
      "menu.eyebrow": "התפריט", "menu.title": "קצת-קצת.",
      "menu.aperitivo": "אפריטיבו", "menu.dinner": "ערב", "menu.brunch": "בראנץ׳",
      "menu.aperitivoNote": "אחר הצהריים", "menu.dinnerNote": "בערב", "menu.brunchNote": "שישי ושבת",
      "menu.allergens": "אלרגנים והעדפות תזונה", "menu.allergensBody": "ספרו למלצר על כל אלרגיה — המטבח מתאים את רוב המנות. רשימת אלרגנים מלאה זמינה בבר.",
      "menu.seasonal": "התפריט מתחלף עם העונה. מה שכאן הוא טעימה, לא הבטחה.",
      "people.eyebrow": "שף ובר", "people.title": "שני אנשים, שולחן אחד.",
      "chef.role": "שף ראשי", "chef.name": "מיכאל גרטופסקי",
      "chef.bio": "פשוט ומדויק. מיכאל מבשל צלחות קטנות עונתיות שנשענות על טכניקה איטלקית אזורית מסורתית — פחות מרכיבים, יותר תשומת לב, ותפריט שזז יחד עם השוק.",
      "chef.quote": "המילים של השף — בקרוב.",
      "host.role": "מארח ומנהל הבר", "host.name": "אבי קאשי",
      "host.bio": "אבי מנהל את החדר ואת הבר: רשימת יינות קצרה ודעתנית עם נטייה איטלקית, וקוקטיילים לשעה שלפני הארוחה — מרירים, בהירים ואף פעם לא מתוקים מדי.",
      "host.quote": "קצת אלכוהול, הרבה נשמה.",
      "drinks.title": "מהבר",
      "gallery.eyebrow": "המקום", "gallery.title": "אור חם, רחש נמוך.",
      "reviews.eyebrow": "אורחים", "reviews.title": "מה אומרים בדרך החוצה.",
      "reviews.empty": "מילים של אורחים, מילה במילה ובאישור — נאספות עכשיו.",
      "reviews.prev": "הביקורת הקודמת", "reviews.next": "הביקורת הבאה",
      "location.eyebrow": "איך מגיעים", "location.title": "בית תל אביבי ותיק ביהודה הלוי.",
      "location.address": "יהודה הלוי 58<br>תל אביב-יפו",
      "location.hours": "שעות פתיחה", "location.directions": "ניווט", "location.call": "התקשרו",
      "location.access": "נגישות",
      "location.accessBody": "כניסה ללא מדרגות. אין שירותי נכים — המבנה לשימור ואי אפשר לשנות אותו. התקשרו מראש ונדאג שהערב יעבוד.",
      "location.delivery": "משלוחים ואיסוף עצמי: שאלו אותנו — פרטים בקרוב.",
      "location.mapNote": "רחוב יהודה הלוי, בלב תל אביב הישנה",
      "hours.verify": "השעות המוצגות זמניות.",
      "slot.aperitivo": "אפריטיבו", "slot.dinner": "ערב", "slot.brunch": "בראנץ׳",
      "amici.eyebrow": "צ׳יקטי אמיצ׳י",
      "amici.title": "לחברים, השולחן תמיד קצת יותר חם.",
      "amici.body": "הצצה לתפריט העונתי לפני כולם, הזמנות לערבים קטנים בבר, ומשהו קטן ליום ההולדת. כמה מיילים בעונה — לא יותר.",
      "amici.name": "שם פרטי", "amici.email": "אימייל", "amici.phone": "טלפון לעדכונים בוואטסאפ (לא חובה)",
      "amici.consent": "כן, שלחו לי עדכונים מצ׳יקטי אמיצ׳י במייל (ובוואטסאפ, אם הוספתי מספר). אפשר להסיר את עצמי בכל רגע.",
      "amici.submit": "הצטרפות לאמיצ׳י",
      "amici.ok": "אתם בפנים. שימו עין על תיבת הדואר — ההזמנה הראשונה בדרך.",
      "amici.preview": "(תצוגה מקדימה: לא נשלח — עדיין לא חובר שירות הרשמה.)",
      "amici.errName": "איך לקרוא לכם?", "amici.errEmail": "נראה שהאימייל לא לגמרי תקין.",
      "amici.errConsent": "צריך את האישור שלכם לפני שנכתוב לכם.", "amici.errSend": "משהו השתבש אצלנו. ננסה שוב בעוד רגע?",
      "footer.hours": "אפריטיבו · ערב · בראנץ׳ שישי–שבת",
      "footer.amici": "הצטרפות לצ׳יקטי אמיצ׳י", "footer.privacy": "פרטיות",
      "sample": "דוגמה", "shot": "צילום בדרך",
      "lightbox.close": "סגירה"
    }
  }
};
