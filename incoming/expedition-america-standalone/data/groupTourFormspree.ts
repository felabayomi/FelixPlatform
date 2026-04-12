export const GROUP_TOUR_FORMSPREE_ENDPOINTS = {
  atlanta: "https://formspree.io/f/xjgalelo",
  austin: "https://formspree.io/f/mvzwlqqv",
  boston: "https://formspree.io/f/xzdjoaal",
  chicago: "https://formspree.io/f/mwvradvy",
  cumberland: "https://formspree.io/f/xojkrloe",
  lasVegas: "https://formspree.io/f/mwvrynjv",
  losAngeles: "https://formspree.io/f/mojkrlew",
  miami: "https://formspree.io/f/xreyjzkg",
  morgantown: "https://formspree.io/f/mreyjaba",
  nashville: "https://formspree.io/f/xnjgwzww",
  nyc: "https://formspree.io/f/mzdjyqkj",
  seattle: "https://formspree.io/f/xnjgwbdb",
} as const;

export type GroupTourCityKey = keyof typeof GROUP_TOUR_FORMSPREE_ENDPOINTS;

export function getGroupTourFormspreeEndpoint(city: GroupTourCityKey): string {
  return GROUP_TOUR_FORMSPREE_ENDPOINTS[city];
}