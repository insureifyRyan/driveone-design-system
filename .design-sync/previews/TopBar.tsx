import * as React from 'react';
import { TopBar, SearchInput, IconButton, Icon, Avatar, Badge, KovaraProvider } from '@kovara/design-system';

export const WorkspaceHeader = () => (
  <div style={{ maxWidth: 720 }}>
    <TopBar
      title="Quotes"
      center={<SearchInput placeholder="Search policies, VINs, claim IDs…" shortcut="⌘K" />}
      end={
        <>
          <IconButton variant="ghost" icon={<Icon name="bell" />} label="Notifications" />
          <Avatar name="Dana Whitfield" size="sm" />
        </>
      }
    />
  </div>
);

export const WithRailToggleAndAgentStatus = () => (
  <div style={{ maxWidth: 720 }}>
    <TopBar
      start={<IconButton variant="ghost" icon={<Icon name="grid" />} label="Collapse navigation" />}
      title="Claims"
      center={<SearchInput placeholder="Search claims, adjusters, VINs…" shortcut="⌘K" />}
      end={
        <>
          <Badge tone="accent" pill icon={<Icon name="sparkles" size={12} />}>
            14 triaged
          </Badge>
          <IconButton variant="ghost" icon={<Icon name="bell" />} label="Notifications" />
          <Avatar name="Luis Ferrer" size="sm" tone="secondary" />
        </>
      }
    />
  </div>
);

export const TitleOnly = () => (
  <div style={{ maxWidth: 720 }}>
    <TopBar
      title="Beacon Auto Group"
      end={
        <>
          <IconButton variant="ghost" icon={<Icon name="settings" />} label="Workspace settings" />
          <Avatar name="Priya Raman" size="sm" tone="accent" />
        </>
      }
    />
  </div>
);

export const DarkChrome = () => (
  <KovaraProvider theme="dark">
    <div style={{ maxWidth: 720, padding: 16 }}>
      <TopBar
        title="Workflows"
        center={<SearchInput placeholder="Search runs, triggers, integrations…" shortcut="⌘K" />}
        end={
          <>
            <IconButton variant="ghost" icon={<Icon name="bell" />} label="Notifications" />
            <Avatar name="Dana Whitfield" size="sm" />
          </>
        }
      />
    </div>
  </KovaraProvider>
);
