/**
 * The concept list and its copy.
 *
 * Rules this file is written to, and which the tests pin:
 *
 * 1. Every claim traces to the executed contract (`AAS VSC 1 11-2022`) or to a
 *    dated RepairPal figure. Claims that could not be traced are absent, not
 *    softened. See docs/claims-audit.md.
 * 2. State the category truth, never narrate the viewer's life. Meta's Personal
 *    Attributes policy disapproved C1B on 19 Aug 2026 for exactly that, and the
 *    same photograph passed on C12 with a general framing.
 * 3. No payment plan, 0% or credit language anywhere. Ryan's call: Meta's Credit
 *    special ad category would restrict targeting and the claim is not worth it
 *    on prospecting.
 * 4. Never call the product a warranty. "Warranty" refers only to the factory
 *    warranty the buyer no longer has.
 * 5. One idea per ad. Offer facts rotate so no two frames carry the same three.
 * 6. No em dashes or en dashes.
 */
import type { HeroKey } from './art.ts';
import type { QualifierKey } from '../lib/compliance.ts';

export interface FeatureRow {
  title: string;
  sub: string;
}

export interface Concept {
  /** Stable key, used for the caption map and the frame ids. */
  key: string;
  /** Short internal name for the gallery label. */
  name: string;
  eyebrow: string;
  /** Headline, split so exactly one phrase carries the cyan accent. */
  headlineLead: string;
  headlineAccent: string;
  support: string;
  rows: [FeatureRow, FeatureRow, FeatureRow];
  strip: string;
  qualifiers: QualifierKey[];
  hero: HeroKey;
  cta: string;
}

export const CONCEPTS: Concept[] = [
  {
    key: 'coverage-gap',
    name: 'Coverage gap',
    eyebrow: 'AFTER THE FACTORY WARRANTY',
    headlineLead: 'The warranty ended.\n',
    headlineAccent: 'The car did not.',
    support:
      'A vehicle service contract picks up mechanical breakdowns after the manufacturer stops taking the call.',
    rows: [
      { title: 'Comprehensive coverage', sub: 'Silver, Gold and Platinum tiers on one contract.' },
      { title: '$100 deductible', sub: 'Per covered claim visit, not per part.' },
      { title: 'Insured by Old Republic', sub: 'Obligations backed by a contractual liability policy.' },
    ],
    strip: 'Three clicks from your VIN to a price at www.driveonedirect.com',
    qualifiers: ['coverage', 'deductible'],
    hero: 'gauge',
    cta: 'Get your quote',
  },
  {
    key: 'transmission',
    name: 'Repair economics, transmission',
    eyebrow: 'REPLACEMENT TRANSMISSION',
    headlineLead: 'Your negotiating skills\n',
    headlineAccent: 'do not apply to transmissions.',
    support:
      '$6,165 to $6,685. The gearbox has not been informed of what you paid for the car.',
    rows: [
      { title: 'Covered on every tier', sub: 'Transmission case and all internal parts.' },
      { title: 'Rental while it is in', sub: '$35 per 6 hours of labor time, $250 per visit.' },
      { title: '$100 deductible', sub: 'Per covered claim visit, not per part.' },
    ],
    strip: 'RepairPal national average, August 2026',
    qualifiers: ['repairCost', 'rental', 'deductible'],
    hero: 'gears',
    cta: 'Get your quote',
  },
  {
    key: 'no-call',
    name: 'Nobody is going to call you',
    eyebrow: 'HOW THIS ACTUALLY WORKS',
    headlineLead: 'Nobody is going to\n',
    headlineAccent: 'call you.',
    support:
      'Quote, pick a plan, check out. That is not an oversight in the process. That is the product.',
    rows: [
      { title: '100% online', sub: 'Three clicks from your VIN to a price.' },
      { title: 'No phone queue', sub: 'Nothing to schedule and nobody to call back.' },
      { title: 'Thirty days to cancel', sub: 'Full refund if no claim has been made.' },
    ],
    strip: 'Your VIN is required to see a price.',
    qualifiers: ['quote', 'cancellation'],
    hero: 'phone',
    cta: 'Get your quote',
  },
  {
    key: 'water-pump',
    name: 'Nobody budgets for a water pump',
    eyebrow: 'MECHANICAL BREAKDOWN',
    headlineLead: 'Nobody budgets for\n',
    headlineAccent: 'a water pump.',
    support:
      'Cooling system parts fail on a schedule of their own. The contract already has a number for your share of it.',
    rows: [
      { title: 'Cooling system covered', sub: 'Water pump and housing, thermostat, radiator, heater core.' },
      { title: '$100 deductible', sub: 'Per covered claim visit, whatever the invoice says.' },
      { title: 'Roadside included', sub: 'Up to three events a year, every tier.' },
    ],
    strip: 'Silver, Gold and Platinum. The same $100 deductible.',
    qualifiers: ['deductible', 'roadside'],
    hero: 'impeller',
    cta: 'Get your quote',
  },
  {
    key: 'pick-the-shop',
    name: 'Pick the shop',
    eyebrow: 'CLAIMS',
    headlineLead: 'Pick the shop.\n',
    headlineAccent: 'We handle the invoice.',
    support:
      'Any licensed repair facility in the United States. Your shop calls to open the claim before the work starts, and we settle it with them.',
    rows: [
      { title: 'Your choice of shop', sub: 'Any licensed repair facility in the U.S.' },
      { title: 'Authorized before work', sub: 'One call from the shop opens the claim.' },
      { title: 'Labor at the posted rate', sub: 'Up to $150 per hour on covered repairs.' },
    ],
    strip: 'Claims line 866-660-7003',
    qualifiers: ['repairFacility'],
    hero: 'socket',
    cta: 'Get your quote',
  },
  {
    key: 'roadside',
    name: 'Roadside',
    eyebrow: '24/7 ROADSIDE AND TOWING',
    headlineLead: 'Roadside is\n',
    headlineAccent: 'not an upsell.',
    support:
      'Towing, jump start, flat tire and lockout through Quest Towing Services, across the United States and Canada.',
    rows: [
      { title: 'Up to 3 events a year', sub: 'Included on every coverage tier.' },
      { title: 'Towing to a repair facility', sub: 'Up to $100 per occurrence.' },
      { title: 'Flat tire and lockout', sub: 'Up to $50 per occurrence.' },
    ],
    strip: 'Roadside line 877-626-0880',
    qualifiers: ['roadside'],
    hero: 'towHook',
    cta: 'Get your quote',
  },
  {
    key: 'thirty-days',
    name: 'Thirty days',
    eyebrow: 'CONTRACT SECTION IX',
    headlineLead: 'Thirty days to\n',
    headlineAccent: 'change your mind.',
    support:
      'Cancel inside thirty days with no claim made and the full contract price comes back. That is in the contract, not in a promotion.',
    rows: [
      { title: 'Full refund at 30 days', sub: 'If no claim has been made.' },
      { title: 'Pro rata after that', sub: 'Based on elapsed months or miles.' },
      { title: 'Follows the vehicle', sub: 'Transferable to a valid transferee.' },
    ],
    strip: 'Refund terms vary by state.',
    qualifiers: ['cancellation'],
    hero: 'calendar',
    cta: 'Get your quote',
  },
];

export type Direction = 'ink' | 'daylight';
export type Format = 'feed' | 'square' | 'story' | 'reel';

export interface Frame {
  id: string;
  concept: Concept;
  direction: Direction;
  format: Format;
  width: number;
  height: number;
}

const SIZE: Record<Format, [number, number]> = {
  feed: [1080, 1350],
  square: [1080, 1080],
  story: [1080, 1920],
  reel: [1080, 1920],
};

function frame(id: string, concept: Concept, direction: Direction, format: Format): Frame {
  const [width, height] = SIZE[format];
  return { id, concept, direction, format, width, height };
}

/** Which concepts get cut into the non-feed placements. */
const SQUARE_PICKS = ['coverage-gap', 'transmission', 'no-call'];
const STORY_PICKS = ['coverage-gap', 'water-pump', 'thirty-days'];
const REEL_PICKS = ['no-call', 'pick-the-shop', 'roadside'];

const byKey = (key: string): Concept => {
  const found = CONCEPTS.find((c) => c.key === key);
  if (!found) throw new Error(`unknown concept ${key}`);
  return found;
};

/**
 * Frame ids follow the Vista scheme so `{{ad.name}}` attribution and the
 * exporter's label regex both work unchanged: a single letter and a single
 * digit.
 *
 * A1 to A7  feed, direction A (Ink)
 * B1 to B7  feed, direction B (Daylight)
 * S1 to S3  1080x1080
 * R1 to R3  Stories
 * V1 to V3  Reels
 */
export const FRAMES: Frame[] = [
  ...CONCEPTS.map((c, i) => frame(`A${i + 1}`, c, 'ink', 'feed')),
  ...CONCEPTS.map((c, i) => frame(`B${i + 1}`, c, 'daylight', 'feed')),
  ...SQUARE_PICKS.map((k, i) => frame(`S${i + 1}`, byKey(k), i === 1 ? 'daylight' : 'ink', 'square')),
  ...STORY_PICKS.map((k, i) => frame(`R${i + 1}`, byKey(k), i === 1 ? 'daylight' : 'ink', 'story')),
  ...REEL_PICKS.map((k, i) => frame(`V${i + 1}`, byKey(k), i === 1 ? 'daylight' : 'ink', 'reel')),
];

/** Reels supply their own CTA chrome, so those frames carry none. */
export const carriesCta = (f: Frame): boolean => f.format !== 'reel';
