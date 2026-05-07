// src/app/(frontend)/components/doctrine/serialise.ts
//
// Payload-doc → wire-shape mappers shared by every server page that hands
// data into doctrine client components. Defensive narrowing at the boundary
// keeps types tight downstream — mirrors components/atlas/serialise.ts.
import {
  type DoctrineMasteryOption,
  type DoctrineModuleSummary,
  type DoctrineTrackSummary,
  type DoctrineUnitFull,
  type DoctrineUnitSummary,
} from './types'

export function toTrackSummary(raw: unknown): DoctrineTrackSummary {
  const r = raw as Record<string, unknown>
  const cover =
    r.coverPlate && typeof r.coverPlate === 'object'
      ? (r.coverPlate as Record<string, unknown>)
      : null
  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    summary: typeof r.summary === 'string' ? r.summary : null,
    coverPlate:
      cover && typeof cover.url === 'string'
        ? { url: cover.url as string, alt: typeof cover.alt === 'string' ? cover.alt : '' }
        : null,
    order: Number(r.order ?? 0),
    isSample: Boolean(r._isSample),
  }
}

export function toModuleSummary(raw: unknown, unitCount = 0): DoctrineModuleSummary {
  const r = raw as Record<string, unknown>
  const trackRaw = r.track
  const track =
    trackRaw && typeof trackRaw === 'object'
      ? (trackRaw as Record<string, unknown>)
      : null
  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    summary: typeof r.summary === 'string' ? r.summary : null,
    trackSlug: track && typeof track.slug === 'string' ? track.slug : '',
    trackTitle: track && typeof track.title === 'string' ? track.title : '',
    order: Number(r.order ?? 0),
    unitCount,
    isSample: Boolean(r._isSample),
  }
}

export function toUnitSummary(raw: unknown): DoctrineUnitSummary {
  const r = raw as Record<string, unknown>
  const moduleRaw = r.module
  const m =
    moduleRaw && typeof moduleRaw === 'object'
      ? (moduleRaw as Record<string, unknown>)
      : null
  const trackRaw = m?.track
  const t =
    trackRaw && typeof trackRaw === 'object'
      ? (trackRaw as Record<string, unknown>)
      : null
  const lanes =
    r.lanes && typeof r.lanes === 'object'
      ? (r.lanes as Record<string, unknown>)
      : null
  const watchVideo = lanes?.watchVideo
  const listenAudio = lanes?.listenAudio
  const hasWatch =
    typeof watchVideo === 'object' &&
    watchVideo !== null &&
    typeof (watchVideo as Record<string, unknown>).url === 'string'
  const hasListen =
    typeof listenAudio === 'object' &&
    listenAudio !== null &&
    typeof (listenAudio as Record<string, unknown>).url === 'string'
  return {
    id: String(r.id),
    slug: String(r.slug ?? ''),
    title: String(r.title ?? ''),
    moduleSlug: m && typeof m.slug === 'string' ? m.slug : '',
    moduleTitle: m && typeof m.title === 'string' ? m.title : '',
    trackSlug: t && typeof t.slug === 'string' ? t.slug : '',
    trackTitle: t && typeof t.title === 'string' ? t.title : '',
    order: Number(r.order ?? 0),
    hasWatch,
    hasListen,
    isSample: Boolean(r._isSample),
  }
}

export function toUnitFull(raw: unknown): DoctrineUnitFull {
  const summary = toUnitSummary(raw)
  const r = raw as Record<string, unknown>
  const lanes =
    r.lanes && typeof r.lanes === 'object'
      ? (r.lanes as Record<string, unknown>)
      : null
  const watchVideo = lanes?.watchVideo
  const listenAudio = lanes?.listenAudio
  const watchUrl =
    typeof watchVideo === 'object' &&
    watchVideo !== null &&
    typeof (watchVideo as Record<string, unknown>).url === 'string'
      ? ((watchVideo as Record<string, unknown>).url as string)
      : null
  const listenUrl =
    typeof listenAudio === 'object' &&
    listenAudio !== null &&
    typeof (listenAudio as Record<string, unknown>).url === 'string'
      ? ((listenAudio as Record<string, unknown>).url as string)
      : null
  const mastery =
    r.masteryCheck && typeof r.masteryCheck === 'object'
      ? (r.masteryCheck as Record<string, unknown>)
      : null
  const optionsRaw = Array.isArray(mastery?.options) ? mastery!.options : []
  const masteryOptions: DoctrineMasteryOption[] = optionsRaw.map((o) => {
    const oo = o as Record<string, unknown>
    return {
      text: typeof oo.text === 'string' ? oo.text : '',
      isCorrect: Boolean(oo.isCorrect),
      affirmation: typeof oo.affirmation === 'string' ? oo.affirmation : null,
    }
  })
  return {
    ...summary,
    introduction: (r.introduction as unknown) ?? null,
    reading: (lanes?.reading as unknown) ?? null,
    watchVideoUrl: watchUrl,
    listenAudioUrl: listenUrl,
    masteryPrompt:
      mastery && typeof mastery.prompt === 'string' && mastery.prompt.trim()
        ? (mastery.prompt as string)
        : null,
    masteryOptions,
  }
}
