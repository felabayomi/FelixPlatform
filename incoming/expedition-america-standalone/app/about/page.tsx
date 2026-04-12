type ProductLink = {
  title: string;
  description: string;
  href: string;
};

const productLinks: ProductLink[] = [
  {
    title: "City Discoverer Companion",
    description: "Discover neighborhoods, local highlights, and city essentials.",
    href: "https://discoverer.city",
  },
  {
    title: "City Discoverer Itinerary Builder",
    description: "Plan and organize your trip with AI-powered itinerary support.",
    href: "https://plan.citydiscoverer.ai",
  },
  {
    title: "Live Agent Portal",
    description: "Book a consultation with a live travel specialist.",
    href: "https://citydiscoverer.guide/book",
  },
  {
    title: "Travel Center Hub",
    description: "Search and book flights, hotels, and travel deals all in one place.",
    href: "https://travelcenterhub.com",
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-12 text-slate-900">
      <section className="mx-auto max-w-5xl rounded-3xl border border-slate-200 bg-white p-8 shadow-lg md:p-10">
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">About</p>
        <h1 className="mt-3 text-3xl font-black md:text-5xl">Expedition America</h1>
        <p className="mt-4 max-w-3xl text-slate-600 md:text-lg">
          We help travelers discover U.S. cities with better local insight, smarter planning,
          and direct support when they need it.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 md:grid-cols-4">
          {productLinks.map((product) => (
            <a
              key={product.title}
              href={product.href}
              target="_blank"
              rel="noreferrer"
              className="group rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300 hover:bg-white"
            >
              <h2 className="text-lg font-bold text-slate-900">{product.title}</h2>
              <p className="mt-2 text-sm text-slate-600">{product.description}</p>
              <span className="mt-4 inline-block text-sm font-semibold text-cyan-700 group-hover:text-cyan-800">
                Visit Product
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}
