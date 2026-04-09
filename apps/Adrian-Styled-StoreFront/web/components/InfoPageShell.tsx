import Link from "next/link";

type InfoSection = {
    title: string;
    paragraphs: string[];
};

type InfoPageShellProps = {
    eyebrow: string;
    title: string;
    intro: string;
    sections: InfoSection[];
};

export default function InfoPageShell({ eyebrow, title, intro, sections }: InfoPageShellProps) {
    return (
        <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-lg sm:p-8">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">{eyebrow}</p>
                <h1 className="mt-3 text-3xl font-semibold text-stone-900 sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-3xl text-stone-600">{intro}</p>

                <div className="mt-8 space-y-6">
                    {sections.map((section) => (
                        <section key={section.title} className="space-y-2 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                            <h2 className="text-xl font-semibold text-stone-900">{section.title}</h2>
                            {section.paragraphs.map((paragraph) => (
                                <p key={paragraph} className="text-sm leading-7 text-stone-600">
                                    {paragraph}
                                </p>
                            ))}
                        </section>
                    ))}
                </div>

                <div className="mt-8 flex flex-wrap gap-3">
                    <Link href="/contact" className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-700">
                        Contact Adrian
                    </Link>
                    <Link href="/shop" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900 transition hover:border-stone-900">
                        Continue shopping
                    </Link>
                </div>
            </div>
        </div>
    );
}
