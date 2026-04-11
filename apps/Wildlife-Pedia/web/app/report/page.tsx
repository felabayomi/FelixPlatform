import WildlifeSightingForm from "@/components/wildlife-sighting-form";

export default function ReportPage() {
    return (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Live Sightings / Report a Sighting</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Help build practical wildlife awareness.</h1>
                <p className="mt-4 text-slate-300">
                    Share what you saw, where it happened, and any immediate safety concerns. This supports the community-driven reporting layer at the heart of Wildlife-Pedia’s future growth.
                </p>
                <div className="mt-6 rounded-[1.4rem] border border-amber-300/20 bg-amber-300/10 p-4 text-sm text-amber-50">
                    Report calmly and accurately. Avoid putting yourself at risk to get closer, film, or identify wildlife.
                </div>
            </div>

            <WildlifeSightingForm />
        </div>
    );
}
