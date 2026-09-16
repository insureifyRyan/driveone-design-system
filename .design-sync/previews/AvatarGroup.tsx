import * as React from 'react';
import { AvatarGroup, Card, StatusPill, Badge, Icon } from '@kovara/design-system';

const ACCOUNT_TEAM = [
  { name: 'Dana Whitfield' },
  { name: 'Marcus Reyes' },
  { name: 'Priya Raman' },
  { name: 'Luis Ferrer' },
  { name: 'Ana Castillo' },
];

const PROGRAM_ROSTER = [
  { name: 'Dana Whitfield' },
  { name: 'Marcus Reyes' },
  { name: 'Priya Raman' },
  { name: 'Luis Ferrer' },
  { name: 'Ana Castillo' },
  { name: 'Grant Yoshida' },
  { name: 'Nadia Okonkwo' },
  { name: 'Tomas Belcher' },
  { name: 'Renee Vaughn' },
];

const label: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.06em',
  textTransform: 'uppercase',
  color: 'var(--kv-color-text-muted)',
};

export const AccountTeam = () => (
  <div style={{ maxWidth: 460 }}>
    <Card title="Beacon Auto Group" subtitle="Dealer program · 5 assigned producers">
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <AvatarGroup people={ACCOUNT_TEAM} max={4} size="md" />
        <span style={{ fontSize: 13, color: 'var(--kv-color-text-secondary)' }}>
          Dana Whitfield, Marcus Reyes and 3 others
        </span>
      </div>
    </Card>
  </div>
);

export const SizeScale = () => (
  <div style={{ display: 'grid', gap: 16, maxWidth: 460 }}>
    {(['sm', 'md', 'lg'] as const).map((size) => (
      <div key={size} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <span style={{ ...label, width: 28 }}>{size}</span>
        <AvatarGroup people={ACCOUNT_TEAM} max={4} size={size} />
      </div>
    ))}
  </div>
);

export const OverflowCollapse = () => (
  <div style={{ display: 'grid', gap: 18, maxWidth: 460 }}>
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={label}>max 3 · claim #2210 adjusters</span>
      <AvatarGroup people={PROGRAM_ROSTER.slice(0, 6)} max={3} size="sm" />
    </div>
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={label}>max 5 · Lakeshore Credit Union program</span>
      <AvatarGroup people={PROGRAM_ROSTER} max={5} size="sm" />
    </div>
    <div style={{ display: 'grid', gap: 6 }}>
      <span style={label}>no overflow · Fairview Service Center</span>
      <AvatarGroup people={ACCOUNT_TEAM.slice(0, 3)} max={5} size="sm" />
    </div>
  </div>
);

export const InClaimRow = () => (
  <div style={{ maxWidth: 720 }}>
    <Card padding="compact">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div style={{ display: 'grid', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Claim #2210 · Marcus Reyes</span>
          <span style={{ fontSize: 12, color: 'var(--kv-color-text-secondary)' }}>
            Harbor Point Assurance · VIN 1HGCM82633A004352
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Badge tone="accent" icon={<Icon name="sparkles" size={12} />}>AI triaged</Badge>
          <AvatarGroup people={[{ name: 'Luis Ferrer' }, { name: 'Priya Raman' }, { name: 'Dana Whitfield' }]} max={3} size="sm" />
          <StatusPill status="in-review" />
        </div>
      </div>
    </Card>
  </div>
);
