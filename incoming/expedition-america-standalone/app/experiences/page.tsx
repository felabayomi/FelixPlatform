import { cityProfiles, getCityProfileByName } from "@/data/cities";

type SearchParams = {
  city?: string | string[];
};

export default function ExperiencesPage({
  searchParams,
}: {
  searchParams?: SearchParams;
}) {
  const requestedCity =
    typeof searchParams?.city === "string" ? decodeURIComponent(searchParams.city).trim() : "";

  const requestedCityLower = requestedCity.toLowerCase();
  const selectedExperience = requestedCity
    ? getCityProfileByName(requestedCity)
    : undefined;
  const quickMatches = requestedCity
    ? cityProfiles.filter((entry) =>
        entry.name.toLowerCase().includes(requestedCityLower)
      )
    : [];

  const listToRender = selectedExperience
    ? [selectedExperience]
    : requestedCity
      ? []
      : cityProfiles;

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#ecfeff_0%,_#f8fafc_35%,_#ffffff_100%)] pb-20 text-slate-900">
      <section className="mx-auto max-w-7xl px-6 pt-14">
        <div className="rounded-3xl border border-cyan-200 bg-white/90 p-8 shadow-xl backdrop-blur md:p-12">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-cyan-700">
            Curated Experiences
          </p>
          <h1 className="mt-3 text-4xl font-black md:text-6xl">
            {selectedExperience
              ? `${selectedExperience.name} Experience Guide`
              : "Choose A City Experience"}
          </h1>
          <p className="mt-5 max-w-3xl text-base text-slate-700 md:text-lg">
            {selectedExperience
              ? `You are viewing matched experiences for ${selectedExperience.name}, ${selectedExperience.region}.`
              : "Explore destination-specific recommendations designed for weekend escapes, longer vacations, and first-time city visits."}
          </p>

          <form action="/experiences" method="get" className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <input
              name="city"
              defaultValue={requestedCity}
              list="cities-list"
              placeholder="Search city name"
              className="w-full max-w-md rounded-xl border border-slate-300 bg-white px-4 py-2 text-slate-900 outline-none ring-cyan-300 placeholder:text-slate-400 focus:ring"
            />
            <datalist id="cities-list">
              {cityProfiles.map((city) => (
                <option key={city.name} value={city.name} />
              ))}
            </datalist>
            <button
              type="submit"
              className="inline-flex rounded-xl bg-cyan-600 px-4 py-2 font-semibold text-white transition hover:bg-cyan-500"
            >
              Find city
            </button>
            <a
              href="/experiences"
              className="inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2 font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Reset
            </a>
          </form>

          {selectedExperience ? (
            <a
              href="/experiences"
              className="mt-6 inline-flex rounded-xl bg-slate-900 px-4 py-2 font-semibold text-white transition hover:bg-slate-700"
            >
              View all city experiences
            </a>
          ) : null}

          {requestedCity && !selectedExperience ? (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              No exact match for "{requestedCity}". Try one of these:
              <div className="mt-2 flex flex-wrap gap-2">
                {(quickMatches.length > 0 ? quickMatches : cityProfiles.slice(0, 6)).map((city) => (
                  <a
                    key={city.name}
                    href={`/experiences?city=${encodeURIComponent(city.name)}`}
                    className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-300 transition hover:bg-slate-100"
                  >
                    {city.name}
                  </a>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto mt-10 max-w-7xl px-6">
        <div className="grid gap-7 sm:grid-cols-2 xl:grid-cols-3">
          {listToRender.map((item) => (
            <article
              key={item.name}
              className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={item.image}
                  alt={`${item.name}, ${item.region}`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
                <p className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-900">
                  {item.region}
                </p>
              </div>

              <div className="p-6">
                <h2 className="text-2xl font-extrabold">{item.name}</h2>
                <p className="mt-2 text-slate-600">{item.experience.signature}</p>

                <div className="mt-4 rounded-xl bg-cyan-50 p-4 text-sm text-slate-700">
                  <p>
                    <span className="font-semibold">Best for:</span> {item.experience.bestFor}
                  </p>
                  <p className="mt-1">
                    <span className="font-semibold">Best time:</span> {item.experience.whenToGo}
                  </p>
                </div>

                <ul className="mt-4 space-y-2 text-sm text-slate-700">
                  {item.experience.picks.map((pick) => (
                    <li key={pick} className="flex items-center gap-2">
                      <span className="text-cyan-600">●</span>
                      <span>{pick}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}