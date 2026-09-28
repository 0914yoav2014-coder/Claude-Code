export type BrandCategory = 'Soft drinks' | 'Water' | 'Sports & energy' | 'Tea & coffee' | 'Juice'

export type Brand = {
  slug: string
  name: string
  category: BrandCategory
  since: number
  /** How the brand joined the Coca-Cola system */
  origin: string
  description: string
  color: string
  /** color used for text drawn on top of `color` */
  onColor: string
  /** packaging silhouette for the generic illustration */
  pack: 'can' | 'bottle' | 'cup'
}

export const brandCategories: BrandCategory[] = ['Soft drinks', 'Water', 'Sports & energy', 'Tea & coffee', 'Juice']

export const brands: Brand[] = [
  {
    slug: 'sprite', name: 'Sprite', category: 'Soft drinks', since: 1961, origin: 'Created by Coca-Cola',
    description: 'A crisp lemon-lime soda with no caffeine. Sprite first came out in the US in 1961 and is now one of the best-selling soft drinks in the world.',
    color: '#008B47', onColor: '#FFFFFF', pack: 'can',
  },
  {
    slug: 'fanta', name: 'Fanta', category: 'Soft drinks', since: 1940, origin: 'Created by Coca-Cola',
    description: 'A bright, fruity, bubbly drink best known for its orange flavor. Fanta comes in more than 100 flavors around the world.',
    color: '#FF8200', onColor: '#FFFFFF', pack: 'can',
  },
  {
    slug: 'schweppes', name: 'Schweppes', category: 'Soft drinks', since: 1783, origin: 'Acquired (in many markets)',
    description: 'Tonic water, ginger ale and other mixers from one of the oldest soft-drink brands. Coca-Cola owns Schweppes in many countries.',
    color: '#F2C500', onColor: '#111111', pack: 'bottle',
  },
  {
    slug: 'minute-maid', name: 'Minute Maid', category: 'Juice', since: 1945, origin: 'Acquired in 1960',
    description: 'Juices and juice drinks, starting with frozen orange concentrate in the 1940s. Today the range includes lemonades and fruit blends.',
    color: '#F7A600', onColor: '#111111', pack: 'bottle',
  },
  {
    slug: 'powerade', name: 'Powerade', category: 'Sports & energy', since: 1988, origin: 'Created by Coca-Cola',
    description: 'A sports drink with electrolytes that helps athletes stay hydrated during training and competition.',
    color: '#0057B8', onColor: '#FFFFFF', pack: 'bottle',
  },
  {
    slug: 'dasani', name: 'Dasani', category: 'Water', since: 1999, origin: 'Created by Coca-Cola',
    description: 'Purified water with a light blend of minerals added for a clean, fresh taste.',
    color: '#00A3E0', onColor: '#FFFFFF', pack: 'bottle',
  },
  {
    slug: 'smartwater', name: 'smartwater', category: 'Water', since: 1996, origin: 'Acquired in 2007 (glacéau)',
    description: 'Vapor-distilled water with added electrolytes, sold in its tall, simple bottle.',
    color: '#9FC9E8', onColor: '#0B2545', pack: 'bottle',
  },
  {
    slug: 'fuze-tea', name: 'Fuze Tea', category: 'Tea & coffee', since: 2001, origin: 'Acquired in 2007',
    description: 'Iced tea made with black or green tea, mixed with fruit flavors and herbs.',
    color: '#7FBA00', onColor: '#111111', pack: 'bottle',
  },
  {
    slug: 'costa', name: 'Costa Coffee', category: 'Tea & coffee', since: 1971, origin: 'Acquired in 2019',
    description: 'A coffee chain founded in London in 1971. It sells coffee in cafés, in ready-to-drink cans, and from vending machines.',
    color: '#6C1D45', onColor: '#FFFFFF', pack: 'cup',
  },
  {
    slug: 'monster', name: 'Monster Energy', category: 'Sports & energy', since: 2002, origin: 'Strategic partnership (2015)',
    description: 'An energy drink brand. Coca-Cola owns a large share of the company and distributes its drinks in many markets.',
    color: '#1A1A1A', onColor: '#95D600', pack: 'can',
  },
  {
    slug: 'topo-chico', name: 'Topo Chico', category: 'Water', since: 1895, origin: 'Acquired in 2017',
    description: 'A sparkling mineral water from Monterrey, Mexico, known for its strong bubbles.',
    color: '#C8102E', onColor: '#F6E27A', pack: 'bottle',
  },
  {
    slug: 'gold-peak', name: 'Gold Peak', category: 'Tea & coffee', since: 2006, origin: 'Created by Coca-Cola',
    description: 'A ready-to-drink iced tea made to taste like tea brewed at home.',
    color: '#B8862B', onColor: '#FFFFFF', pack: 'bottle',
  },
]
