'use client';

import { useState } from 'react';
import { Label } from './ui/label';
import { Button } from './ui/button';

const RPE_SCALE_DATA = [
  {
    value: 1,
    descriptor: 'Very, Very Light',
    emoji: '😌',
    color: 'bg-blue-200 dark:bg-blue-900',
    guidance:
      'Like walking.\n\nBarely any sensation of effort.\n\nYour breathing is normal and you are perfectly comfortable.',
  },
  {
    value: 2,
    descriptor: 'Easy',
    emoji: '😊',
    color: 'bg-blue-300 dark:bg-blue-800',
    guidance:
      'All-day pace.\n\nLight muscle load.\n\nBreathing is easy and you can have a full, effortless conversation.',
  },
  {
    value: 3,
    descriptor: 'Moderate',
    emoji: '🙂',
    color: 'bg-green-300 dark:bg-green-800',
    guidance:
      "This is 'Endurance' pace.\n\nYou feel the effort but are in complete control.\n\nBreathing is deeper. You can still speak in full sentences.",
  },
  {
    value: 4,
    descriptor: 'Getting Harder',
    emoji: '😏',
    color: 'bg-green-400 dark:bg-green-700',
    guidance:
      "Upper endurance or lower 'Tempo'.\n\nConversation is no longer effortless.\n\nYou are starting to speak in shorter phrases.",
  },
  {
    value: 5,
    descriptor: 'Hard',
    emoji: '😐',
    color: 'bg-yellow-400 dark:bg-yellow-700',
    guidance:
      "This is solid 'Tempo' pace.\n\nThe effort is significant and requires concentration.\n\nBreathing is deep and rhythmic. You can only speak 1-2 phrases at a time.",
  },
  {
    value: 6,
    descriptor: 'Harder',
    emoji: '😒',
    color: 'bg-yellow-500 dark:bg-yellow-600',
    guidance:
      "This is 'Sweet Spot' or lower 'Threshold'.\n\nVery uncomfortable. You feel muscular strain.\n\nYou can only speak 2-3 short words.",
  },
  {
    value: 7,
    descriptor: 'Very Hard',
    emoji: '😫',
    color: 'bg-orange-500 dark:bg-orange-600',
    guidance:
      'This is your Lactate Threshold (FTP).\n\nYour muscles are burning. Breathing is labored.\n\nYou can only speak 1-2 clipped words. This is a race pace you can hold for ~1 hour.',
  },
  {
    value: 8,
    descriptor: 'Very, Very Hard',
    emoji: '😩',
    color: 'bg-red-500 dark:bg-red-700',
    guidance:
      "This is 'VO2 Max'.\n\nA very painful effort that you can only hold for 3-8 minutes.\n\nYou cannot speak. Breathing is maximal.",
  },
  {
    value: 9,
    descriptor: 'Near Maximal',
    emoji: '🥵',
    color: 'bg-red-600 dark:bg-red-800',
    guidance:
      'Almost all you have.\n\nAn anaerobic, 1-2 minute effort. Your vision might narrow.\n\nYou are gasping for air.',
  },
  {
    value: 10,
    descriptor: 'Maximal',
    emoji: '😵',
    color: 'bg-red-700 dark:bg-red-900',
    guidance:
      "An all-out sprint.\n\nAs hard as you can possibly go for a few seconds. Complete muscle failure.\n\nYou can't even think about talking.",
  },
];

interface RpeSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export default function RpeSelector({ value, onChange }: RpeSelectorProps) {
  const [expandedCard, setExpandedCard] = useState<number | null>(null);

  const handleSelect = (rpeValue: number) => {
    onChange(rpeValue);
    // Toggle expansion: if the clicked card is already expanded, collapse it. Otherwise, expand it.
    setExpandedCard((current) => (current === rpeValue ? null : rpeValue));
  };

  const expandedCardData = RPE_SCALE_DATA.find(
    (rpe) => rpe.value === expandedCard
  );

  return (
    <div>
      <Label>Perceived Exertion</Label>
      <div className="mt-2 grid grid-cols-1 md:grid-cols-[auto,1fr] gap-4 items-start">
        {/* Left Column: RPE Cards */}
        <div className="space-y-1">
          {RPE_SCALE_DATA.map((rpe) => {
            const isSelected = rpe.value === value;
            return (
              <Button
                key={rpe.value}
                type="button"
                onClick={() => handleSelect(rpe.value)}
                variant="outline"
                className={`w-full justify-start h-auto p-2 text-left transition-colors duration-200 flex items-center space-x-3 ${rpe.color} ${isSelected ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : ''}`}
              >
                <span className="text-xs w-5 text-center text-foreground/70">
                  {rpe.value}
                </span>
                <span className="text-sm">{rpe.emoji}</span>
                <span className="text-xs text-foreground/70 pr-4">
                  {rpe.descriptor}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Right Column: Guidance Text */}
        <div className="h-full min-h-[200px] md:min-h-0">
          {expandedCardData ? (
            <div className="p-4 bg-muted rounded-lg h-full">
              <h4 className="font-semibold text-sm text-muted-foreground">
                {expandedCardData.descriptor} (RPE {expandedCardData.value})
              </h4>
              <p className="mt-2 text-xs text-foreground whitespace-pre-wrap">
                {expandedCardData.guidance}
              </p>
            </div>
          ) : (
            <div className="p-4 bg-muted/50 rounded-lg h-full flex items-center justify-center">
              <p className="text-xs text-muted-foreground">
                Click a card for details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
