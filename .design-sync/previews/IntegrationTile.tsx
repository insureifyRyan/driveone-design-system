import * as React from 'react';
import { IntegrationTile, Card, Button, IconButton, Icon } from '@kovara/design-system';

export const ConnectedDMS = () => (
  <div style={{ maxWidth: 720 }}>
    <IntegrationTile
      name="CDK Drive"
      description="Deal jackets and F&I product sales for Beacon Auto Group"
      status="active"
      lastSync="Synced 4 min ago"
      direction="bidirectional"
      action={
        <Button variant="secondary" size="sm">
          Configure
        </Button>
      }
    />
  </div>
);

export const ConnectedSystems = () => (
  <div style={{ maxWidth: 720 }}>
    <Card
      title="Connected systems"
      subtitle="4 integrations · 1 needs attention"
      action={<IconButton icon={<Icon name="more-horizontal" />} label="Integration options" size="sm" />}
    >
      <div style={{ display: 'grid', gap: 16 }}>
        <IntegrationTile
          name="CDK Drive"
          description="Deal jackets and F&I product sales for Beacon Auto Group"
          status="active"
          lastSync="Synced 4 min ago"
          direction="bidirectional"
          action={
            <Button variant="secondary" size="sm">
              Configure
            </Button>
          }
        />
        <IntegrationTile
          name="Symitar"
          description="Lakeshore Credit Union member and loan core"
          status="lapsed"
          statusLabel="Credentials expired"
          lastSync="Last synced 6 days ago"
          direction="bidirectional"
          action={
            <Button variant="primary" size="sm">
              Reconnect
            </Button>
          }
        />
        <IntegrationTile
          name="Centurion Rating API"
          description="Vehicle service contract rates and term eligibility"
          status="active"
          lastSync="Rated 40 sec ago"
          direction="outbound"
          action={
            <Button variant="secondary" size="sm">
              Configure
            </Button>
          }
        />
        <IntegrationTile
          name="Salesforce"
          description="Producer pipeline and quote-to-policy handoff"
          status="pending"
          statusLabel="Authorizing"
          lastSync="Never synced"
          direction="inbound"
          action={
            <Button variant="ghost" size="sm">
              View status
            </Button>
          }
        />
      </div>
    </Card>
  </div>
);

export const LapsedNeedsReconnect = () => (
  <div style={{ maxWidth: 720 }}>
    <IntegrationTile
      name="Symitar"
      description="Lakeshore Credit Union member and loan core. Kōvara paused member lead enrichment until the service credentials are renewed."
      status="lapsed"
      statusLabel="Credentials expired"
      lastSync="Last synced 6 days ago"
      direction="bidirectional"
      action={
        <Button variant="primary" size="sm">
          Reconnect
        </Button>
      }
    />
  </div>
);

export const ConnectionStatuses = () => (
  <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
    <IntegrationTile
      name="CDK Drive"
      description="Deal jackets and F&I product sales"
      status="active"
      lastSync="Synced 4 min ago"
      direction="bidirectional"
      action={
        <Button variant="secondary" size="sm">
          Configure
        </Button>
      }
    />
    <IntegrationTile
      name="Salesforce"
      description="Producer pipeline and quote-to-policy handoff"
      status="pending"
      statusLabel="Authorizing"
      lastSync="Never synced"
      direction="inbound"
      action={
        <Button variant="ghost" size="sm">
          View status
        </Button>
      }
    />
    <IntegrationTile
      name="Symitar"
      description="Lakeshore Credit Union member and loan core"
      status="lapsed"
      statusLabel="Credentials expired"
      lastSync="Last synced 6 days ago"
      direction="bidirectional"
      action={
        <Button variant="primary" size="sm">
          Reconnect
        </Button>
      }
    />
    <IntegrationTile
      name="Harbor Point Assurance"
      description="Claims FNOL intake — mapping not yet published"
      status="draft"
      lastSync="Not connected"
      direction="outbound"
      action={
        <Button variant="secondary" size="sm">
          Connect
        </Button>
      }
    />
  </div>
);

export const DataDirections = () => (
  <div style={{ display: 'grid', gap: 16, maxWidth: 720 }}>
    <IntegrationTile
      name="CDK Drive"
      description="Two-way: Kōvara reads deal jackets and writes signed F&I contracts back to the store"
      status="active"
      lastSync="Synced 4 min ago"
      direction="bidirectional"
      action={
        <Button variant="secondary" size="sm">
          Configure
        </Button>
      }
    />
    <IntegrationTile
      name="Centurion Rating API"
      description="Outbound only: rate requests for term, mileage band and deductible"
      status="active"
      lastSync="Rated 40 sec ago"
      direction="outbound"
      action={
        <Button variant="secondary" size="sm">
          Configure
        </Button>
      }
    />
    <IntegrationTile
      name="Salesforce"
      description="Inbound only: producer-owned leads flow into the quoting queue"
      status="active"
      lastSync="Synced 22 min ago"
      direction="inbound"
      action={
        <Button variant="secondary" size="sm">
          Configure
        </Button>
      }
    />
  </div>
);
