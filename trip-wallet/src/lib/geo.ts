import type { CountryCode } from '../db/types';

/**
 * Offline country lookup. Bounding boxes alone overlap badly here (Chile's box covers half of
 * Argentina), so we use bundled reference towns: the nearest town decides the country, and if
 * it's close enough we also suggest it as the city.
 */
type Ref = [name: string, lat: number, lon: number];

const REFS: Record<CountryCode, Ref[]> = {
  AR: [['Buenos Aires', -34.6, -58.38], ['Córdoba', -31.42, -64.18], ['Mendoza', -32.89, -68.83], ['Salta', -24.78, -65.41],
    ['Jujuy', -24.19, -65.3], ['Purmamarca', -23.74, -65.5], ['Puerto Iguazú', -25.6, -54.57], ['Bariloche', -41.13, -71.31],
    ['El Calafate', -50.34, -72.26], ['El Chaltén', -49.33, -72.89], ['Ushuaia', -54.8, -68.3], ['Puerto Madryn', -42.77, -65.04],
    ['Rosario', -32.95, -60.65], ['Tucumán', -26.82, -65.22], ['San Martín de los Andes', -40.16, -71.35], ['Cafayate', -26.07, -65.98],
    ['Esquel', -42.91, -71.32], ['Mar del Plata', -38.0, -57.55], ['Río Gallegos', -51.62, -69.22], ['Neuquén', -38.95, -68.06],
    ['Humahuaca', -23.2, -65.35], ['San Rafael', -34.62, -68.33], ['Corrientes', -27.47, -58.83]],
  CL: [['Santiago', -33.45, -70.67], ['Valparaíso', -33.05, -71.62], ['San Pedro de Atacama', -22.91, -68.2], ['Calama', -22.46, -68.93],
    ['Arica', -18.48, -70.31], ['Iquique', -20.21, -70.15], ['Antofagasta', -23.65, -70.4], ['La Serena', -29.9, -71.25],
    ['Pucón', -39.27, -71.98], ['Puerto Varas', -41.32, -72.98], ['Puerto Montt', -41.47, -72.94], ['Castro', -42.48, -73.76],
    ['Coyhaique', -45.57, -72.07], ['Puerto Natales', -51.73, -72.51], ['Punta Arenas', -53.16, -70.91], ['Torres del Paine', -50.94, -73.41],
    ['Pichilemu', -34.39, -72.0], ['Concepción', -36.83, -73.05], ['Valdivia', -39.81, -73.25], ['Puerto Williams', -54.93, -67.61],
    ['Chile Chico', -46.54, -71.72], ['Copiapó', -27.37, -70.33], ['Vicuña', -30.03, -70.71]],
  PE: [['Lima', -12.05, -77.04], ['Cusco', -13.53, -71.97], ['Arequipa', -16.41, -71.54], ['Puno', -15.84, -70.02],
    ['Aguas Calientes', -13.15, -72.52], ['Huaraz', -9.53, -77.53], ['Iquitos', -3.75, -73.25], ['Máncora', -4.1, -81.05],
    ['Trujillo', -8.11, -79.03], ['Paracas', -13.83, -76.25], ['Huacachina', -14.09, -75.76], ['Puerto Maldonado', -12.59, -69.19],
    ['Chachapoyas', -6.23, -77.87], ['Nazca', -14.83, -74.94], ['Ollantaytambo', -13.26, -72.26], ['Chivay', -15.64, -71.6], ['Tacna', -18.01, -70.25]],
  BO: [['La Paz', -16.5, -68.15], ['Uyuni', -20.46, -66.83], ['Sucre', -19.04, -65.26], ['Potosí', -19.58, -65.75],
    ['Copacabana', -16.17, -69.09], ['Santa Cruz', -17.78, -63.18], ['Cochabamba', -17.39, -66.16], ['Rurrenabaque', -14.44, -67.53],
    ['Tupiza', -21.44, -65.72], ['Samaipata', -18.18, -63.87], ['Tarija', -21.53, -64.73], ['Villazón', -22.09, -65.6]],
  BR: [['Rio de Janeiro', -22.91, -43.17], ['São Paulo', -23.55, -46.63], ['Foz do Iguaçu', -25.55, -54.59], ['Florianópolis', -27.6, -48.55],
    ['Salvador', -12.97, -38.5], ['Manaus', -3.12, -60.02], ['Brasília', -15.79, -47.88], ['Recife', -8.05, -34.88],
    ['Fortaleza', -3.73, -38.53], ['Paraty', -23.22, -44.71], ['Bonito', -21.13, -56.48], ['Porto Alegre', -30.03, -51.23],
    ['Belo Horizonte', -19.92, -43.94], ['Jericoacoara', -2.79, -40.51], ['Belém', -1.46, -48.49], ['Cuiabá', -15.6, -56.1],
    ['Lençóis', -12.56, -41.39], ['Rio Branco', -9.97, -67.81], ['Corumbá', -19.01, -57.65], ['Ilha Grande', -23.14, -44.17],
    ['Tabatinga', -4.25, -69.94], ['Porto Velho', -8.76, -63.9], ['Boa Vista', 2.82, -60.67]],
  CO: [['Bogotá', 4.71, -74.07], ['Medellín', 6.24, -75.58], ['Cartagena', 10.39, -75.51], ['Santa Marta', 11.24, -74.2],
    ['Cali', 3.45, -76.53], ['Salento', 4.64, -75.57], ['Leticia', -4.21, -69.94], ['San Gil', 6.56, -73.13],
    ['Barranquilla', 10.96, -74.8], ['Pasto', 1.21, -77.28], ['Palomino', 11.25, -73.56], ['Villa de Leyva', 5.63, -73.52],
    ['Cúcuta', 7.89, -72.5], ['Ipiales', 0.83, -77.64], ['Capurganá', 8.63, -77.35], ['Minca', 11.14, -74.12]],
  EC: [['Quito', -0.18, -78.47], ['Guayaquil', -2.19, -79.89], ['Cuenca', -2.9, -79.0], ['Baños', -1.4, -78.42],
    ['Montañita', -1.83, -80.75], ['Puerto Ayora', -0.74, -90.31], ['Puerto Baquerizo Moreno', -0.9, -89.61], ['Otavalo', 0.23, -78.26],
    ['Tena', -0.99, -77.81], ['Loja', -4.0, -79.2], ['Vilcabamba', -4.26, -79.22], ['Latacunga', -0.93, -78.62], ['Tulcán', 0.81, -77.72]],
  PA: [['Panama City', 8.98, -79.52], ['Bocas del Toro', 9.34, -82.24], ['Boquete', 8.78, -82.44], ['David', 8.43, -82.43],
    ['San Blas', 9.55, -78.95], ['Santa Catalina', 7.63, -81.25], ['Colón', 9.36, -79.9], ['El Valle', 8.6, -80.13], ['Puerto Obaldía', 8.67, -77.42]],
  CR: [['San José', 9.93, -84.08], ['La Fortuna', 10.47, -84.64], ['Monteverde', 10.3, -84.82], ['Puerto Viejo', 9.66, -82.75],
    ['Tamarindo', 10.3, -85.84], ['Manuel Antonio', 9.39, -84.14], ['Liberia', 10.63, -85.44], ['Puerto Jiménez', 8.54, -83.3],
    ['Tortuguero', 10.54, -83.5], ['Santa Teresa', 9.64, -85.17], ['Uvita', 9.16, -83.74], ['Sixaola', 9.52, -82.62]],
  IL: [['Tel Aviv', 32.08, 34.78], ['Jerusalem', 31.77, 35.21], ['Haifa', 32.79, 34.99], ['Eilat', 29.56, 34.95], ['Beer Sheva', 31.25, 34.79]],
};

function km(lat1: number, lon1: number, lat2: number, lon2: number) {
  const r = Math.PI / 180;
  const a = Math.sin(((lat2 - lat1) * r) / 2) ** 2 + Math.cos(lat1 * r) * Math.cos(lat2 * r) * Math.sin(((lon2 - lon1) * r) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(a));
}

export function lookupCountry(lat: number, lon: number): { country: CountryCode; city?: string } | null {
  let best: { country: CountryCode; city: string; d: number } | null = null;
  for (const [country, refs] of Object.entries(REFS) as [CountryCode, Ref[]][]) {
    for (const [city, la, lo] of refs) {
      const d = km(lat, lon, la, lo);
      if (!best || d < best.d) best = { country, city, d };
    }
  }
  if (!best || best.d > 700) return null;
  return { country: best.country, city: best.d < 25 ? best.city : undefined };
}

export function detectLocation(timeoutMs = 15000): Promise<{ country: CountryCode; city?: string } | null> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) return reject(new Error('no geolocation'));
    navigator.geolocation.getCurrentPosition(
      (p) => resolve(lookupCountry(p.coords.latitude, p.coords.longitude)),
      (e) => reject(e),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge: 10 * 60 * 1000 },
    );
  });
}
