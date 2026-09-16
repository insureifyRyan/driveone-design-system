import * as React from 'react';
import { Sidebar, Logo, Icon, Avatar } from '@kovara/design-system';

const operations = {
  label: 'Operations',
  items: [
    { label: 'Dashboard', icon: <Icon name="grid" size={18} />, href: '#', active: true },
    { label: 'Quotes', icon: <Icon name="file-text" size={18} />, href: '#', badge: 12 },
    { label: 'Policies', icon: <Icon name="shield" size={18} />, href: '#' },
    { label: 'Claims', icon: <Icon name="clipboard" size={18} />, href: '#', badge: 3 },
  ],
};

const automation = {
  label: 'Automation',
  items: [
    { label: 'Workflows', icon: <Icon name="zap" size={18} />, href: '#' },
    { label: 'Voice', icon: <Icon name="phone" size={18} />, href: '#' },
    { label: 'Integrations', icon: <Icon name="plug" size={18} />, href: '#', badge: 2 },
  ],
};

const admin = {
  label: 'Admin',
  items: [
    { label: 'Team', icon: <Icon name="users" size={18} />, href: '#' },
    { label: 'Settings', icon: <Icon name="settings" size={18} />, href: '#' },
  ],
};

const ProducerFooter = () => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
    <Avatar name="Dana Whitfield" size="sm" />
    <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1.3 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>Dana Whitfield</span>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>Producer · Centurion Mutual</span>
    </span>
  </div>
);

export const ProductNavigation = () => (
  <div style={{ height: 600, display: 'flex' }}>
    <Sidebar
      brand={<Logo size="sm" onBrand />}
      sections={[operations, automation, admin]}
      footer={<ProducerFooter />}
    />
  </div>
);

export const CollapsedRail = () => (
  <div style={{ height: 600, display: 'flex', gap: 24 }}>
    <Sidebar
      collapsed
      brand={<Logo variant="mark" size="sm" onBrand />}
      sections={[operations, automation, admin]}
      footer={<Avatar name="Dana Whitfield" size="sm" />}
    />
    <Sidebar
      brand={<Logo size="sm" onBrand />}
      sections={[operations, automation]}
      footer={<ProducerFooter />}
    />
  </div>
);

export const EmbeddedPartnerTone = () => (
  <div style={{ height: 600, display: 'flex' }}>
    <Sidebar
      tone="light"
      brand={<Logo size="sm" />}
      sections={[
        {
          label: 'Beacon Auto Group',
          items: [
            { label: 'Deals in progress', icon: <Icon name="car" size={18} />, href: '#', active: true, badge: 7 },
            { label: 'F&I products', icon: <Icon name="credit-card" size={18} />, href: '#' },
            { label: 'Contracts', icon: <Icon name="file-text" size={18} />, href: '#' },
          ],
        },
        {
          label: 'Automation',
          items: [
            { label: 'Workflows', icon: <Icon name="zap" size={18} />, href: '#' },
            { label: 'CDK Drive sync', icon: <Icon name="plug" size={18} />, href: '#' },
          ],
        },
      ]}
      footer={
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar name="Beacon Auto Group" size="sm" square tone="brand" />
          <span style={{ fontSize: 13, fontWeight: 600 }}>Beacon Auto Group</span>
        </div>
      }
    />
  </div>
);
