import * as React from 'react';
import { ProductCard, BrandMark, Button, Icon } from '@kovara/design-system';

export const VistaWarranty = () => (
  <div style={{ maxWidth: 420 }}>
    <ProductCard
      name="Vista Warranty"
      audience="B2B · Insurance agencies"
      description="AI quoting and extended warranty your agency sells under its own name — the same coverage the dealer offers, at about 60% less."
      logo={<BrandMark size={40} title="Vista Warranty" />}
      status="live"
      action={<Button trailingIcon={<Icon name="arrow-right" />}>Open Vista</Button>}
    />
  </div>
);

export const Portfolio = () => (
  <div style={{ maxWidth: 860, display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 16 }}>
    <ProductCard
      name="Vista Warranty"
      audience="B2B · Insurance agencies"
      description="AI quoting and extended warranty your agency sells under its own name — same coverage as the dealer, about 60% less."
      logo={<BrandMark size={40} title="Vista Warranty" />}
      status="live"
      action={<Button trailingIcon={<Icon name="arrow-right" />}>Open Vista</Button>}
    />
    <ProductCard
      name="DriveOne Direct"
      audience="B2C · Individual users"
      description="Coverage a driver buys in minutes — VIN in, priced options back, contract signed without a dealership in the middle."
      logo={<BrandMark size={40} title="DriveOne Direct" />}
      status="live"
      action={<Button trailingIcon={<Icon name="arrow-right" />}>Get a quote</Button>}
    />
    <ProductCard
      name="DriveOne Service"
      audience="B2B · Dealerships"
      description="Embedded F&amp;I inside the deal desk — rate every appointed carrier from the DMS and bind before the customer leaves."
      logo={<BrandMark size={40} tone="mono" title="DriveOne Service" />}
      status="coming-soon"
      action={<Button variant="secondary" disabled>Join the waitlist</Button>}
    />
    <ProductCard
      name="DTC Powersports"
      audience="B2C · High-performance vehicles"
      description="Protection built for what a standard VSC excludes — side-by-sides, sleds, personal watercraft and track-day machines."
      logo={<BrandMark size={40} tone="mono" title="DTC Powersports" />}
      status="coming-soon"
      action={<Button variant="secondary" disabled>Join the waitlist</Button>}
    />
  </div>
);

export const ComingSoon = () => (
  <div style={{ maxWidth: 420 }}>
    <ProductCard
      name="DTC Powersports"
      audience="B2C · High-performance vehicles"
      description="Protection built for what a standard vehicle service contract excludes — side-by-sides, sleds, personal watercraft and track-day machines."
      logo={<BrandMark size={40} tone="mono" title="DTC Powersports" />}
      status="coming-soon"
      statusLabel="2026"
      action={<Button variant="secondary" disabled>Join the waitlist</Button>}
    />
  </div>
);
