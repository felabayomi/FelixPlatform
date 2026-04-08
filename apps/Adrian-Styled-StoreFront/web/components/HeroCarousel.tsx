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
    intervalMs = 4500,
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

    return (
        <div className="relative overflow-hidden rounded-2xl bg-stone-100 shadow-sm transition hover:shadow-lg">
            <div className="relative h-[500px] w-full">
                {slides.map((image, index) => (
                    <img
                        key={`${image}-${index}`}
                        src={image}
                        alt={`${alt} ${index + 1}`}
                        className={`absolute inset-0 h-full w-full object-cover transition-all duration-700 ${index === activeIndex ? "scale-100 opacity-100" : "scale-[1.02] opacity-0"
                            }`}
                    />
                ))}

                <div className="absolute inset-0 bg-black/5" />

                {slides.length > 1 ? (
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
                ) : null}
            </div>
        </div>
    );
}
