import InquiryForm from "@/components/inquiry-form";
import { getSiteContent } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ContactPage() {
    const content = await getSiteContent();

    return (
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
            <div className="section-shell p-6 sm:p-8">
                <p className="soft-label">Contact</p>
                <h1 className="mt-3 text-4xl font-semibold text-white">Start a conversation with WACI.</h1>
                <p className="mt-4 text-slate-300">
                    Use the form to share a partnership idea, volunteer interest, or campaign question. Messages flow into the shared Felix support and email pipeline for WACI.
                </p>

                <div className="mt-6 rounded-[1.4rem] border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
                    <p className="font-semibold text-white">Support email</p>
                    <p className="mt-1">{content.supportEmail}</p>
                </div>
            </div>

            <InquiryForm />
        </div>
    );
}
