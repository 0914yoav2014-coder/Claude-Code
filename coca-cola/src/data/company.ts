export type Milestone = { year: number; title: string; text: string }
export type KeyFact = { value: string; label: string }

export const companyIntro = {
  name: 'The Coca-Cola Company',
  summary:
    'The Coca-Cola Company is a total beverage company headquartered in Atlanta, Georgia. Its roughly 200 master brands are sold in more than 200 countries and territories. Most drinks are made and delivered locally by a worldwide network of bottling partners.',
  model:
    'Coca-Cola makes the concentrates and syrups. Independent and company-owned bottlers mix them with local water and sweetener, then package, sell and deliver the finished drinks to shops and restaurants.',
}

export const keyFacts: KeyFact[] = [
  { value: '1886', label: 'First served in Atlanta' },
  { value: 'Atlanta, GA', label: 'Headquarters' },
  { value: '200+', label: 'Countries & territories' },
  { value: '~200', label: 'Master brands' },
  { value: '2.2B', label: 'Servings a day (approx.)' },
]

export const milestones: Milestone[] = [
  { year: 1886, title: 'A pharmacist invents a drink', text: 'Pharmacist Dr. John S. Pemberton creates the syrup in Atlanta. On May 8 it is mixed with carbonated water and sold for 5 cents a glass at Jacobs\' Pharmacy.' },
  { year: 1886, title: 'The name and the script', text: 'Frank M. Robinson, Pemberton\'s bookkeeper, suggests the name "Coca-Cola" and writes it in the flowing Spencerian script that is still used today.' },
  { year: 1892, title: 'The company is founded', text: 'Asa G. Candler, who had bought the rights to the formula, founds The Coca-Cola Company in Atlanta.' },
  { year: 1899, title: 'Bottling begins', text: 'Chattanooga lawyers Benjamin Thomas and Joseph Whitehead buy the rights to bottle Coca-Cola in most of the US for just $1. This starts the bottler system that still exists.' },
  { year: 1915, title: 'The contour bottle', text: 'The Root Glass Company of Terre Haute, Indiana, designs the contour bottle, shaped so it can be recognized by touch in the dark or even when broken.' },
  { year: 1919, title: 'New owners', text: 'A group of investors led by Ernest Woodruff buys the company for $25 million. In 1923 his son Robert Woodruff becomes president and leads the company for decades.' },
  { year: 1955, title: 'Coke in a can', text: 'Coca-Cola develops its first cans, sold at first to US armed forces overseas. Cans reach US stores in 1960.' },
  { year: 1960, title: 'Minute Maid joins', text: 'The company buys Minute Maid. It is the company\'s first big step beyond sparkling drinks, into juice.' },
  { year: 1982, title: 'Diet Coke launches', text: 'Diet Coke comes out. It is the first extension of the Coca-Cola trademark.' },
  { year: 1985, title: '"New Coke"', text: 'On April 23 the company changes the formula. Fans protest, and 79 days later the original returns as "Coca-Cola Classic".' },
  { year: 2005, title: 'Coke Zero', text: 'Coca-Cola Zero launches with zero sugar and a taste close to the original. In 2016–2017 it is reformulated and renamed Coca-Cola Zero Sugar.' },
  { year: 2019, title: 'Costa Coffee', text: 'Coca-Cola completes its purchase of Costa Coffee from Whitbread, gaining a global coffee platform.' },
]
