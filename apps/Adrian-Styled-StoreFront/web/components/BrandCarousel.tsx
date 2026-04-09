"use client";

import { useMemo } from "react";

type BrandCarouselItem = {
    src: string;
    alt: string;
    label: string;
};

type BrandCarouselProps = {
    items: BrandCarouselItem[];
};

export default function BrandCarousel({ items }: BrandCarouselProps) {
    const slides = useMemo(
        () => items.filter((item) => item?.src),
        [items],
    );

    if (!slides.length) {
        return null;
    }

    const marqueeItems = [...slides, ...slides];

    return (
        <section className="mx-auto w-full max-w-7xl px-6 pb-6">
            <div className="rounded-3xl border border-stone-200 bg-white/90 p-4 shadow-sm backdrop-blur sm:p-5">
                <div className="mb-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                        Luxury inspirations
                    </p>
                    <h2 className="text-lg font-semibold text-stone-900 sm:text-xl">
                        Signature brand moodboard
                    </h2>
                </div>

                <div className="relative overflow-hidden rounded-2xl bg-[#f7f4ee] py-3">
                    <div className="brand-marquee-track flex w-max items-center gap-4 sm:gap-6">
                        {marqueeItems.map((item, index) => (
                            <div key={`${item.label}-${index}`} className="w-[220px] shrink-0 sm:w-[260px] lg:w-[300px]">
                                <div className="flex min-h-[120px] items-center justify-center rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:min-h-[140px]">
                                    <img
                                        src={item.src}
                                        alt={item.alt}
                                        className="max-h-[80px] w-full object-contain sm:max-h-[96px]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
