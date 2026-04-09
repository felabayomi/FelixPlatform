"use client";

import { useEffect, useMemo, useState } from "react";

type HeroCarouselProps = {
    images: string[];
    alt?: string;
    intervalMs?: number;
};

export default function HeroCarousel({
    images,
    alt = "Adrian’s Styled Collection hero",
    intervalMs = 3500,
}: HeroCarouselProps) {
    const slides = useMemo(
        () => images.filter(Boolean).filter((value, index, items) => items.indexOf(value) === index),
        [images],
    );
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        setActiveIndex(0);
    }, [slides.length]);

    useEffect(() => {
        if (slides.length < 2) {
            return undefined;
        }

        const timer = window.setInterval(() => {
            setActiveIndex((current) => (current + 1) % slides.length);
        }, intervalMs);

        return () => window.clearInterval(timer);
    }, [intervalMs, slides.length]);

    if (!slides.length) {
        return null;
    }

    const goPrevious = () => {
        setActiveIndex((current) => (current - 1 + slides.length) % slides.length);
    };

    const goNext = () => {
        setActiveIndex((current) => (current + 1) % slides.length);
    };

    return (
        <div className="relative overflow-hidden rounded-2xl bg-stone-100 shadow-sm transition hover:shadow-lg">
            <div className="relative h-[500px] w-full overflow-hidden">
                <div
                    className="flex h-full transition-transform duration-700 ease-out"
                    style={{ transform: `translateX(-${activeIndex * 100}%)` }}
                >
                    {slides.map((image, index) => (
                        <img
                            key={`${image}-${index}`}
                            src={image}
                            alt={`${alt} ${index + 1}`}
                            className="h-full w-full shrink-0 object-cover"
                        />
                    ))}
                </div>

                <div className="absolute inset-0 bg-black/5" />

                {slides.length > 1 ? (
                    <>
                        <div className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-medium text-stone-900 backdrop-blur">
                            {activeIndex + 1} / {slides.length}
                        </div>

                        <button
                            type="button"
                            aria-label="Previous hero image"
                            onClick={goPrevious}
                            className="absolute left-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-stone-900 shadow-sm backdrop-blur transition hover:bg-white"
                        >
                            ‹
                        </button>

                        <button
                            type="button"
                            aria-label="Next hero image"
                            onClick={goNext}
                            className="absolute right-4 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-lg text-stone-900 shadow-sm backdrop-blur transition hover:bg-white"
                        >
                            ›
                        </button>

                        <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-white/80 px-3 py-2 backdrop-blur">
                            {slides.map((image, index) => (
                                <button
                                    key={`${image}-dot-${index}`}
                                    type="button"
                                    aria-label={`Show hero image ${index + 1}`}
                                    onClick={() => setActiveIndex(index)}
                                    className={`h-2.5 w-2.5 rounded-full transition ${index === activeIndex ? "bg-stone-900" : "bg-stone-400"
                                        }`}
                                />
                            ))}
                        </div>
                    </>
                ) : null}
            </div>
        </div>
    );
}
