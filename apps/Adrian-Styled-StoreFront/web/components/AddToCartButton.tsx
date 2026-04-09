"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/types/product";

export default function AddToCartButton({ product }: { product: Product }) {
    const addToCart = useCart((state) => state.addToCart);
    const [justAdded, setJustAdded] = useState(false);

    useEffect(() => {
        if (!justAdded) {
            return undefined;
        }

        const timeoutId = window.setTimeout(() => setJustAdded(false), 1800);
        return () => window.clearTimeout(timeoutId);
    }, [justAdded]);

    const handleAddToCart = () => {
        addToCart({
            productId: String(product.id),
            slug: product.slug,
            title: product.title,
            price: product.price,
            image: product.images?.[0] || product.image || "/products/placeholder-product.svg",
            quantity: 1,
        });
        setJustAdded(true);
    };

    return (
        <div className="mt-6 space-y-2">
            <button
                type="button"
                className="inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-emerald-700"
                onClick={handleAddToCart}
                disabled={justAdded}
                aria-live="polite"
            >
                {justAdded ? <CheckCircle2 className="h-4 w-4" /> : <ShoppingBag className="h-4 w-4" />}
                {justAdded ? "Added to cart" : "Add to cart"}
            </button>

            {justAdded ? (
                <p className="text-sm font-medium text-emerald-700">
                    ✓ Added to cart. <Link href="/cart" className="underline underline-offset-4">View cart</Link>
                </p>
            ) : null}
        </div>
    );
}
