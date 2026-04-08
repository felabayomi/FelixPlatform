import Link from "next/link";
import ProductCard from "@/components/ProductCard";
import { getProducts, getStorefrontContent } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featuredProducts, content] = await Promise.all([
    getProducts(true),
    getStorefrontContent(),
  ]);

  const heroImages = [content.heroImageOne, content.heroImageTwo].filter(Boolean);

  return (
    <div className="flex flex-1 flex-col">
      <section className="border-b border-stone-200 bg-[linear-gradient(135deg,#fef3c7_0%,#ecfdf5_52%,#fdf2f8_100%)]">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:py-18">
          <div className="flex flex-col justify-center">
            <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-700">{content.heroEyebrow}</p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-stone-900 sm:text-5xl">
              {content.heroTitle}
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-stone-700 sm:text-lg">
              {content.heroText}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={content.heroPrimaryLink} className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white shadow-sm">
                {content.heroPrimaryLabel}
              </Link>
              <Link href={content.heroSecondaryLink} className="rounded-full border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-900">
                {content.heroSecondaryLabel}
              </Link>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {heroImages.map((image, index) => (
              <img
                key={`${image}-${index}`}
                src={image}
                alt={`Adrian Store feature image ${index + 1}`}
                className="h-full w-full rounded-[1.75rem] object-cover shadow-sm"
              />
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">{content.featuredEyebrow}</p>
            <h2 className="text-3xl font-semibold text-stone-900">{content.featuredTitle}</h2>
            <p className="mt-2 max-w-2xl text-stone-600">{content.featuredText}</p>
          </div>
          <Link href="/shop" className="text-sm font-semibold text-stone-900 underline-offset-4 hover:underline">
            View full shop
          </Link>
        </div>

        {featuredProducts.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
            Adrian products are ready to appear here once they are added to the shared Felix catalog.
          </div>
        )}
      </section>
    </div>
  );
}
