import React from 'react';
import SegmentedControl from '../SegmentedControl';
import type { StatsTimeRange } from '../../storage/types';

type Props = {
  selected: StatsTimeRange;
  onSelect: (range: StatsTimeRange) => void;
};

const SEGMENTS: { key: StatsTimeRange; label: string }[] = [
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'all', label: 'All' },
];

/**
 * Time range selector for stats breakdown.
 * Wraps SegmentedControl with stats-specific options.
 */
export default function RangeSwitcher({ selected, onSelect }: Props) {
  return (
    <SegmentedControl<StatsTimeRange> segments={SEGMENTS} selected={selected} onSelect={onSelect} />
  );
}
