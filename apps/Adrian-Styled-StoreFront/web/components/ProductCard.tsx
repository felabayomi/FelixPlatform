import Link from "next/link";
import { formatCurrency } from "@/lib/api";
import type { Product } from "@/types/product";

export default function ProductCard({ product }: { product: Product }) {
    const image = product.images?.[0] || product.image || "/products/placeholder-product.svg";

    return (
        <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-md">
            <div className="aspect-[4/5] overflow-hidden bg-stone-100">
                <img src={image} alt={product.title} className="h-full w-full object-cover" />
            </div>

            <div className="space-y-3 p-4">
                <div>
                    <h3 className="text-lg font-semibold text-stone-900">{product.title}</h3>
                    <p className="mt-1 line-clamp-2 text-sm text-stone-600">
                        {product.short_description || product.description}
                    </p>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <span className="text-base font-semibold text-emerald-700">{formatCurrency(product.price)}</span>
                    <Link
                        href={product.slug ? `/shop/${product.slug}` : "/shop"}
                        className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white"
                    >
                        View
                    </Link>
                </div>
            </div>
        </article>
    );
}
