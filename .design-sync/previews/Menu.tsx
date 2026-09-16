import * as React from 'react';
import { Menu, Button, IconButton, Icon } from '@kovara/design-system';

export const PolicyActions = () => (
  <Menu
    defaultOpen
    trigger={<IconButton icon={<Icon name="more-horizontal" />} label="Policy actions" />}
    groups={[
      {
        items: [
          { label: 'View documents', icon: <Icon name="file-text" size={16} /> },
          { label: 'Email insured', icon: <Icon name="mail" size={16} />, shortcut: '⌘E' },
          { label: 'Download contract', icon: <Icon name="download" size={16} /> },
        ],
      },
      {
        items: [{ label: 'Cancel policy', icon: <Icon name="x-circle" size={16} />, danger: true }],
      },
    ]}
  />
);

export const GroupedWithLabels = () => (
  <div style={{ maxWidth: 260 }}>
    <Menu
      groups={[
        {
          label: 'Quote KV-Q-8841',
          items: [
            { label: 'Re-rate with Kōvara', icon: <Icon name="sparkles" size={16} />, shortcut: '⌘R' },
            { label: 'Compare carriers', icon: <Icon name="grid" size={16} /> },
            { label: 'Send to customer', icon: <Icon name="mail" size={16} />, shortcut: '⌘⏎' },
          ],
        },
        {
          label: 'Export',
          items: [
            { label: 'Download PDF', icon: <Icon name="download" size={16} /> },
            { label: 'Push to CDK Drive', icon: <Icon name="plug" size={16} />, disabled: true },
          ],
        },
        {
          items: [{ label: 'Discard quote', icon: <Icon name="x-circle" size={16} />, danger: true }],
        },
      ]}
    />
  </div>
);

export const AlignedToEnd = () => (
  <div style={{ maxWidth: 460, display: 'flex', justifyContent: 'flex-end' }}>
    <Menu
      defaultOpen
      align="end"
      trigger={
        <Button variant="secondary" size="sm" trailingIcon={<Icon name="chevron-down" size={16} />}>
          Beacon Auto Group
        </Button>
      }
      groups={[
        {
          label: 'Switch partner',
          items: [
            { label: 'Beacon Auto Group', icon: <Icon name="car" size={16} /> },
            { label: 'Lakeshore Credit Union', icon: <Icon name="building" size={16} /> },
            { label: 'Fairview Service Center', icon: <Icon name="settings" size={16} /> },
          ],
        },
        { items: [{ label: 'Partner settings', icon: <Icon name="settings" size={16} />, href: '#' }] },
      ]}
    />
  </div>
);

export const ClaimRowActions = () => (
  <Menu
    defaultOpen
    trigger={<IconButton icon={<Icon name="more-horizontal" />} label="Claim actions" variant="outline" size="sm" />}
    groups={[
      {
        items: [
          { label: 'Open claim #2210', icon: <Icon name="file-text" size={16} /> },
          { label: 'Call Marcus Reyes', icon: <Icon name="phone" size={16} /> },
          { label: 'Assign to Luis Ferrer', icon: <Icon name="user" size={16} />, shortcut: '⌘A' },
        ],
      },
      {
        items: [
          { label: 'Reassign adjuster', icon: <Icon name="users" size={16} />, disabled: true },
          { label: 'Deny claim', icon: <Icon name="x-circle" size={16} />, danger: true },
        ],
      },
    ]}
  />
);
