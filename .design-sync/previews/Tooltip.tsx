import * as React from 'react';
import { Tooltip, IconButton, Icon, Button, StatCard, Badge } from '@kovara/design-system';

export const MetricDefinition = () => (
  <div style={{ padding: '190px 24px 24px', maxWidth: 460 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 600 }}>Attach rate</span>
      <Tooltip open content="Share of eligible deals with a service contract attached.">
        <IconButton icon={<Icon name="info" />} label="About attach rate" size="sm" />
      </Tooltip>
    </div>
    <StatCard
      label="Attach rate"
      value="31.4%"
      delta="+2.1 pts"
      trend="up"
      caption="vs. last 30 days · Beacon Auto Group"
      icon={<Icon name="trending-up" size={18} />}
    />
  </div>
);

export const Placements = () => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '150px 220px',
      padding: '190px 180px',
      justifyItems: 'center',
      alignItems: 'center',
      maxWidth: 860,
    }}
  >
    <Tooltip open placement="top" content="Rated 4 minutes ago.">
      <Button size="sm" variant="secondary">top</Button>
    </Tooltip>
    <Tooltip open placement="bottom" content="Sends the quote to Marcus Reyes.">
      <Button size="sm" variant="secondary">bottom</Button>
    </Tooltip>
    <Tooltip open placement="left" content="Syncs the deal to CDK Drive.">
      <Button size="sm" variant="secondary">left</Button>
    </Tooltip>
    <Tooltip open placement="right" content="Claim #2210 awaits Luis Ferrer.">
      <Button size="sm" variant="secondary">right</Button>
    </Tooltip>
  </div>
);

export const TruncatedValue = () => (
  <div style={{ padding: '24px 24px 120px', maxWidth: 460, display: 'grid', gap: 14 }}>
    <span style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--kv-color-text-muted)' }}>
      Administrator
    </span>
    <Tooltip open placement="bottom" content="Harbor Point Assurance Company of North America">
      <span
        style={{
          maxWidth: 190,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          fontSize: 13,
          fontWeight: 600,
          borderBottom: '1px dotted var(--kv-color-border)',
          cursor: 'help',
        }}
      >
        Harbor Point Assurance Company of North America
      </span>
    </Tooltip>
  </div>
);

export const IconOnlyAction = () => (
  <div style={{ padding: '190px 24px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
    <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI drafted</Badge>
    <Tooltip open content="Re-run the Centurion Rating API.">
      <IconButton icon={<Icon name="zap" />} label="Re-rate quote" variant="outline" />
    </Tooltip>
    <Tooltip content="Download the signed contract PDF.">
      <IconButton icon={<Icon name="download" />} label="Download contract" variant="outline" />
    </Tooltip>
    <span style={{ fontSize: 12, color: 'var(--kv-color-text-muted)' }}>(the second tip appears on hover)</span>
  </div>
);
