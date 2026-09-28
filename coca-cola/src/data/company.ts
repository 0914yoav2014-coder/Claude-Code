export type Milestone = { year: number; title: string; text: string }
export type KeyFact = { value: string; label: string }

export const companyIntro = {
  name: 'The Coca-Cola Company',
  summary:
    'The Coca-Cola Company is a total beverage company headquartered in Atlanta, Georgia. It sells more than 200 brands in over 200 countries and territories. Most drinks are made and delivered locally by a worldwide network of bottling partners.',
  model:
    'Coca-Cola makes the concentrates and syrups. Independent and company-owned bottlers mix them with local water and sweetener, then package, sell and deliver the finished drinks to shops and restaurants.',
}

export const keyFacts: KeyFact[] = [
  { value: '1886', label: 'First served in Atlanta' },
  { value: 'Atlanta, GA', label: 'Headquarters' },
  { value: '200+', label: 'Countries & territories' },
  { value: '200+', label: 'Brands worldwide' },
  { value: '2.2B+', label: 'Servings a day (approx.)' },
]

export const milestones: Milestone[] = [
  { year: 1886, title: 'A pharmacist invents a drink', text: 'Dr. John S. Pemberton creates the syrup in Atlanta. It is mixed with carbonated water and sold for 5 cents a glass at Jacobs\' Pharmacy.' },
  { year: 1886, title: 'The name and the script', text: 'Frank M. Robinson, Pemberton\'s bookkeeper, suggests the name "Coca-Cola" and writes it in the flowing script that is still used today.' },
  { year: 1892, title: 'The company is founded', text: 'Asa G. Candler, who bought the rights to the formula, founds The Coca-Cola Company.' },
  { year: 1899, title: 'Bottling begins', text: 'Two lawyers from Chattanooga win the rights to bottle Coca-Cola. This starts the bottler system that still exists.' },
  { year: 1915, title: 'The contour bottle', text: 'The Root Glass Company designs the famous contour bottle, shaped so it can be recognized in the dark.' },
  { year: 1919, title: 'New owners', text: 'A group of investors led by Ernest Woodruff buys the company. In 1923 his son Robert Woodruff becomes president and leads the company for decades.' },
  { year: 1955, title: 'Coke in a can', text: 'Coca-Cola starts selling cans, first to US armed forces overseas and then more widely in the 1960s.' },
  { year: 1960, title: 'Minute Maid joins', text: 'The company buys Minute Maid. It is the first big step beyond sparkling drinks.' },
  { year: 1982, title: 'Diet Coke launches', text: 'Diet Coke comes out. It is the first new brand to carry the Coca-Cola trademark since 1886.' },
  { year: 1985, title: '"New Coke"', text: 'The company changes the formula. Fans protest, and within three months the original returns as "Coca-Cola Classic".' },
  { year: 2005, title: 'Coke Zero', text: 'Coke Zero launches with zero sugar and a taste close to the original. It is renamed Coca-Cola Zero Sugar in 2017.' },
  { year: 2019, title: 'Costa Coffee', text: 'Coca-Cola buys Costa Coffee and becomes a major player in hot coffee.' },
]
