import { getStorefrontContent } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ServicesPage() {
    const content = await getStorefrontContent();

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">{content.servicesEyebrow}</p>
                <h1 className="text-3xl font-semibold text-stone-900 sm:text-4xl">{content.servicesTitle}</h1>
                <p className="max-w-2xl text-stone-600">
                    {content.servicesText}
                </p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {content.services.map((service) => (
                    <article key={service.id} className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
                        <h2 className="text-xl font-semibold text-stone-900">{service.title}</h2>
                        <p className="mt-3 text-sm leading-6 text-stone-600">{service.text}</p>
                    </article>
                ))}
            </div>
        </div>
    );
}
