import * as React from 'react';
import { EndpointRow, Card, Badge, Button } from '@kovara/design-system';

export const QuotesApi = () => (
  <div style={{ maxWidth: 720 }}>
    <Card title="Quotes API" subtitle="api.kovara.ai/v1" padding="none">
        <EndpointRow bare method="POST" path="/v1/quotes" description="Rate a contract across every appointed carrier" />
        <EndpointRow bare method="GET" path="/v1/quotes/{quote_id}" description="Retrieve a rated quote and its carrier responses" />
        <EndpointRow bare method="PATCH" path="/v1/quotes/{quote_id}" description="Re-rate with a new term, deductible or mileage band" />
        <EndpointRow bare method="POST" path="/v1/quotes/{quote_id}/bind" description="Bind the selected option and issue the contract" />
        <EndpointRow bare method="DELETE" path="/v1/quotes/{quote_id}" description="Void an unbound quote so it stops counting against the producer" />
    </Card>
  </div>
);

export const PoliciesApi = () => (
  <div style={{ maxWidth: 720 }}>
    <Card title="Policies API" subtitle="api.kovara.ai/v1" padding="none">
        <EndpointRow bare method="GET" path="/v1/policies" description="List bound contracts for a dealer, agency or credit union" />
        <EndpointRow bare method="GET" path="/v1/policies/{policy_id}" description="Retrieve a bound contract with its coverage and remittance detail" />
        <EndpointRow bare method="PUT" path="/v1/policies/{policy_id}/transfer" description="Transfer coverage to the next owner of the vehicle" />
        <EndpointRow bare method="POST" path="/v1/policies/{policy_id}/claims" description="Open a claim against a bound contract" />
        <EndpointRow bare method="DELETE" path="/v1/policies/{policy_id}" description="Cancel the contract and start the pro-rata refund" />
    </Card>
  </div>
);

export const Methods = () => (
  <div style={{ display: 'grid', gap: 12, maxWidth: 720 }}>
    <EndpointRow method="GET" path="/v1/policies/{policy_id}" description="Retrieve a bound contract" />
    <EndpointRow method="POST" path="/v1/quotes" description="Rate a contract across every appointed carrier" />
    <EndpointRow method="PUT" path="/v1/policies/{policy_id}/transfer" description="Replace the contract holder on a transfer" />
    <EndpointRow method="PATCH" path="/v1/claims/{claim_id}" description="Update adjuster notes and claim disposition" />
    <EndpointRow method="DELETE" path="/v1/webhook_endpoints/{endpoint_id}" description="Stop delivering events to a subscriber" />
  </div>
);

export const WithTrailingSlot = () => (
  <div style={{ maxWidth: 720 }}>
    <Card title="Claims API" subtitle="Requires the claims.write scope" padding="none">
        <EndpointRow
          bare
          method="POST"
          path="/v1/claims"
          description="Open a claim against a bound contract"
          end={<Badge tone="brand">claims.write</Badge>}
        />
        <EndpointRow
          bare
          method="GET"
          path="/v1/claims/{claim_id}"
          description="Retrieve a claim with its adjuster timeline"
          end={<Badge tone="neutral">claims.read</Badge>}
        />
        <EndpointRow
          bare
          method="POST"
          path="/v1/claims/{claim_id}/estimate"
          description="Submit a repair estimate for AI triage"
          end={<Button size="sm" variant="secondary">Try it</Button>}
        />
    </Card>
  </div>
);
