import { getStorefrontContent } from "@/lib/api";

export default async function Footer() {
    const content = await getStorefrontContent();

    return (
        <footer className="mt-auto border-t border-stone-200 bg-stone-50">
            <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-stone-600 sm:px-6 lg:px-8">
                <p className="font-semibold text-stone-900">{content.footerTitle}</p>
                <p>{content.footerText}</p>
                <p>{content.footerSubtext}</p>
                {content.supportEmail ? (
                    <a href={`mailto:${content.supportEmail}`} className="font-medium text-stone-900 underline-offset-4 hover:underline">
                        {content.supportEmail}
                    </a>
                ) : null}
            </div>
        </footer>
    );
}
