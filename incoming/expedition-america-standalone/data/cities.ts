export type CityProfile = {
  name: string;
  region: string;
  vibe: string;
  highlights: string[];
  image: string;
  actionLinks?: Partial<{
    itinerary: string;
    flightQuote: string;
    deal: string;
    request: string;
  }>;
  experience: {
    signature: string;
    bestFor: string;
    whenToGo: string;
    picks: string[];
  };
};

export const cityProfiles: CityProfile[] = [
  {
    name: "New York City",
    region: "New York",
    vibe: "Skyline energy, iconic neighborhoods, all-day culture.",
    highlights: ["Broadway + museums", "Rooftop views", "Global food"],
    image:
      "https://mediahost.app/api/media/serve/9e299a0c06586017049de94298aca9c8?w=1200&h=800&fit=fill&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773847428891-url3s5xui",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773850469105-d1wnoah2w",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773860118991-xyrorarej",
      request: "/nyc-group-tour",
    },
    experience: {
      signature: "A nonstop city rhythm with skyline views and neighborhood personality.",
      bestFor: "Culture lovers, first-time U.S. visitors, city weekends",
      whenToGo: "April-June or September-November",
      picks: ["Broadway night", "Chelsea + High Line walk", "Brooklyn food crawl"],
    },
  },
  {
    name: "Chicago",
    region: "Illinois",
    vibe: "Lakefront architecture, neighborhoods, and legendary music.",
    highlights: ["Riverwalk", "Art + architecture", "Deep-dish and beyond"],
    image:
      "https://mediahost.app/api/media/serve/724f5fd545aa4192d0a7daeb6702cd4b?w=1200&h=800&fit=fill&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773847567905-40a4r9uvy",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773851461442-j5jfnqm6p",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773870465950-q90omoi9i",
      request: "/chicago-group-tour",
    },
    experience: {
      signature: "Lakefront architecture, neighborhoods, and legendary music.",
      bestFor: "Foodies, architecture buffs, music lovers",
      whenToGo: "May-September",
      picks: ["Riverwalk stroll", "Art Institute visit", "Deep-dish pizza night"],
    },
  },
  {
    name: "Miami",
    region: "Florida",
    vibe: "Coastal sunshine, creative districts, and iconic views.",
    highlights: ["Beach + city balance", "Studios + design", "Food neighborhoods"],
    image:
      "https://mediahost.app/api/media/serve/2c9188045dd02cf3e6ee1f82a13d430d?w=1200&h=800&fit=fill&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773847891058-08ot5fxxu",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773851948565-uknwquatf",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773871449104-kq4qgyc5b",
      request: "/miami-group-tour",
    },
    experience: {
      signature: "Coastal sunshine, creative districts, and iconic views.",
      bestFor: "Beach lovers, nightlife seekers, art fans",
      whenToGo: "November-April",
      picks: ["South Beach day", "Wynwood Walls", "Little Havana food tour"],
    },
  },
  {
    name: "Los Angeles",
    region: "California",
    vibe: "Coastal sunshine, creative districts, and iconic views.",
    highlights: ["Beach + city balance", "Studios + design", "Food neighborhoods"],
    image:
      "https://mediahost.app/api/media/serve/ec2141f74c0deb143ae805870ed8b76a?w=1200&h=800&fit=fill&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773848101804-brv7ow16m",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773852333960-8j64e6rr1",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773872650010-x1839uf5j",
      request: "/los-angeles-group-tour",
    },
    experience: {
      signature: "Creative districts, golden-hour coastlines, and iconic city scenes.",
      bestFor: "Creative travelers, road trips, mixed city + beach stays",
      whenToGo: "March-May or September-November",
      picks: ["Santa Monica coastline", "Arts District afternoon", "Hollywood view points"],
    },
  },
  {
    name: "Austin",
    region: "Texas",
    vibe: "Live music capital with creative local flavor.",
    highlights: ["Music venues", "Tacos + coffee", "Outdoor trails"],
    image:
      "https://mediahost.app/api/media/serve/88c385abd6bb06057665592faf9040c0?w=1200&h=800&fit=fill&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773848342430-1ual35twv",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773852674820-99kusm699",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773873010820-67adp7d8k",
      request: "/austin-group-tour",
    },
    experience: {
      signature: "Music-heavy nightlife and laid-back daytime adventures.",
      bestFor: "Friend trips, music fans, casual city breaks",
      whenToGo: "March-May or October-November",
      picks: ["Live music crawl", "Lady Bird Lake trail", "Food truck tasting"],
    },
  },
  {
    name: "Nashville",
    region: "Tennessee",
    vibe: "Music-first city break with Southern character.",
    highlights: ["Honky-tonks", "Historic districts", "Chef-driven spots"],
    image:
      "https://mediahost.app/api/media/serve/bc393f73bf155047848fb16a6b1505eb?w=1200&h=800&fit=fill&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773848509644-h8labmno1",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773853309098-dvgrlk5pd",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773873129516-6fetk6lh6",
      request: "/nashville-group-tour",
    },
    experience: {
      signature: "Music City moments with deep Southern food and nightlife.",
      bestFor: "Weekend groups, live-music travelers, bachelor/bachelorette trips",
      whenToGo: "April-June or September-November",
      picks: ["Broadway honky-tonks", "12 South brunch", "Country music history"],
    },
  },
  {
    name: "Cumberland",
    region: "Maryland",
    vibe: "Small-city mountain charm and historic downtown walks.",
    highlights: ["Scenic railways", "Main street shops", "Trail access"],
    image:
      "https://mediahost.app/api/media/serve/b8d6aefbb772dcb526e4524418064f58?w=1200&h=800&fit=fill&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773848667076-u5o5vh4uy",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773853775045-eyt8uxw2c",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773873366229-cuh7j4my2",
      request: "/cumberland-group-tour",
    },
    experience: {
      signature: "Historic charm and scenic mountain pace for a relaxed reset.",
      bestFor: "Quiet getaways, road trippers, history lovers",
      whenToGo: "May-October",
      picks: ["Historic downtown stroll", "Scenic railway", "Trail-side cafes"],
    },
  },
  {
    name: "Morgantown",
    region: "West Virginia",
    vibe: "River views, college-town energy, and local events.",
    highlights: ["Waterfront strolls", "Game day atmosphere", "Casual eats"],
    image:
      "https://mediahost.app/api/media/serve/f6a3fcbb68bd45ce352c8df5974c8f7a?w=1200&h=800&fit=fill&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773848810280-44nk541vj",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773854986165-s1y9w6idb",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773873494833-c1nmvo0lk",
      request: "/morgantown-group-tour",
    },
    experience: {
      signature: "Riverfront scenery with college-town life and local events.",
      bestFor: "Game-day travel, relaxed weekends, scenic drives",
      whenToGo: "April-October",
      picks: ["Waterfront walk", "Local breweries", "Campus district nightlife"],
    },
  },
  {
    name: "Seattle",
    region: "Washington",
    vibe: "Waterfront city life with mountain backdrops.",
    highlights: ["Coffee culture", "Market districts", "Nature day trips"],
    image:
      "https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=1200&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773848994984-urlg4b5kk",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773855500362-j81nmu16a",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773873587338-b260s64v6",
      request: "/seattle-group-tour",
    },
    experience: {
      signature: "Waterfront city breaks powered by coffee and mountain views.",
      bestFor: "Nature-meets-city travelers, couples, food + coffee enthusiasts",
      whenToGo: "June-September",
      picks: ["Pike Place morning", "Ferry rides", "Neighborhood coffee crawl"],
    },
  },
  {
    name: "Boston",
    region: "Massachusetts",
    vibe: "Historic streets, harbor views, and modern dining.",
    highlights: ["Freedom Trail", "Waterfront neighborhoods", "Classic seafood"],
    image:
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773849339240-d4dai08jw",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773858231065-fpymvpdwk",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773873674303-757c0t40o",
      request: "/boston-group-tour",
    },
    experience: {
      signature: "Historic routes and coastal neighborhoods with modern dining.",
      bestFor: "History lovers, fall trips, cultural city weekends",
      whenToGo: "May-June or September-October",
      picks: ["Freedom Trail route", "North End dinner", "Harbor sunset walk"],
    },
  },
  {
    name: "Atlanta",
    region: "Georgia",
    vibe: "Bold culture, nightlife, and city-weekend comfort.",
    highlights: ["Food halls", "Arts districts", "Nightlife"],
    image:
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773849504453-whxl03fl2",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773859522097-9yee14aem",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773873769805-42dhrqg1y",
      request: "/atlanta-group-tour",
    },
    experience: {
      signature: "A bold city blend of food, arts, and weekend nightlife.",
      bestFor: "Weekend escapes, nightlife, culinary trips",
      whenToGo: "March-May or September-November",
      picks: ["BeltLine exploration", "Food hall hopping", "Midtown nightlife"],
    },
  },
  {
    name: "Las Vegas",
    region: "Nevada",
    vibe: "Entertainment capital with nonstop experiences.",
    highlights: ["Shows", "Resort dining", "Weekend escapes"],
    image:
      "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80",
    actionLinks: {
      itinerary: "https://timeline.citydiscoverer.guide/itinerary/itinerary-1773849684640-es9u7pz4z",
      flightQuote: "https://timeline.citydiscoverer.guide/flight-quote/flight-quote-1773859699825-g6m6tyfdr",
      deal: "https://timeline.citydiscoverer.guide/deal/travel-deal-1773874098151-6w6p20hr9",
      request: "/las-vegas-group-tour",
    },
    experience: {
      signature: "Entertainment-first experiences with resort luxury and late nights.",
      bestFor: "Celebration trips, nightlife, premium resort stays",
      whenToGo: "March-May or October-November",
      picks: ["Strip night tour", "Show + dinner", "Resort day pool scene"],
    },
  },
];

export function getCityProfileByName(name: string): CityProfile | undefined {
  return cityProfiles.find((city) => city.name.toLowerCase() === name.toLowerCase());
}
