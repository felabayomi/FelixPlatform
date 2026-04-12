import { getCityProfileByName } from "@/data/cities";

type Deal = {
  title: string;
  subtitle: string;
  price: string;
  extras: string;
  perks: string[];
  cta: string;
  image: string;
};

function cityLabel(cityName: string): string {
  return getCityProfileByName(cityName)?.name ?? cityName;
}

function cityImage(cityName: string, fallbackImage: string): string {
  return getCityProfileByName(cityName)?.image ?? fallbackImage;
}

const deals: Deal[] = [
  {
    title: "❄️ Alaska Adventure",
    subtitle: "Anchorage + Scenic Wilderness Stay",
    price: "From $1,499 per person",
    extras: "Hotel Included",
    perks: ["Mountain views", "Wildlife experiences", "Unique escape"],
    cta: 'DM “ALASKA”',
    image:
      "https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "🏜️ Arizona Escape",
    subtitle: "Scottsdale Desert Resort Stay",
    price: "From $899 per person",
    extras: "Hotel Included",
    perks: ["Luxury desert vibes", "Spa + golf", "Warm weather"],
    cta: 'DM “ARIZONA”',
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "🌉 California Coast",
    subtitle: `${cityLabel("Los Angeles")} + Coastal Stay`,
    price: "From $1,199 per person",
    extras: "Hotel Included",
    perks: ["City + beach", "Great weather", "Iconic views"],
    cta: 'DM “CALIFORNIA”',
    image: cityImage(
      "Los Angeles",
      "https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=1200&q=80"
    ),
  },
  {
    title: "🌴 Cancun All-Inclusive Deal",
    subtitle: "5 Nights – Secrets Riviera Cancun",
    price: "From $1,999 per person",
    extras: "Flights + Transfers Included",
    perks: ["Adults Only", "Unlimited food & drinks", "Beachfront luxury"],
    cta: 'DM “CANCUN”',
    image:
      "https://images.unsplash.com/photo-1510097467424-192d713fd8b2?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: `🏙️ ${cityLabel("Chicago")} City Escape`,
    subtitle: `Downtown ${cityLabel("Chicago")} Hotel Stay`,
    price: "From $1,099 per person",
    extras: "Hotel Included",
    perks: ["City skyline", "Food scene", "Shopping + museums"],
    cta: 'DM “CHICAGO”',
    image: cityImage(
      "Chicago",
      "https://images.unsplash.com/photo-1494522855154-9297ac14b55f?auto=format&fit=crop&w=1200&q=80"
    ),
  },
  {
    title: "🏞️ Colorado Mountain Retreat",
    subtitle: "Aspen / Denver Stay",
    price: "From $1,099 per person",
    extras: "Hotel Included",
    perks: ["Mountain views", "Outdoor adventures", "Relaxing"],
    cta: 'DM “COLORADO”',
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "🌴 Florida Miami Escape",
    subtitle: `${cityLabel("Miami")} South Beach Stay`,
    price: "From $1,299 per person",
    extras: "Hotel Included",
    perks: ["Beach + nightlife", "Luxury hotels", "Weekend trips"],
    cta: 'DM “MIAMI”',
    image: cityImage(
      "Miami",
      "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?auto=format&fit=crop&w=1200&q=80"
    ),
  },
  {
    title: "🎢 Florida Orlando Getaway",
    subtitle: "Theme Park Vacation",
    price: "From $999 per person",
    extras: "Hotel Included",
    perks: ["Family friendly", "Theme parks", "Entertainment"],
    cta: 'DM “ORLANDO”',
    image:
      "https://images.unsplash.com/photo-1514214246283-d427a95c5d2f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "🍑 Georgia Getaway",
    subtitle: `${cityLabel("Atlanta")} Luxury Weekend`,
    price: "From $999 per person",
    extras: "Hotel Included",
    perks: ["City dining", "Weekend escape", "Culture + nightlife"],
    cta: 'DM “GEORGIA”',
    image: cityImage(
      "Atlanta",
      "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?auto=format&fit=crop&w=1200&q=80"
    ),
  },
  {
    title: "🌺 Hawaii Island Escape",
    subtitle: "Honolulu Beach Resort",
    price: "From $2,499 per person",
    extras: "Flights + Hotel Included",
    perks: ["Tropical paradise", "Beaches", "Luxury stay"],
    cta: 'DM “HAWAII”',
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: `🎰 ${cityLabel("Las Vegas")} Experience`,
    subtitle: "4 Nights - Vegas Strip Hotel",
    price: "From $899 per person",
    extras: "Hotel Included",
    perks: ["Nightlife", "Shows + casinos", "Luxury resorts"],
    cta: 'DM “VEGAS”',
    image: cityImage(
      "Las Vegas",
      "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=1200&q=80"
    ),
  },
  {
    title: "🎷 Louisiana Jazz Escape",
    subtitle: "New Orleans French Quarter Stay",
    price: "From $1,099 per person",
    extras: "Hotel Included",
    perks: ["Live music", "Food scene", "Historic charm"],
    cta: 'DM “LOUISIANA”',
    image:
      "https://images.unsplash.com/photo-1514890547357-a9ee288728e0?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "🦞 Massachusetts Coastal Escape",
    subtitle: `${cityLabel("Boston")} + Waterfront Stay`,
    price: "From $1,199 per person",
    extras: "Hotel Included",
    perks: ["Historic city", "Coastal charm", "Great dining"],
    cta: 'DM “MASSACHUSETTS”',
    image: cityImage(
      "Boston",
      "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=1200&q=80"
    ),
  },
  {
    title: `🗽 ${cityLabel("New York City")} Break`,
    subtitle: "Manhattan Hotel Stay",
    price: "From $1,299 per person",
    extras: "Hotel Included",
    perks: ["City attractions", "Shopping", "Food scene"],
    cta: 'DM “NYC”',
    image: cityImage(
      "New York City",
      "https://images.unsplash.com/photo-1490578474895-699cd4e2cf59?auto=format&fit=crop&w=1200&q=80"
    ),
  },
  {
    title: "🏖️ South Carolina Beach Trip",
    subtitle: "Myrtle Beach Stay",
    price: "From $899 per person",
    extras: "Hotel Included",
    perks: ["Affordable beach", "Family friendly", "Relaxing"],
    cta: 'DM “MYRTLE BEACH”',
    image:
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "🎸 Tennessee Music City",
    subtitle: `${cityLabel("Nashville")} Weekend Stay`,
    price: "From $999 per person",
    extras: "Hotel Included",
    perks: ["Live music", "Nightlife", "Southern food"],
    cta: 'DM “TENNESSEE”',
    image: cityImage(
      "Nashville",
      "https://images.unsplash.com/photo-1510797215324-95aa89f43c33?auto=format&fit=crop&w=1200&q=80"
    ),
  },
  {
    title: "🤠 Texas City Adventure",
    subtitle: `Dallas / ${cityLabel("Austin")} Hotel Stay`,
    price: "From $1,099 per person",
    extras: "Hotel Included",
    perks: ["Big city energy", "Food + music", "Weekend fun"],
    cta: 'DM “TEXAS”',
    image: cityImage(
      "Austin",
      "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=1200&q=80"
    ),
  },
  {
    title: "🌲 Washington Northwest Escape",
    subtitle: `${cityLabel("Seattle")} City + Nature Stay`,
    price: "From $1,199 per person",
    extras: "Hotel Included",
    perks: ["Waterfront city", "Coffee + culture", "Mountain views"],
    cta: 'DM “WASHINGTON”',
    image: cityImage(
      "Seattle",
      "https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=1200&q=80"
    ),
  },
];

function runTests() {
  if (deals.length !== 18) {
    throw new Error(`Expected 18 deals, got ${deals.length}`);
  }

  const originalTitles = [
    "🌴 Cancun All-Inclusive Deal",
    "🏜️ Arizona Escape",
    "🌉 California Coast",
    "🏞️ Colorado Mountain Retreat",
    "🌴 Florida Miami Escape",
    "🎢 Florida Orlando Getaway",
    "🌺 Hawaii Island Escape",
    "🎰 Las Vegas Experience",
    "🗽 New York City Break",
    "🏖️ South Carolina Beach Trip",
  ];

  for (const title of originalTitles) {
    if (!deals.some((deal) => deal.title === title)) {
      throw new Error(`Original deal missing: ${title}`);
    }
  }

  const expectedOrderedTitles = [
    "❄️ Alaska Adventure",
    "🏜️ Arizona Escape",
    "🌉 California Coast",
    "🌴 Cancun All-Inclusive Deal",
    "🏙️ Chicago City Escape",
    "🏞️ Colorado Mountain Retreat",
    "🌴 Florida Miami Escape",
    "🎢 Florida Orlando Getaway",
    "🍑 Georgia Getaway",
    "🌺 Hawaii Island Escape",
    "🎰 Las Vegas Experience",
    "🎷 Louisiana Jazz Escape",
    "🦞 Massachusetts Coastal Escape",
    "🗽 New York City Break",
    "🏖️ South Carolina Beach Trip",
    "🎸 Tennessee Music City",
    "🤠 Texas City Adventure",
    "🌲 Washington Northwest Escape",
  ];

  const actualTitles = deals.map((deal) => deal.title);
  if (JSON.stringify(actualTitles) !== JSON.stringify(expectedOrderedTitles)) {
    throw new Error("Deals are not in the expected alphabetical arrangement.");
  }

  const uniqueTitles = new Set(actualTitles);
  if (uniqueTitles.size !== deals.length) {
    throw new Error("Deal titles must be unique.");
  }

  for (const deal of deals) {
    if (!deal.title || !deal.subtitle || !deal.price || !deal.extras || !deal.cta || !deal.image) {
      throw new Error(`Deal is missing required content: ${deal.title || "Untitled deal"}`);
    }
    if (!Array.isArray(deal.perks) || deal.perks.length === 0) {
      throw new Error(`Deal must include at least one perk: ${deal.title}`);
    }
  }
}

runTests();

export default function TravelDealsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-gradient-to-br from-cyan-600 via-sky-600 to-emerald-500 py-20 text-white">
        <div className="mx-auto max-w-6xl px-6 text-center">
          <h1 className="text-4xl font-black md:text-6xl">
            Travel Deals You Can Book Today 🌍✈️
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-lg text-white/90 md:text-xl">
            Explore top vacation deals including all-inclusive resorts, beach getaways,
            and U.S. travel experiences. Message us to lock in your trip.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
          {deals.map((deal) => (
            <div
              key={deal.title}
              className="overflow-hidden rounded-[28px] bg-white shadow-xl"
            >
              <div
                className="h-64 bg-cover bg-center"
                style={{ backgroundImage: `url('${deal.image}')` }}
              />
              <div className="p-6">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-600">
                  {deal.extras}
                </p>
                <h3 className="mt-2 text-2xl font-black">{deal.title}</h3>
                <p className="mt-2 text-slate-600">{deal.subtitle}</p>

                <div className="mt-4 rounded-xl bg-emerald-50 p-4">
                  <p className="text-sm">Starting at</p>
                  <p className="text-2xl font-black">{deal.price}</p>
                </div>

                <div className="mt-4 space-y-2">
                  {deal.perks.map((perk) => (
                    <div key={perk} className="flex items-center gap-2">
                      <span className="font-bold text-emerald-500">✓</span>
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-6 rounded-xl bg-sky-600 py-3 text-center font-bold text-white">
                  {deal.cta}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-slate-900 py-12 text-center text-white">
        <h2 className="text-2xl font-bold">Travel Center Hub</h2>
        <p className="mt-3 text-white/80">
          Helping you book the best vacations worldwide 🌴
        </p>
        <p className="mt-4 font-semibold">support@travelcenterhub.com</p>
      </footer>
    </div>
  );
}
