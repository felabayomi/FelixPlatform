"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addReportAttachment, getProjects, getToken, submitReport, type WaciProject } from "@/lib/api";
import { DashboardShell } from "@/components/waci/dashboard-shell";

export default function NewReportPage() {
    const router = useRouter();
    const [projects, setProjects] = useState<WaciProject[]>([]);
    const [form, setForm] = useState({
        project_id: "",
        report_month: "",
        summary: "",
        challenges: "",
        next_steps: "",
        attachment_urls: "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!getToken()) {
            setError("Authentication required to submit a report.");
            return;
        }
        getProjects("active")
            .then(setProjects)
            .catch(() => setError("Could not load projects."));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const report = await submitReport({
                project_id: Number(form.project_id),
                report_month: `${form.report_month}-01`,
                summary: form.summary,
                challenges: form.challenges || undefined,
                next_steps: form.next_steps || undefined,
            });

            const attachmentUrls = form.attachment_urls
                .split(/\r?\n/)
                .map((line) => line.trim())
                .filter(Boolean);

            if (attachmentUrls.length) {
                await Promise.all(
                    attachmentUrls.map((fileUrl) =>
                        addReportAttachment(report.id, {
                            file_url: fileUrl,
                            file_name: fileUrl.split("/").pop() || "attachment",
                        })
                    )
                );
            }

            router.push("/volunteer/reports");
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { error?: string } } };
            setError(axiosErr.response?.data?.error || "Failed to submit report");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-10">
            <DashboardShell title="Submit Monthly Report" subtitle="Document field execution for review and funding progression.">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="grid gap-5 bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Project *</label>
                        <select
                            required
                            value={form.project_id}
                            onChange={(e) => setForm({ ...form, project_id: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]"
                        >
                            <option value="">Select a project…</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>{project.title}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Report month *</label>
                        <input
                            type="month"
                            required
                            value={form.report_month}
                            onChange={(e) => setForm({ ...form, report_month: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Summary *</label>
                        <textarea
                            required
                            rows={5}
                            value={form.summary}
                            onChange={(e) => setForm({ ...form, summary: e.target.value })}
                            placeholder="Describe key field work, outcomes, and progress this month..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Challenges</label>
                        <textarea
                            rows={3}
                            value={form.challenges}
                            onChange={(e) => setForm({ ...form, challenges: e.target.value })}
                            placeholder="Any blockers or constraints encountered..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Next steps</label>
                        <textarea
                            rows={3}
                            value={form.next_steps}
                            onChange={(e) => setForm({ ...form, next_steps: e.target.value })}
                            placeholder="Planned activities for the next reporting cycle..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Attachment URLs (optional)</label>
                        <textarea
                            rows={3}
                            value={form.attachment_urls}
                            onChange={(e) => setForm({ ...form, attachment_urls: e.target.value })}
                            placeholder="One URL per line (photos, docs, PDFs)..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="bg-[#0B3D2E] text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-emerald-800 transition-colors disabled:opacity-60 w-fit"
                    >
                        {saving ? "Submitting..." : "Submit report"}
                    </button>
                </form>
            </DashboardShell>
        </div>
    );
}
