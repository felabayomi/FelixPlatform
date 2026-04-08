"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CartItem = {
    productId: string;
    title: string;
    price: number;
    image: string;
    quantity: number;
    slug?: string | null;
};

type CartState = {
    items: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (id: string) => void;
    decreaseQuantity: (id: string) => void;
    clearCart: () => void;
    getTotal: () => number;
};

export const useCart = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addToCart: (item) =>
                set((state) => {
                    const existing = state.items.find((entry) => entry.productId === item.productId);

                    if (existing) {
                        return {
                            items: state.items.map((entry) =>
                                entry.productId === item.productId
                                    ? { ...entry, quantity: entry.quantity + item.quantity }
                                    : entry,
                            ),
                        };
                    }

                    return {
                        items: [...state.items, item],
                    };
                }),

            removeFromCart: (id) =>
                set((state) => ({
                    items: state.items.filter((entry) => entry.productId !== id),
                })),

            decreaseQuantity: (id) =>
                set((state) => ({
                    items: state.items
                        .map((entry) =>
                            entry.productId === id
                                ? { ...entry, quantity: entry.quantity - 1 }
                                : entry,
                        )
                        .filter((entry) => entry.quantity > 0),
                })),

            clearCart: () => set({ items: [] }),

            getTotal: () =>
                get().items.reduce((sum, entry) => sum + entry.price * entry.quantity, 0),
        }),
        {
            name: "adrian-store-cart",
            storage: createJSONStorage(() => localStorage),
        },
    ),
);
