import { ChiRho } from '@/components/brand/chi-rho'

// A thin horizontal gilt rule with a centered chi-rho ornament. Used between
// home page sections to give a manuscript-tradition rhythm.
export function GildedRule({ className }: { className?: string }) {
  return (
    <div
      role="presentation"
      className={`mx-auto flex w-full max-w-7xl items-center gap-4 px-5 sm:px-8 ${
        className ?? ''
      }`}
    >
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gilt/50 to-transparent" />
      <ChiRho size={20} className="text-gilt" />
      <span className="h-px flex-1 bg-gradient-to-r from-gilt/50 via-gilt/50 to-transparent" />
    </div>
  )
}
