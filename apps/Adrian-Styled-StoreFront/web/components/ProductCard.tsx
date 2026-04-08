import Link from "next/link";
import { formatCurrency } from "@/lib/api";
import type { Product } from "@/types/product";

type ProductCardProduct = Product & {
    shortDescription?: string;
};

export default function ProductCard({ product }: { product: ProductCardProduct }) {
    const image = product.images?.[0] || product.image || "/products/placeholder-product.svg";
    const shortDescription = product.shortDescription || product.short_description || product.description;

    return (
        <div className="group rounded-2xl bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="relative overflow-hidden rounded-2xl bg-white">
                <img
                    src={image}
                    alt={product.title}
                    className="h-[320px] w-full object-cover transition duration-500 group-hover:scale-105"
                />

                <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" />
            </div>

            <div className="mt-4 space-y-1 px-1 pb-1">
                <h3 className="text-lg font-medium">{product.title}</h3>

                <p className="text-sm text-gray-500">{shortDescription}</p>

                <p className="mt-2 font-semibold">{formatCurrency(product.price)}</p>

                <Link href={product.slug ? `/shop/${product.slug}` : "/shop"} className="mt-3 inline-block text-sm underline">
                    View product
                </Link>
            </div>
        </div>
    );
}
