import Link from "next/link";
import { getStorefrontContent } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function SuccessPage() {
    const content = await getStorefrontContent();

    return (
        <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-emerald-200 bg-white p-10 shadow-sm">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">{content.successEyebrow}</p>
                <h1 className="mt-3 text-3xl font-semibold text-stone-900">{content.successTitle}</h1>
                <p className="mt-4 max-w-xl text-stone-600">
                    {content.successText}
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                    <Link href="/shop" className="rounded-full bg-stone-900 px-5 py-3 text-sm font-semibold text-white">
                        Continue shopping
                    </Link>
                    <Link href="/" className="rounded-full border border-stone-300 px-5 py-3 text-sm font-semibold text-stone-900">
                        Back to home
                    </Link>
                </div>
            </div>
        </div>
    );
}
