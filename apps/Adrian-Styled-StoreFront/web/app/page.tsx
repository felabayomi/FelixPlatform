import Link from "next/link";
import HeroCarousel from "@/components/HeroCarousel";
import ProductCard from "@/components/ProductCard";
import { getProducts, getStorefrontContent } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [featuredProducts, content] = await Promise.all([
    getProducts(true),
    getStorefrontContent(),
  ]);

  const heroImages = Array.from(
    new Set(
      (content.heroImages?.length
        ? content.heroImages
        : [content.heroImageOne, content.heroImageTwo, content.heroImageThree, content.heroImageFour]
      ).filter(Boolean),
    ),
  );

  return (
    <div className="flex flex-1 flex-col">
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-20 md:grid-cols-2">
        <div>
          <p className="text-sm tracking-widest text-gray-500">
            {String(content.heroEyebrow || "ADRIAN STORE").toUpperCase()}
          </p>

          <h1 className="mt-4 text-5xl leading-tight text-[var(--primary)] md:text-6xl">
            {content.heroTitle}
          </h1>

          <p className="mt-6 max-w-md text-gray-600">
            {content.heroText}
          </p>

          <div className="mt-8 flex gap-4">
            <Link href={content.heroPrimaryLink} className="rounded-full bg-black px-6 py-3 text-white">
              {content.heroPrimaryLabel}
            </Link>

            <Link href={content.heroSecondaryLink} className="rounded-full border px-6 py-3">
              {content.heroSecondaryLabel}
            </Link>
          </div>
        </div>

        <HeroCarousel
          images={heroImages.length ? heroImages : ["/products/chic-green-kaftan.svg"]}
          alt="Adrian’s Styled Collection hero"
        />
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
