# Facts register

Every figure the page prints, where it appears, its value, its source and how far it has been checked. Content owns this file; update it with every data change. Checked on **2026-10-07** by the Content agent.

**Status key**
- **Confirmed**: a web search on 2026-10-07 returned the source (or a page quoting it) stating this value. Most pages could only be read through search summaries, because direct page fetches are blocked in this environment. A quick human click-through before launch is still wise.
- **Computed**: derived by us (method given). Reproduce it with the coordinates in `src/data/routes.ts`.
- **Unconfirmed**: from the v1 data, standard references or general knowledge, but not confirmed by a search this session. **Check before launch.**

Where things appear: **H** hangar card (`planes.ts`: stats, fact, story); **G** globe route panel (`routes.ts`); **F** fun facts (`facts.ts`); **M** meta and other copy (`copy.ts`).

## How distances and times were made

- **Airport coordinates:** OurAirports `airports.csv` (public domain), downloaded from the `davidmegginson/ourairports-data` GitHub mirror on 2026-10-07. Values are rounded to 4 decimals. The exception is Baa Atoll, which has no single airport: we use an approximate atoll centre, 5.15° N 73.05° E. Seaplanes land at each resort's own lagoon.
- **`distanceKm`:** the geodesic distance between the two airports on the WGS-84 ellipsoid (Vincenty). It matches the figures airlines publish (SIN–JFK gives 15,349 km). A spherical haversine, which is what QA's test uses, differs by less than 0.5 %. The exception is WRY–PPW: we print Guinness's 2.7 km (2.74), while our coordinates give 2.8 km, a 4 % difference.
- **`durationMin`:** the scheduled gate-to-gate time from a published timetable, converted to UTC. When a timetable shifts by season, the value is rounded and the label says "about".

## Planes (H)

| Plane | Figure | Value | Source | Status |
|---|---|---|---|---|
| A350-900ULR | Seats on Singapore Airlines | 161 (67 Business + 94 Premium Economy, no economy) | [AeroCorner, Sept 2026](https://aerocorner.com/news/singapore-sq24-changi-turnback/) | Confirmed (also: 7 aircraft in the fleet) |
| A350-900ULR | First flight | 2013; ULR version 23 Apr 2018 | [AIN Online](https://www.ainonline.com/aviation-news/air-transport/2018-04-24/airbus-a350-900-ulr-flies-first-time) | ULR date confirmed; 2013 (14 June) unconfirmed |
| A350-900ULR | Cruising speed | 903 km/h (Mach 0.85) | Airbus spec, Mach 0.85 at cruise altitude | Unconfirmed |
| A350-900ULR | Length / span / height / fuselage width | 66.8 / 64.75 / 17.05 / 5.96 m | [Lufthansa Group A350-900](https://www.lufthansagroup.com/en/company/fleet/lufthansa-and-regional-partners/airbus-a350-900.html) and other spec pages | Confirmed |
| A350-900ULR | "more than 18 hours without stopping" | SQ24 is 18 h 40 min | see route sin-jfk | Confirmed |
| A350-900ULR | "nine movies in a row" | 18 h ÷ 2 h films | arithmetic | Computed |
| A380 | Typical / maximum passengers | 545 (four classes) / 853 (certified) | [Airbus](https://aircraft.airbus.com/en/aircraft/a380), [GlobalAir](https://www.globalair.com/aircraft-specifications/airbus/airbus-a380-specifications/1545) | Confirmed |
| A380 | Length / span / height / fuselage width | 72.72 / 79.75 / 24.09 / 7.14 m | same | Confirmed |
| A380 | First flight; last one built | 2005 (27 Apr); production ended 2021 (final delivery to Emirates, Dec 2021) | Airbus | Unconfirmed |
| A380 | Cruising speed | 903 km/h (Mach 0.85) | Airbus spec | Unconfirmed |
| A380 | "2 full-length passenger decks: no other jet airliner has that" | true | general knowledge (the 747 upper deck is partial) | Unconfirmed |
| 747-8 | Length / span / height | 76.25 (76.3) / 68.4 / 19.4 m | [PlaneFYI 747-8I](https://planefyi.com/de/aircraft/boeing-747-8i/cathay-pacific/) (Boeing data) | Confirmed |
| 747-8 | Fuselage width | 6.5 m | standard 747 figure | Unconfirmed |
| 747-8 | Cruising speed | 917 km/h (Boeing: Mach 0.855) | PlaneFYI | Confirmed |
| 747-8 | Passengers | 410 (typical three-class; Lufthansa seats 364) | PlaneFYI | Confirmed |
| 747-8 | "1,574 jumbo jets … last one left the factory in 2023" | 1,574; final delivery 31 Jan 2023 (747-8F to Atlas Air) | [Boeing press release](https://boeing.mediaroom.com/2023-01-31-Boeing,-Atlas-Air-Celebrate-Delivery-of-Final-747,-an-Airplane-that-Transformed-Aviation-and-Global-Air-Travel) | Confirmed |
| 747-8 | First flight | 2011 (747-8I, 20 Mar 2011); first 747 1969 (9 Feb) | Boeing | Unconfirmed |
| 747-8 | Story: pilots sit in the hump; nose door on the cargo version | true | general knowledge | Unconfirmed |
| Concorde | Length / span / height | 61.66 / 25.6 / 12.2 m | [Wikipedia: Concorde](https://en.wikipedia.org/wiki/Concorde) and spec pages | Confirmed |
| Concorde | Fuselage width | 2.88 m | Wikipedia | Unconfirmed |
| Concorde | Cruising speed | 2,158 km/h (Mach 2.02; max Mach 2.04) | Wikipedia; others quote "1,350 mph / 2,170 km/h" | Mach 2.02 confirmed; km/h varies with air temperature |
| Concorde | Passengers | 100 (configurations 92–128) | spec pages | Confirmed |
| Concorde | "60,000 ft … see the curve of the Earth" | cruised up to 60,000 ft | spec pages; BA | Height confirmed; "curve" is the classic passenger account |
| Concorde | "under 4 hours"; "landed before you took off" | BA001 10:30 → 09:25 local | see route lhr-jfk | Confirmed |
| Concorde | "Only 20 were ever built"; retired 2003 | 20 (6 prototype/pre-series + 14 production); last flights 2003 | general knowledge | Unconfirmed |
| Concorde | First flight | 1969 (2 Mar); in service 21 Jan 1976 – 2003 | [This Day in Aviation](https://www.thisdayinaviation.com/21-january-1976/) for 1976 | 1976 confirmed; 1969 unconfirmed |
| Twin Otter | "66 Twin Otters on floats fly for one Maldives airline: the biggest seaplane fleet" | 66 (Trans Maldivian Airways) | [TMA: 66th aircraft](https://www.transmaldivian.com/66th-aircraft/) | Confirmed |
| Twin Otter | Length / span / height | 15.77 / 19.8 / 5.94 m (wheeled; floats add height) | [GlobalAir DHC-6-400](https://www.globalair.com/aircraft-specifications/viking-air-ltd/twin-otter-dhc-6-400-specifications/1566) | Confirmed |
| Twin Otter | Fuselage width | 1.6 m | estimate from the 1.61 m cabin width | Unconfirmed (model hint only) |
| Twin Otter | Cruising speed | 337 km/h (max cruise at 10,000 ft) | GlobalAir | Confirmed for wheels; slower on floats |
| Twin Otter | Passengers | 19 at most (Maldives seaplanes seat about 15) | standard DHC-6 figure | Unconfirmed |
| Twin Otter | First flight | 1965 (20 May) | general knowledge | Unconfirmed |
| Twin Otter | Story: Saba, "the shortest airline runway in the world" | 400 m | see route sxm-sab | Confirmed |
| Islander | Passengers on Loganair | 8 | [Guinness](https://www.guinnessworldrecords.com/world-records/63191-shortest-domestic-scheduled-flight) ("eight-seat aircraft") | Confirmed |
| Islander | "2.7 km … shortest scheduled flight" | 2.74 km | Guinness | Confirmed |
| Islander | "since 1967" | September 1967 | Guinness | Confirmed |
| Islander | "the record is 53 seconds" | 53 s (pilot Stuart Linklater) | see fact `shortest` | Confirmed |
| Islander | "Stewart Island in 20 minutes" | about 20 min | see route ivc-szs | Confirmed |
| Islander | Length / span / height | 10.86 / 14.94 / 4.18 m | [Wikipedia: Islander](https://en.wikipedia.org/wiki/Britten-Norman_Islander) | Unconfirmed |
| Islander | Fuselage width | 1.2 m | estimate | Unconfirmed (model hint only) |
| Islander | Cruising speed | 260 km/h (140 kn, 75 % power) | Wikipedia | Unconfirmed |
| Islander | First flight | 1965 (13 June) | general knowledge | Unconfirmed |

**Shape style choices** (3D hints, not printed):
- The A350's curved, blended winglets are encoded as `sharklet`.
- The A380's small wingtip fences are encoded as `winglet`.
- The 747-8 has raked tips.

## Routes (G)

| Route | Figure | Value | Source | Status |
|---|---|---|---|---|
| sin-jfk, SQ24 | Distance | 15,349 km | Computed; same as AeroCorner | Computed + confirmed |
| sin-jfk | Time | 18 h 40 min (12:10 SGT → 18:50 EDT) | [AirConnect SQ24](https://airconnect.live/en/flights/SQ24) | Confirmed |
| sin-jfk | "The longest scheduled flight in the world" | true as of Sept 2026 | AeroCorner | Confirmed. **Expires** when Qantas starts Sydney–London (planned Oct 2027). |
| sin-lax, SQ38 | Distance | 14,114 km | Computed | Computed |
| sin-lax | Time | about 15 h 30 min | Trip.com: 15 h 10 – 16 h 25 by date | Unconfirmed (seasonal) |
| sin-lax | Aircraft today | launched with the ULR (Nov 2018); in 2026 normally a standard 253-seat A350-900 | [Singapore Airlines 2018](https://www.singaporeair.com/fr_FR/fr/corporate/newsroom/press-release/2018/July-September/ne2218-180711/); [AeroRoutes, 22 Jul 2026](https://www.aeroroutes.com/eng/260722-sqapr27lax): ULR only on 3 of 10 weekly SIN–LAX flights (SQ36/35), 28 Mar – 30 Apr 2027 | Confirmed by search (resolved 2026-10-07). Route kept (same A350-900 family, good arc); its note says a regular A350-900 flies it most days. |
| dxb-akl, EK448 | Distance | 14,200 km (14,199) | Computed; Emirates/Business Traveller figure | Confirmed |
| dxb-akl | Time | about 16 h | Trip.com lists 15 h 50 min; 10:05 → 11:05 next day is 16 h 0 min in NZ summer | Confirmed (rounded) |
| dxb-akl | Flown by an A380 | A380-842 | Trip.com | Confirmed |
| dxb-akl | "The longest flight any A380 makes" | longer than any other A380 route (the next is about 13,800 km, Sydney–Dallas) | reasoning from distances | Unconfirmed |
| nrt-hnl, NH184 | Distance | 6,145 km | Computed | Computed |
| nrt-hnl | Time | 7 h 35 min (20:10 → 08:45, 3 Jul – 24 Oct 2026) | [ANA Flying Honu](https://www.ana.co.jp/en/jp/international/promotions/a380/) | Confirmed |
| nrt-hnl | "three A380s painted like Hawaiian sea turtles, called honu" | 3 | ANA | Confirmed |
| fra-lax, LH456 | Distance | 9,344 km | Computed | Computed |
| fra-lax | Time | 11 h 40 min (10:25 CET → 13:05 PST) | [FlightStats LH456](https://www.flightstats.com/v2/flight-tracker/LH/456) | Confirmed |
| fra-lax | Flown by a 747-8 in 2026 | yes | [Meilenoptimieren: LH 747-8 routes, summer 2026](https://meilenoptimieren.com/lufthansa-b747-8-strecken/) | Confirmed |
| fra-lax | "Over Greenland and Canada" | the great circle passes 64.6° N 45.7° W, then Hudson Bay | Computed | Computed (real tracks vary with winds) |
| fra-jnb, LH572 | Distance | 8,658 km | Computed | Computed |
| fra-jnb | Time | 10 h 30 min (22:05 → 08:35) | [FlightStats LH572](https://www.flightstats.com/v2/flight-tracker/LH/572) | Confirmed |
| fra-jnb | Flown by a 747-8 in 2026 | yes | Meilenoptimieren | Confirmed |
| fra-jnb | "almost no time difference" | Frankfurt and Johannesburg are both UTC+2 in the European summer, 1 h apart in winter | time zones | Computed |
| lhr-jfk, BA001 (historic) | Distance | about 5,550 km (5,555) | Computed | Computed |
| lhr-jfk | Time | 3 h 55 min (10:30 → 09:25 local, 2001–2003 timetable; about 3½ h in the air) | [Asia Travel Tips, Oct 2001](https://www.asiatraveltips.com/travelnews2001/15October2001BA.htm) | Confirmed |
| cdg-gig, AF085 (historic) | Distance | about 9,160 km (Paris–Rio great circle; via Dakar 9,232 km) | Computed | Computed |
| cdg-gig | Time | about 7½ h, with a stop (7 h 26 min on 21 Jan 1976) | [This Day in Aviation](https://www.thisdayinaviation.com/21-january-1976/) | Confirmed (unclear whether it includes the ground time at Dakar) |
| cdg-gig | "Day one of supersonic passenger travel: 21 January 1976, with a stop in Dakar" | F-BVFA via Dakar | This Day in Aviation | Confirmed. BA's London–Bahrain Concorde left at the same moment (general knowledge, unconfirmed), so the note avoids the word "first". |
| mle-baa | Distance | about 120 km (to the atoll centre) | Computed | Computed (resorts vary) |
| mle-baa | Time | about 30–35 min | [Maldives.com](https://www.maldives.com/blog/travelling-by-seaplane-in-maldives) | Confirmed |
| sxm-sab, Winair | Distance | about 45 km | Computed | Computed |
| sxm-sab | Time | about 15 min, by Twin Otter | [CNN Travel via ABC 17, 2022](https://abc17news.com/entertainment/cnn-style/2022/07/08/what-its-like-to-land-on-the-worlds-shortest-commercial-runway/) | Confirmed (2022 report) |
| sxm-sab | "Saba's runway is only 400 m long, with cliffs at both ends" | 400 m (1,312 ft) | [Wikipedia](https://en.wikipedia.org/wiki/Juancho_E._Yrausquin_Airport), CNN | Confirmed |
| wry-ppw | Distance | 2.7 km (Guinness 2.74 km) | Guinness | Confirmed |
| wry-ppw | Time | about 2 min (including taxiing) | Guinness | Confirmed |
| ivc-szs | Distance | about 56 km (Invercargill to Ryan's Creek) | Computed | Computed |
| ivc-szs | Time | about 20 min, by Islander | [Wikipedia: Stewart Island Flights](https://en.wikipedia.org/wiki/Stewart_Island_Flights) | Confirmed |
| ivc-szs | "New Zealand's third-biggest island" | true | general knowledge | Unconfirmed |

## Fun facts (F)

| Fact | Value | Source | Status |
|---|---|---|---|
| `longest` | 15,349 km, about 18 h 40 min | [AeroCorner](https://aerocorner.com/news/singapore-sq24-changi-turnback/) | Confirmed (true until Oct 2027, see above) |
| `shortest` | 53 seconds, the fastest Westray → Papa Westray hop (Stuart Linklater) | [Wikipedia](https://en.wikipedia.org/wiki/Westray_to_Papa_Westray_flight); also CNN quoting Loganair | Confirmed |
| `concorde` | 2:52:59, New York → London, 7 Feb 1996 (G-BOAD) | [Guinness](https://www.guinnessworldrecords.com/world-records/fastest-flight-across-the-atlantic-in-a-commercial-aircraft) | Confirmed |
| `a380` | 853 people, the certified maximum | [Airbus](https://aircraft.airbus.com/en/aircraft/a380) | Confirmed |

## Copy (M)

- The meta description says "12 famous routes", "6 airplanes", "a 2-minute island hop" (wry-ppw) and "an 18-hour marathon" (sin-jfk). These are consistent with the data above.
- "Numbers from 35,000 feet" is PRD wording, a figure of speech (a typical airliner cruising height), not a claim.
