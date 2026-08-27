/**
 * The ad destination and its attribution scheme.
 *
 * Every CTA bearing frame points at the same place with its own `utm_content`.
 * The per frame URL baked into the canvas is for the design record and for the
 * monthly link check. In Ads Manager the value is NOT hand entered 20 times:
 * `utm_content={{ad.name}}` goes in the URL parameters field once at the ad set
 * level and Meta substitutes each ad's name, which is why frame ids are short
 * and free of spaces and punctuation.
 *
 * Meta reports clicks per ad natively, so none of this is needed to rank
 * creative on clicks. What Meta cannot tell you is which creative produced a
 * sale once the pixel misses an iOS opt out or a cross device journey.
 * `utm_content` arriving at the quote flow is what answers that.
 */

export const DESTINATION = 'https://www.driveonedirect.com';

/**
 * Matches the live prospecting campaign's existing tags so reporting does not
 * fork into two sources. The live set uses `facebook`, not Vista's `meta`.
 * If these creatives launch under a new campaign, change this one constant and
 * re-run `npm run canvas:build`.
 */
export const UTM = {
  source: 'facebook',
  medium: 'paid_social',
  campaign: 'dod-tof-q3-2026',
} as const;

/** The value that goes in Ads Manager once, at ad set level. */
export const URL_TAGS_TEMPLATE =
  `utm_source=${UTM.source}&utm_medium=${UTM.medium}&utm_campaign=${UTM.campaign}&utm_content={{ad.name}}&utm_term={{adset.name}}`;

export function frameUrl(frameId: string): string {
  return `${DESTINATION}?utm_source=${UTM.source}&utm_medium=${UTM.medium}&utm_campaign=${UTM.campaign}&utm_content=${frameId}`;
}
