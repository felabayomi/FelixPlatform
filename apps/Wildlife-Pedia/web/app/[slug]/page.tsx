import type { Metadata } from "next";
import { notFound } from "next/navigation";
import WildlifePageSections from "@/components/wildlife-page-sections";
import { getWildlifePageContent, getWildlifePediaSiteContent } from "@/lib/wildlife-api";

export const dynamic = "force-dynamic";

type PageProps = {
    params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params;
    const content = await getWildlifePediaSiteContent();
    const page = getWildlifePageContent(content, slug);

    if (!page) {
        return {
            title: "Page not found | Wildlife-Pedia",
        };
    }

    return {
        title: `${page.title} | Wildlife-Pedia`,
        description: page.heroText || page.intro || content.heroText,
        alternates: {
            canonical: `/${page.slug}`,
        },
    };
}

export default async function WildlifeCustomPage({ params }: PageProps) {
    const { slug } = await params;
    const content = await getWildlifePediaSiteContent();
    const page = getWildlifePageContent(content, slug);

    if (!page) {
        notFound();
    }

    return (
        <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="section-shell overflow-hidden p-6 sm:p-8">
                {page.image ? (
                    <img src={page.image} alt={page.title} className="mb-6 h-56 w-full rounded-[1.4rem] object-cover sm:h-72" />
                ) : null}
                <p className="soft-label">{page.navigationLabel || page.title}</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">{page.heroTitle || page.title}</h1>
                {page.heroText ? <p className="mt-4 max-w-3xl text-slate-300">{page.heroText}</p> : null}
                {page.intro ? <p className="mt-3 max-w-3xl text-slate-300">{page.intro}</p> : null}

                <WildlifePageSections sections={page.sections} />
            </div>
        </div>
    );
}
