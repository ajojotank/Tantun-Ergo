import type { DoctrineResourceWire } from './types';

type Props = { resources: DoctrineResourceWire[] };

function kindLabel(kind: DoctrineResourceWire['kind']): string {
  if (kind === 'download') return 'Download';
  if (kind === 'link') return 'Link';
  return 'Citation';
}

function kindGlyph(kind: DoctrineResourceWire['kind']): string {
  if (kind === 'download') return '↓';
  if (kind === 'link') return '↗';
  return '§';
}

export function ResourcesBlock({ resources }: Props) {
  if (resources.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="text-[11px] uppercase tracking-[0.22em] text-ink/55">References</h2>
      <ul className="divide-y divide-ink/10 border-y border-ink/10">
        {resources.map((r, i) => {
          const glyph = kindGlyph(r.kind);
          const ariaLabel = kindLabel(r.kind);

          if (r.kind === 'citation') {
            const inner = (
              <>
                <span aria-hidden className="w-5 flex-shrink-0 text-ink/55">{glyph}</span>
                <span className="flex-1">
                  <span className="font-display text-base text-ink">{r.label}</span>
                  {r.description ? (
                    <span className="block text-sm leading-snug text-ink/65">{r.description}</span>
                  ) : null}
                  <em className="block text-sm not-italic text-ink/85">{r.citation}</em>
                </span>
              </>
            );
            return (
              <li key={i}>
                {r.href ? (
                  <a
                    href={r.href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${ariaLabel}: ${r.label}`}
                    className="flex gap-3 px-1 py-3 transition-colors hover:bg-ink/[0.03]"
                  >
                    {inner}
                  </a>
                ) : (
                  <div className="flex gap-3 px-1 py-3">{inner}</div>
                )}
              </li>
            );
          }

          return (
            <li key={i}>
              <a
                href={r.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${ariaLabel}: ${r.label}`}
                download={r.kind === 'download' ? '' : undefined}
                className="flex gap-3 px-1 py-3 transition-colors hover:bg-ink/[0.03]"
              >
                <span aria-hidden className="w-5 flex-shrink-0 text-ink/55">{glyph}</span>
                <span className="flex-1">
                  <span className="font-display text-base text-ink">{r.label}</span>
                  {r.description ? (
                    <span className="block text-sm leading-snug text-ink/65">{r.description}</span>
                  ) : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
