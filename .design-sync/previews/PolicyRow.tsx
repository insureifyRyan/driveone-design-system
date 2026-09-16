import * as React from 'react';
import { PolicyRow, IconButton, Icon, Menu } from '@kovara/design-system';

const stack: React.CSSProperties = { display: 'grid', gap: 8, maxWidth: 820 };

export const PolicyList = () => (
  <div style={stack}>
    <PolicyRow
      holder="Marcus Reyes"
      policyNumber="KV-4471-0098"
      subject="2021 Ford F-150 · 62,400 mi"
      premium="$118.40"
      cadence="monthly"
      status="active"
      owner="Dana Whitfield"
      interactive
      action={<IconButton icon={<Icon name="chevron-right" />} label="Open policy" size="sm" />}
    />
    <PolicyRow
      holder="Priya Raman"
      policyNumber="KV-4471-0126"
      subject="2019 Subaru Outback · 88,150 mi"
      premium="$96.75"
      cadence="monthly"
      status="expiring"
      statusLabel="Expires in 6 days"
      owner="Dana Whitfield"
      interactive
      action={<IconButton icon={<Icon name="chevron-right" />} label="Open policy" size="sm" />}
    />
    <PolicyRow
      holder="Beacon Auto Group"
      policyNumber="KV-4470-0031"
      subject="Dealer open lot · 42 units"
      premium="$1,842"
      cadence="per term"
      status="bound"
      owner="Priya Raman"
      interactive
      action={<IconButton icon={<Icon name="chevron-right" />} label="Open policy" size="sm" />}
    />
    <PolicyRow
      holder="Luis Ferrer"
      policyNumber="KV-4471-0044"
      subject="2022 Toyota Tacoma · 31,900 mi"
      premium="$104.20"
      cadence="monthly"
      status="lapsed"
      owner="Priya Raman"
      interactive
      action={<IconButton icon={<Icon name="chevron-right" />} label="Open policy" size="sm" />}
    />
  </div>
);

export const LifecycleStates = () => (
  <div style={stack}>
    <PolicyRow
      holder="Marcus Reyes"
      policyNumber="KV-Q-8841"
      subject="Platinum VSC · awaiting signature"
      premium="$118.40"
      cadence="monthly"
      status="draft"
      owner="Dana Whitfield"
    />
    <PolicyRow
      holder="Priya Raman"
      policyNumber="KV-Q-8852"
      subject="Gold VSC · Harbor Point Assurance"
      premium="$96.75"
      cadence="monthly"
      status="quoted"
      owner="Dana Whitfield"
    />
    <PolicyRow
      holder="Fairview Service Center"
      policyNumber="KV-4470-0118"
      subject="Garage liability · underwriter referral"
      premium="$612"
      cadence="monthly"
      status="in-review"
      owner="Priya Raman"
    />
    <PolicyRow
      holder="Marcus Reyes"
      policyNumber="KV-4471-0098"
      subject="2021 Ford F-150 · 62,400 mi"
      premium="$118.40"
      cadence="monthly"
      status="active"
      owner="Dana Whitfield"
    />
    <PolicyRow
      holder="Dana Whitfield"
      policyNumber="KV-4471-0203"
      subject="2018 Honda Civic · Ridgeline Specialty"
      premium="$88.10"
      cadence="monthly"
      status="declined"
      statusLabel="Declined — mileage"
      owner="Luis Ferrer"
    />
  </div>
);

export const WithOverflowMenu = () => (
  <div style={stack}>
    <PolicyRow
      holder="Marcus Reyes"
      policyNumber="KV-4471-0098"
      subject="2021 Ford F-150 · Centurion Mutual"
      premium="$118.40"
      cadence="monthly"
      status="active"
      owner="Dana Whitfield"
      action={
        <Menu
          trigger={<IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" size="sm" />}
          groups={[
            { items: [{ label: 'View documents' }] },
            { items: [{ label: 'Cancel policy', danger: true }] },
          ]}
        />
      }
    />
    <PolicyRow
      holder="Priya Raman"
      policyNumber="KV-4471-0126"
      subject="2019 Subaru Outback · Harbor Point Assurance"
      premium="$96.75"
      cadence="monthly"
      status="expiring"
      statusLabel="Expires in 6 days"
      owner="Dana Whitfield"
      action={
        <Menu
          trigger={<IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" size="sm" />}
          groups={[
            { items: [{ label: 'View documents' }] },
            { items: [{ label: 'Cancel policy', danger: true }] },
          ]}
        />
      }
    />
    <PolicyRow
      holder="Luis Ferrer"
      policyNumber="KV-4471-0044"
      subject="2022 Toyota Tacoma · Ridgeline Specialty"
      premium="$104.20"
      cadence="monthly"
      status="pending"
      statusLabel="Pending first payment"
      owner="Priya Raman"
      action={
        <Menu
          trigger={<IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" size="sm" />}
          groups={[
            { items: [{ label: 'View documents' }] },
            { items: [{ label: 'Cancel policy', danger: true }] },
          ]}
        />
      }
    />
  </div>
);

export const MemberAccountsWithoutPremium = () => (
  <div style={stack}>
    <PolicyRow
      holder="Marcus Reyes"
      policyNumber="LCU-2210-4471"
      subject="Lakeshore Credit Union · auto loan 60 mo"
      status="active"
      owner="Priya Raman"
      interactive
      action={<IconButton icon={<Icon name="chevron-right" />} label="Open member" size="sm" />}
    />
    <PolicyRow
      holder="Fairview Service Center"
      policyNumber="KV-4470-0118"
      subject="Commercial GL · 3 locations"
      status="in-review"
      statusLabel="Underwriter review"
      owner="Dana Whitfield"
      interactive
      action={<IconButton icon={<Icon name="chevron-right" />} label="Open account" size="sm" />}
    />
    <PolicyRow
      holder="Beacon Auto Group"
      policyNumber="KV-4470-0031"
      subject="Dealer open lot · 42 units"
      status="expiring"
      statusLabel="Renews Apr 30"
      owner="Priya Raman"
      interactive
      action={<IconButton icon={<Icon name="chevron-right" />} label="Open account" size="sm" />}
    />
  </div>
);
