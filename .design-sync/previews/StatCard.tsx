import * as React from 'react';
import { StatCard, Icon } from '@kovara/design-system';

/** Canonical: the four-tile KPI row above the fold on the agency dashboard. */
export const DashboardRow = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(170px, 1fr))', gap: 16, maxWidth: 820 }}>
    <StatCard
      label="Quotes issued"
      value="1,284"
      delta="+18.2%"
      trend="up"
      caption="vs. last 30 days"
      icon={<Icon name="file-text" size={18} />}
    />
    <StatCard
      label="Warranty attach rate"
      value="31%"
      delta="+4.1 pts"
      trend="up"
      caption="Goal 40%"
      icon={<Icon name="shield" size={18} />}
    />
    <StatCard
      label="Contracts bound"
      value="412"
      delta="-2.6%"
      trend="down"
      caption="vs. last 30 days"
      icon={<Icon name="check-circle" size={18} />}
    />
    <StatCard
      label="Written premium"
      value="$48.2k"
      delta="+$6.1k"
      trend="up"
      caption="Month to date"
      icon={<Icon name="credit-card" size={18} />}
    />
  </div>
);

/** The trend axis: green up, red down, grey flat — the color is the judgement. */
export const Trends = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(190px, 1fr))', gap: 16, maxWidth: 720 }}>
    <StatCard
      label="Calls handled by agent"
      value="3,910"
      delta="+22.7%"
      trend="up"
      caption="vs. last 30 days"
      icon={<Icon name="phone" size={18} />}
    />
    <StatCard
      label="Quote abandonment"
      value="14.8%"
      delta="+3.2 pts"
      trend="down"
      caption="vs. last 30 days"
      icon={<Icon name="alert-triangle" size={18} />}
    />
    <StatCard
      label="Carriers connected"
      value="7"
      delta="No change"
      trend="flat"
      caption="All rating APIs healthy"
      icon={<Icon name="plug" size={18} />}
    />
  </div>
);

/**
 * Metrics where a fall is the win: `trend="up"` is passed on a falling number because the
 * direction of the number is good, not because the arrow points up.
 */
export const FallingIsGood = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(200px, 1fr))', gap: 16, maxWidth: 480 }}>
    <StatCard
      label="Manual touches / deal"
      value="2.4"
      delta="-38%"
      trend="up"
      caption="Fewer is better"
      icon={<Icon name="zap" size={18} />}
    />
    <StatCard
      label="Avg. claim cycle time"
      value="3.1 days"
      delta="-1.4 days"
      trend="up"
      caption="Since AI triage went live"
      icon={<Icon name="clock" size={18} />}
    />
  </div>
);

/** Bare tiles: label and value only, for a compact secondary strip. */
export const ValueOnly = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(150px, 1fr))', gap: 16, maxWidth: 560 }}>
    <StatCard label="Open claims" value="38" />
    <StatCard label="Policies in force" value="9,146" />
    <StatCard label="Dealer rooftops live" value="126" />
  </div>
);
