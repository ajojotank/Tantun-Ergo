import { ComingSoon } from '../components/coming-soon'

export const metadata = { title: 'Catechist — coming soon' }

export default function CatechistComing() {
  return (
    <ComingSoon
      pillar="Catechist"
      numeral="III"
      intent="An interlocutor bound to citation. It quotes the Magisterium; it never invents."
      comingIn="Opening this week."
    />
  )
}
