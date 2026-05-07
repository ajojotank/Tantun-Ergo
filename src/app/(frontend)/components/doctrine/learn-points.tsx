type Props = { points: string[] };

export function LearnPoints({ points }: Props) {
  if (points.length === 0) return null;
  return (
    <div className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink/55">What you'll learn</h2>
      <ul className="space-y-2 text-sm leading-relaxed text-ink/85">
        {points.map((p, i) => (
          <li key={i} className="flex gap-3">
            <span aria-hidden className="mt-[0.4em] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-gilt" />
            <span>{p}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
