"use client";

import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/types/product";

export default function AddToCartButton({ product }: { product: Product }) {
    const addToCart = useCart((state) => state.addToCart);

    return (
        <button
            type="button"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700"
            onClick={() =>
                addToCart({
                    productId: String(product.id),
                    slug: product.slug,
                    title: product.title,
                    price: product.price,
                    image: product.images?.[0] || product.image || "/products/placeholder-product.svg",
                    quantity: 1,
                })
            }
        >
            <ShoppingBag className="h-4 w-4" />
            Add to cart
        </button>
    );
}
