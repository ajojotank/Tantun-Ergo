import { ComingSoon } from '../components/coming-soon'

export const metadata = { title: 'Doctrine — coming soon' }

export default function DoctrineComing() {
  return (
    <ComingSoon
      pillar="Doctrine"
      numeral="II"
      intent="A breviary-paced LMS over councils, encyclicals, the Catechism — read, watch, listen — with gentle mastery checks."
      comingIn="Opening this week."
    />
  )
}
