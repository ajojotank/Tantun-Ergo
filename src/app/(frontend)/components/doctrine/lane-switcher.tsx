'use client';

import { useState } from 'react';
import { RichText } from '@payloadcms/richtext-lexical/react';
import { AutoCompleteSentinel } from './auto-complete-sentinel';
import { markCompleteAction } from '@/app/(frontend)/doctrine/[course]/[module]/[unit]/actions';
import type { DoctrineLanesWire } from './types';

type Props = {
  lanes: DoctrineLanesWire;
  unitPath: string;
  isAlreadyComplete: boolean;
};

type Lane = 'reading' | 'watch' | 'listen';

export function LaneSwitcher({ lanes, unitPath, isAlreadyComplete }: Props) {
  const availableLanes: Lane[] = [
    lanes.hasReading ? 'reading' : null,
    lanes.hasWatch ? 'watch' : null,
    lanes.hasListen ? 'listen' : null,
  ].filter((l): l is Lane => l !== null);

  const [activeLane, setActiveLane] = useState<Lane>(availableLanes[0] ?? 'reading');

  if (availableLanes.length === 0) return null;

  const tabClass = (lane: Lane) =>
    `border-b-2 px-4 py-2 text-sm font-medium uppercase tracking-[0.18em] transition-colors ${
      activeLane === lane
        ? 'border-gilt text-ink'
        : 'border-transparent text-ink/55 hover:text-ink/85'
    }`;

  const handleLaneEnded = () => {
    if (isAlreadyComplete) return;
    markCompleteAction(unitPath).catch((err) => {
      console.error('lane-end markComplete failed', err);
    });
  };

  return (
    <div className="space-y-6">
      <div role="tablist" className="flex gap-2 border-b border-ink/15">
        {lanes.hasReading ? (
          <button type="button" role="tab" aria-selected={activeLane === 'reading'} onClick={() => setActiveLane('reading')} className={tabClass('reading')}>
            Read
          </button>
        ) : null}
        {lanes.hasWatch ? (
          <button type="button" role="tab" aria-selected={activeLane === 'watch'} onClick={() => setActiveLane('watch')} className={tabClass('watch')}>
            Watch
          </button>
        ) : null}
        {lanes.hasListen ? (
          <button type="button" role="tab" aria-selected={activeLane === 'listen'} onClick={() => setActiveLane('listen')} className={tabClass('listen')}>
            Listen
          </button>
        ) : null}
      </div>

      <div>
        {activeLane === 'reading' && lanes.reading ? (
          <article className="prose prose-stone max-w-[65ch] text-base leading-relaxed text-ink/90">
            <RichText data={lanes.reading} />
            <AutoCompleteSentinel unitPath={unitPath} isAlreadyComplete={isAlreadyComplete} />
          </article>
        ) : null}

        {activeLane === 'watch' && lanes.watchVideoUrl ? (
          <video
            src={lanes.watchVideoUrl}
            controls
            className="w-full max-w-4xl"
            onEnded={handleLaneEnded}
          />
        ) : null}

        {activeLane === 'listen' && lanes.listenAudioUrl ? (
          <audio
            src={lanes.listenAudioUrl}
            controls
            className="w-full"
            onEnded={handleLaneEnded}
          />
        ) : null}
      </div>
    </div>
  );
}
