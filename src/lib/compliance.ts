/**
 * Compliance copy for DriveOne Direct, sourced from the executed customer
 * contract (form `AAS VSC 1 11-2022`, (c) 2022 Ascent Administration Services,
 * LLC) rather than from any deck, flyer or workspace page.
 *
 * "Elevate" is the Ascent product brand that DriveOne Direct private labels. It
 * does not appear anywhere in the contract text, so it is a program name and
 * never a contract citation. The contract's own coverage tiers are SILVER,
 * GOLD and PLATINUM.
 *
 * Everything below is transcribed from the contract's DEFINITIONS, PROVISIONS
 * and STATE DISCLOSURES sections. Do not paraphrase.
 */

/** The administrator and obligor in every state except CA, FL and NY. */
export const ADMINISTRATOR = {
  name: 'Ascent Administration Services, LLC',
  address: '360 South Smith Road, Tempe, Arizona 85281',
  city: 'Tempe, AZ',
  phone: '866-660-7003',
} as const;

/**
 * The insurer standing behind the obligor.
 *
 * Contract VI(l): "Obligations of the Obligor under this Service Contract are
 * insured under a contractual liability insurance policy issued by Old Republic
 * Insurance Company." Old Republic insures the obligor's obligations. It is not
 * itself the obligor outside Florida.
 */
export const INSURER = {
  name: 'Old Republic Insurance Company',
  address: 'P.O. Box 35008, Tulsa, OK 74153-0008',
  phone: '(800) 331-3780',
} as const;

/** The selling brand, and the legal entity behind it. */
export const BRAND = {
  name: 'DriveOne Direct',
  entity: 'Insureify AI, Inc.',
  site: 'www.driveonedirect.com',
} as const;

export interface StateEntity {
  role: 'administrator-and-obligor' | 'administrator' | 'obligor';
  name: string;
  address: string;
  phone: string;
  license?: string;
}

/**
 * States where the contract names a different entity. Old Republic operates
 * these under separate names, so a state specific disclosure must use the right
 * one rather than defaulting to Ascent.
 */
export const STATE_ENTITIES: Record<string, StateEntity[]> = {
  CA: [
    {
      role: 'administrator-and-obligor',
      name: 'Old Republic Insured Automotive Services, Inc.',
      address: '8282 S Memorial Dr., Ste. 202, Tulsa, OK 74133',
      phone: '800-331-3780',
      license: '0C79822',
    },
  ],
  FL: [
    {
      role: 'administrator',
      name: 'Minnehoma Automobile Association, Inc.',
      address: 'P.O. Box 35008, Tulsa, OK 74153-0008',
      phone: '800-644-9680',
      license: '60033',
    },
    {
      role: 'obligor',
      name: 'Old Republic Insurance Company',
      address: 'P.O. Box 35008, Tulsa, OK 74153-0008',
      phone: '800-644-9680',
    },
  ],
  NY: [
    {
      role: 'administrator-and-obligor',
      name: 'ORIAS Warranty Services',
      address: '8282 S Memorial Dr., Ste. 202, Tulsa, OK 74133',
      phone: '800-331-3780',
    },
  ],
};

/**
 * The disclosure carried on every CTA bearing creative.
 *
 * "not insurance, a warranty, or a guarantee" is the contract's own front page
 * wording. Vista's block ended with "Producer license verification required to
 * sell." That line is agent recruitment language and has no place on a
 * direct to consumer ad, so it is gone.
 */
export const AD_DISCLOSURE =
  `${BRAND.name} is a brand of ${BRAND.entity} Vehicle service contracts are not insurance, a warranty, or a guarantee. ` +
  `Administrator and obligor: ${ADMINISTRATOR.name}, ${ADMINISTRATOR.city}; administrator and obligor vary by state. ` +
  `Obligations are insured under a contractual liability insurance policy issued by ${INSURER.name}. ` +
  'Coverage and eligibility subject to contract terms and exclusions. Available in all states except California.';

/**
 * The short in image line the Reels cuts carry instead of the full block,
 * because Reels covers the bottom third with its own chrome. A Reels cut must
 * never run with a truncated caption.
 */
export const REELS_SHORT_DISCLOSURE =
  'Vehicle service contracts are not insurance. Available in all states except California. Full terms in the caption.';

/**
 * The buyer's direct claim right, contract VI(l). Consumer facing, and unlike
 * Vista this audience is the consumer, so it belongs in the captions.
 */
export const DIRECT_CLAIM_NOTICE =
  `If the obligor fails to pay or provide service on a claim within sixty (60) days after proof of loss has been filed, you are entitled to make a claim directly against the insurer, ${INSURER.name}, ${INSURER.address}, ${INSURER.phone}.`;

export const TRUST_LINE = 'Insured by Old Republic';

/**
 * Claim specific qualifiers. Each must sit next to its claim on the creative,
 * never folded into the footer block.
 *
 * Every one of these is contract sourced. Claims that are NOT in the contract
 * (Diminished Value, Openbay, the Protection Plus bundle, the 0% payment plan)
 * are deliberately absent from this file and from the creative. See
 * docs/claims-audit.md.
 */
export const QUALIFIERS = {
  deductible:
    '$100 per covered claim visit. Subject to contract terms and exclusions.',
  repairCost:
    'RepairPal national average range, August 2026. Actual cost varies by vehicle, shop and location.',
  repairFacility:
    'Any licensed repair facility of your choosing in the U.S. Claims must be authorized before repairs begin.',
  roadside:
    'Up to 3 roadside or towing events per year through Quest Towing Services, LLC. Per event benefit limits apply.',
  rental:
    '$35 per 6 hours of labor time, $250 maximum per claim visit. Proof of rental required.',
  cancellation:
    'Full refund within 30 days if no claim has been made. Refund terms vary by state.',
  quote: 'Your VIN is required to see a price.',
  coverage:
    'Coverage varies by plan. Silver, Gold and Platinum tiers. See the contract for covered components and exclusions.',
} as const;

export type QualifierKey = keyof typeof QUALIFIERS;
