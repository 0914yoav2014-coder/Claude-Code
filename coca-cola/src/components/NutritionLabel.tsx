import type { Nutrition } from '../data/flavors'
import './NutritionLabel.css'

type NutritionLabelProps = {
  nutrition: Nutrition
  name: string
}

type Row = { label: string; value: string; sub?: boolean; heavy?: boolean }

export default function NutritionLabel({ nutrition: n, name }: NutritionLabelProps) {
  const rows: Row[] = [
    { label: 'Total Fat', value: `${n.fatG} g` },
    { label: 'Saturated Fat', value: `${n.saturatedFatG} g`, sub: true },
    { label: 'Total Carbohydrate', value: `${n.carbsG} g` },
    { label: 'Total Sugars', value: `${n.sugarsG} g`, sub: true },
    { label: 'Protein', value: `${n.proteinG} g`, heavy: true },
    { label: 'Sodium', value: `${n.sodiumMg} mg` },
    { label: 'Caffeine', value: `${n.caffeineMg} mg` },
  ]

  return (
    <div className="nutrition">
      <table className="nutrition__table">
        <caption className="nutrition__caption">
          Nutrition Facts <span className="visually-hidden">for {name}</span>
        </caption>
        <tbody>
          <tr className="nutrition__serving">
            <th scope="row">Serving size</th>
            <td>1 can ({n.servingMl} ml)</td>
          </tr>
          <tr className="nutrition__amount">
            <td colSpan={2}>Amount per serving</td>
          </tr>
          <tr className="nutrition__calories">
            <th scope="row">Calories</th>
            <td>{n.energyKcal}</td>
          </tr>
          {rows.map((r) => (
            <tr
              key={r.label}
              className={`nutrition__row${r.sub ? ' nutrition__row--sub' : ''}${r.heavy ? ' nutrition__row--heavy' : ''}`}
            >
              <th scope="row">{r.label}</th>
              <td>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="nutrition__note">
        Approximate values per {n.servingMl} ml can. Recipes vary by country. Always check the label on the product.
      </p>
    </div>
  )
}
