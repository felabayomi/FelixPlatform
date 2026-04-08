import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/api";

export default async function ShopPage() {
    const products = await getProducts();

    return (
        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="mb-8 space-y-2">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">Shop</p>
                <h1 className="text-3xl font-semibold text-stone-900 sm:text-4xl">Adrian&apos;s latest collection</h1>
                <p className="max-w-2xl text-stone-600">
                    Explore statement kaftans and standout pieces curated for effortless elegance, comfort, and confidence.
                </p>
            </div>

            {products.length ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            ) : (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-stone-600">
                    Adrian products will appear here as soon as they are added to the shared Felix catalog.
                </div>
            )}
        </div>
    );
}
