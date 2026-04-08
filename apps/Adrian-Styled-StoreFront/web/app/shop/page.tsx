import ProductCard from "@/components/ProductCard";
import { getProducts } from "@/lib/api";

export default async function ShopPage() {
    const products = await getProducts();

    return (
        <div className="max-w-7xl mx-auto px-6 py-16">
            <h2 className="mb-10 text-3xl">Shop Collection</h2>

            {products.length ? (
                <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
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
