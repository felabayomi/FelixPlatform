import Link from "next/link";
import { formatCurrency } from "@/lib/api";
import type { Product } from "@/types/product";

type ProductCardProduct = Product & {
    shortDescription?: string;
};

export default function ProductCard({ product }: { product: ProductCardProduct }) {
    const image = product.images?.[0] || product.image || "/products/placeholder-product.svg";
    const shortDescription = product.shortDescription || product.short_description || product.description;
    const compareAtPrice = Number(product.compare_at_price || 0);
    const hasComparePrice = compareAtPrice > Number(product.price || 0);

    return (
        <div className="group rounded-2xl bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="relative overflow-hidden rounded-2xl bg-white">
                <img
                    src={image}
                    alt={product.title}
                    className="h-[320px] w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />

                {hasComparePrice ? (
                    <span className="absolute left-3 top-3 rounded-full bg-stone-900 px-3 py-1 text-xs font-semibold text-white">
                        Sale
                    </span>
                ) : null}
            </div>

            <div className="mt-4 space-y-1 px-1 pb-1">
                <h3 className="text-lg font-medium">{product.title}</h3>

                <p className="text-sm text-gray-500">{shortDescription}</p>

                <div className="mt-2 flex items-center gap-2">
                    <p className="font-semibold">{formatCurrency(product.price)}</p>
                    {hasComparePrice ? (
                        <p className="text-sm text-stone-400 line-through">{formatCurrency(compareAtPrice)}</p>
                    ) : null}
                </div>

                <Link href={product.slug ? `/shop/${product.slug}` : "/shop"} className="mt-3 inline-block text-sm underline">
                    View product
                </Link>
            </div>
        </div>
    );
}
