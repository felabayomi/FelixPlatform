"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getMyPayments, getMyReports, getToken, type WaciPayment, type WaciReport } from "@/lib/api";
import { DashboardShell } from "@/components/waci/dashboard-shell";
import { DashboardStatCard } from "@/components/waci/dashboard-stat-card";
import { ReportTimeline } from "@/components/waci/report-timeline";
import { PaymentTracker } from "@/components/waci/payment-tracker";

export const dynamic = "force-dynamic";

export default function VolunteerReportsPage() {
    const [reports, setReports] = useState<WaciReport[]>([]);
    const [payments, setPayments] = useState<WaciPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!getToken()) {
            setError("Authentication required to view reporting workspace.");
            setLoading(false);
            return;
        }

        Promise.all([getMyReports().catch(() => []), getMyPayments().catch(() => [])])
            .then(([reportRows, paymentRows]) => {
                setReports(reportRows);
                setPayments(paymentRows);
            })
            .catch(() => setError("Failed to load grantee report workspace."))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <p className="text-gray-500 p-8">Loading reporting workspace…</p>;

    return (
        <div className="max-w-5xl mx-auto px-4 py-10">
            <DashboardShell title="Monthly Reports" subtitle="Private grantee reporting interface for compliance and payment progression.">
                {error && <p className="text-red-600 text-sm">{error}</p>}

                <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                        <h2 className="text-xl font-black text-gray-900">Reporting Summary</h2>
                        <Link href="/volunteer/reports/new" className="bg-[#0B3D2E] text-white px-5 py-2 rounded-lg font-medium hover:bg-emerald-800 transition-colors text-sm">
                            + Submit report
                        </Link>
                    </div>
                    <div className="grid sm:grid-cols-3 gap-4">
                        <DashboardStatCard label="Reports submitted" value={String(reports.length)} />
                        <DashboardStatCard label="Approved reports" value={String(reports.filter((r) => r.status === "approved").length)} />
                        <DashboardStatCard label="Funding completed" value={String(payments.filter((p) => p.status === "completed").length)} />
                    </div>
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-4">Report Timeline</h2>
                    <ReportTimeline
                        rows={reports.slice(0, 4).map((report, index) => ({
                            month: report.report_month ? `Month ${index + 1}` : `Month ${index + 1}`,
                            status: report.status || "Pending",
                            due: report.due_date
                                ? new Date(report.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                                : "TBD",
                        }))}
                    />
                </section>

                <section className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h2 className="text-xl font-black text-gray-900 mb-4">Payment Status</h2>
                    <PaymentTracker
                        rows={payments.slice(0, 4).map((payment, index) => ({
                            month: payment.payment_month || `Month ${index + 1}`,
                            amount: payment.amount_cents
                                ? new Intl.NumberFormat("en-US", {
                                    style: "currency",
                                    currency: (payment.currency || "USD").toUpperCase(),
                                    maximumFractionDigits: 0,
                                }).format(payment.amount_cents / 100)
                                : "$300",
                            status: payment.status || "Pending",
                        }))}
                    />
                </section>
            </DashboardShell>
        </div>
    );
}
