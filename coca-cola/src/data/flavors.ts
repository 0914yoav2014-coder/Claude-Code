export type Nutrition = {
  servingMl: 330
  energyKcal: number
  fatG: number
  saturatedFatG: number
  carbsG: number
  sugarsG: number
  proteinG: number
  sodiumMg: number
  caffeineMg: number
}

export type Flavor = {
  slug: string
  name: string
  shortName: string
  tagline: string
  description: string
  tastingNotes: string[]
  launched: number
  /** body = can color, accent = ribbon/label color, text = wordmark color, bg = page tint */
  colors: { body: string; accent: string; text: string; bg: string }
  nutrition: Nutrition
}

// Values are approximate, per 330 ml can, from UK/EU on-pack labels.
// The flavor page shows them with an "approximate" note. Re-check against coca-cola.com before relying on them.
export const flavors: Flavor[] = [
  {
    slug: 'original',
    name: 'Coca-Cola Original',
    shortName: 'Original',
    tagline: 'The taste that started it all.',
    description:
      'The original recipe, first poured in Atlanta in 1886. Crisp, sweet and bubbly, with the secret blend of flavors that made Coca-Cola the best-known drink in the world.',
    tastingNotes: ['Caramel', 'Citrus peel', 'Warm spice'],
    launched: 1886,
    colors: { body: '#F40009', accent: '#FFFFFF', text: '#FFFFFF', bg: '#FDE8E8' },
    nutrition: { servingMl: 330, energyKcal: 139, fatG: 0, saturatedFatG: 0, carbsG: 35, sugarsG: 35, proteinG: 0, sodiumMg: 10, caffeineMg: 32 },
  },
  {
    slug: 'zero-sugar',
    name: 'Coca-Cola Zero Sugar',
    shortName: 'Zero Sugar',
    tagline: 'Great Coca-Cola taste. Zero sugar.',
    description:
      'Made to taste as close as possible to the original, with no sugar and almost no calories. First launched as Coke Zero in 2005, it was renamed Coca-Cola Zero Sugar in 2017.',
    tastingNotes: ['Classic cola', 'Clean finish', 'Light sweetness'],
    launched: 2005,
    colors: { body: '#111111', accent: '#F40009', text: '#FFFFFF', bg: '#ECECEC' },
    nutrition: { servingMl: 330, energyKcal: 1, fatG: 0, saturatedFatG: 0, carbsG: 0, sugarsG: 0, proteinG: 0, sodiumMg: 20, caffeineMg: 32 },
  },
  {
    slug: 'diet-coke',
    name: 'Diet Coke',
    shortName: 'Diet Coke',
    tagline: 'Light, crisp, and unmistakably Diet Coke.',
    description:
      'Launched in 1982, Diet Coke has its own lighter, crisper taste that is different from the original. It has no sugar and no calories, and a little more caffeine than a regular Coke.',
    tastingNotes: ['Crisp', 'Light', 'Bright citrus'],
    launched: 1982,
    colors: { body: '#D9DCE0', accent: '#E4002B', text: '#E4002B', bg: '#F1F2F4' },
    nutrition: { servingMl: 330, energyKcal: 1, fatG: 0, saturatedFatG: 0, carbsG: 0, sugarsG: 0, proteinG: 0, sodiumMg: 20, caffeineMg: 42 },
  },
  {
    slug: 'cherry',
    name: 'Cherry Coke',
    shortName: 'Cherry',
    tagline: 'Coca-Cola with a bold cherry twist.',
    description:
      'Classic Coca-Cola blended with smooth, juicy cherry flavor. It first came out in 1985 and has been a fan favorite ever since.',
    tastingNotes: ['Dark cherry', 'Cola', 'Sweet finish'],
    launched: 1985,
    colors: { body: '#6E0B2A', accent: '#E0457B', text: '#FFFFFF', bg: '#F7E3EA' },
    nutrition: { servingMl: 330, energyKcal: 148, fatG: 0, saturatedFatG: 0, carbsG: 37, sugarsG: 37, proteinG: 0, sodiumMg: 10, caffeineMg: 32 },
  },
  {
    slug: 'vanilla',
    name: 'Vanilla Coke',
    shortName: 'Vanilla',
    tagline: 'Smooth, creamy vanilla meets classic Coca-Cola.',
    description:
      'The original taste with a creamy vanilla finish, a bit like a cola float in a can. It was first launched in 2002 and has come back many times because fans keep asking for it.',
    tastingNotes: ['Vanilla bean', 'Cream soda', 'Cola'],
    launched: 2002,
    colors: { body: '#F3E6CF', accent: '#A8733A', text: '#7A4A1E', bg: '#FAF3E6' },
    nutrition: { servingMl: 330, energyKcal: 142, fatG: 0, saturatedFatG: 0, carbsG: 36, sugarsG: 36, proteinG: 0, sodiumMg: 10, caffeineMg: 32 },
  },
]

export const getFlavor = (slug: string | undefined) => flavors.find((f) => f.slug === slug)
