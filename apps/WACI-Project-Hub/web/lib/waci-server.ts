import { cookies } from "next/headers";
import { getProjectBySlug, projects as fallbackProjects, type WaciProject } from "@/lib/waci-data";

type StatItem = { label: string; value: string };
type TimelineItem = { month: string; status: string; due: string };
type PaymentItem = { month: string; amount: string; status: string };

type GrantSummaryData = {
    project: string;
    duration: string;
    funding: string;
    currentStatus: string;
    nextReportDue: string;
};

type DashboardData = {
    activeProject: string;
    nextReportDue: string;
    fundingStatus: string;
    reportTimeline: TimelineItem[];
    paymentRows: PaymentItem[];
    grantSummary?: GrantSummaryData;
    deliverables?: string[];
    nextReportId?: number;
};

type ApiProject = {
    id: number;
    slug: string;
    title: string;
    region?: string;
    purpose?: string;
    objectives?: string;
    deliverables?: string;
    status?: string;
    assignment_count?: number;
};

type ApiGrantOffer = {
    id: number;
    project_title?: string;
    status?: string;
    total_amount_cents?: number;
    currency?: string;
};

type ApiReport = {
    report_month?: string;
    due_date?: string;
    status?: string;
};

type ApiPayment = {
    payment_month?: string;
    amount_cents?: number;
    currency?: string;
    status?: string;
};

type ApiLifecycleDashboard = {
    profile: {
        next_report_due?: string;
        funding_status?: string;
    };
    reportSchedules: Array<{
        id: number;
        month_number: number;
        due_date?: string;
        status?: string;
    }>;
    fundingMilestones: Array<{
        month_number: number;
        amount_cents?: number;
        release_status?: string;
    }>;
};

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "https://felix-platform-backend.onrender.com").replace(/\/$/, "");

function splitTextLines(value?: string, fallback: string[] = []): string[] {
    if (!value) return fallback;
    const lines = value
        .split(/\r?\n|;|,/)
        .map((line) => line.trim())
        .filter(Boolean);
    return lines.length ? lines : fallback;
}

function toTitleStatus(status?: string): "Pilot" | "Active" | "Completed" {
    const normalized = (status || "").toLowerCase();
    if (normalized.includes("complete")) return "Completed";
    if (normalized.includes("active")) return "Active";
    return "Pilot";
}

function formatMoney(cents?: number, currency = "USD"): string {
    if (!cents || Number.isNaN(cents)) return "$300";
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currency.toUpperCase(),
        maximumFractionDigits: 0,
    }).format(cents / 100);
}

function toDashboardStatus(status?: string): string {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "eligible") return "Processing";
    if (normalized === "released") return "Paid";
    if (normalized === "awaiting_report") return "Awaiting Report";
    if (normalized === "review") return "Review";
    if (normalized === "locked") return "Locked";
    return normalized ? normalized.replace(/_/g, " ") : "Pending";
}

function mapProject(project: ApiProject): WaciProject {
    return {
        slug: project.slug,
        title: project.title,
        location: project.region || "Nigeria",
        status: toTitleStatus(project.status),
        summary:
            project.purpose ||
            "A pilot conservation operations project focused on reducing wildlife risk through structured field reporting and measurable monthly delivery.",
        focus: "Bird/Wildlife Hazard Reduction",
        duration: "12 months",
        monthlyFunding: "$300",
        objectives: splitTextLines(project.objectives, fallbackProjects[0]?.objectives || []),
        deliverables: splitTextLines(project.deliverables, fallbackProjects[0]?.deliverables || []),
    };
}

async function getAuthTokenFromCookie(): Promise<string | null> {
    const jar = await cookies();
    return jar.get("waci_hub_token")?.value || null;
}

async function fetchJson<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
    const headers = new Headers(init?.headers);
    if (!headers.has("Accept")) headers.set("Accept", "application/json");
    if (token) headers.set("Authorization", `Bearer ${token}`);

    const response = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Request failed: ${response.status}`);
    }

    return response.json() as Promise<T>;
}

export async function getLandingStats(): Promise<StatItem[]> {
    try {
        const [projectRows, programRows] = await Promise.all([
            fetchJson<ApiProject[]>("/api/waci/projects").catch(() => []),
            fetchJson<unknown[]>("/api/waci/programs").catch(() => []),
        ]);

        const countries = new Set(
            projectRows
                .map((project) => project.region?.split(",").pop()?.trim())
                .filter((value): value is string => Boolean(value))
        );

        const activeGrantees = projectRows.reduce(
            (sum, project) => sum + Number(project.assignment_count || 0),
            0
        );

        return [
            { label: "Projects", value: String(projectRows.length || 1) },
            { label: "Countries", value: String(countries.size || 1) },
            { label: "Active Grantees", value: String(activeGrantees || 1) },
            {
                label: "Reporting Model",
                value: programRows.length ? "Monthly" : "Monthly",
            },
        ];
    } catch {
        return [
            { label: "Projects", value: "1" },
            { label: "Countries", value: "1" },
            { label: "Active Grantees", value: "1" },
            { label: "Reporting Model", value: "Monthly" },
        ];
    }
}

export async function getPublicProjects(): Promise<WaciProject[]> {
    try {
        const rows = await fetchJson<ApiProject[]>("/api/waci/projects");
        const mapped = rows.map(mapProject);
        return mapped.length ? mapped : fallbackProjects;
    } catch {
        return fallbackProjects;
    }
}

export async function getPublicProjectBySlug(slug: string): Promise<WaciProject | undefined> {
    try {
        const row = await fetchJson<ApiProject>(`/api/waci/projects/${slug}`);
        return mapProject(row);
    } catch {
        return getProjectBySlug(slug);
    }
}

export async function getGrantSummaryByOfferId(offerId: string): Promise<GrantSummaryData | undefined> {
    const token = await getAuthTokenFromCookie();
    if (!token) return undefined;

    try {
        const offer = await fetchJson<ApiGrantOffer>(`/api/waci-hub/grants/${offerId}`, undefined, token);
        const monthly = offer.total_amount_cents ? Math.round(offer.total_amount_cents / 12) : undefined;

        return {
            project: offer.project_title || "HUKIA Airport Wildlife Hazard Control Unit",
            duration: "12 months",
            funding: `${formatMoney(monthly, offer.currency)} / month`,
            currentStatus: offer.status ? toTitleStatus(offer.status) : "Active",
            nextReportDue: "April 30",
        };
    } catch {
        return undefined;
    }
}

export async function getDashboardData(): Promise<DashboardData | undefined> {
    const token = await getAuthTokenFromCookie();
    if (!token) return undefined;

    try {
        const lifecycle = await fetchJson<ApiLifecycleDashboard | null>(
            "/api/waci-hub/grants/dashboard/mine",
            undefined,
            token
        ).catch(() => null);

        if (lifecycle?.profile) {
            const reportTimeline = lifecycle.reportSchedules.slice(0, 6).map((report) => ({
                month: `Month ${report.month_number}`,
                status: toDashboardStatus(report.status),
                due: report.due_date
                    ? new Date(report.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : "TBD",
            }));

            const paymentRows = lifecycle.fundingMilestones.slice(0, 6).map((milestone) => ({
                month: `Month ${milestone.month_number}`,
                amount: formatMoney(milestone.amount_cents),
                status: toDashboardStatus(milestone.release_status),
            }));

            const activeProfile = lifecycle.profile as any;
            const firstPending = lifecycle.reportSchedules.find((row) => row.status !== "approved") || lifecycle.reportSchedules[0];
            const deliverables = splitTextLines(activeProfile.deliverables);
            const durationMonths = lifecycle.reportSchedules.length || 12;
            const monthly = lifecycle.fundingMilestones[0]?.amount_cents;

            return {
                activeProject: activeProfile.project_title || "1",
                nextReportDue: activeProfile.next_report_due
                    ? new Date(activeProfile.next_report_due).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    : reportTimeline[0]?.due || "TBD",
                fundingStatus: toDashboardStatus(activeProfile.funding_status),
                reportTimeline,
                paymentRows,
                deliverables,
                nextReportId: firstPending?.id,
                grantSummary: {
                    project: activeProfile.project_title || "WACI Project",
                    duration: `${durationMonths} months`,
                    funding: `${formatMoney(monthly)} / month`,
                    currentStatus: "Active",
                    nextReportDue: activeProfile.next_report_due
                        ? new Date(activeProfile.next_report_due).toLocaleDateString("en-US", { month: "long", day: "numeric" })
                        : "TBD",
                },
            };
        }

        const [grants, reports, payments] = await Promise.all([
            fetchJson<ApiGrantOffer[]>("/api/waci-hub/grants/mine", undefined, token).catch(() => []),
            fetchJson<ApiReport[]>("/api/waci-hub/reports/mine", undefined, token).catch(() => []),
            fetchJson<ApiPayment[]>("/api/waci-hub/reports/payments/mine", undefined, token).catch(() => []),
        ]);

        const primaryGrant = grants[0];

        const reportTimeline = reports.slice(0, 4).map((report, index) => ({
            month: report.report_month ? `Month ${index + 1}` : `Month ${index + 1}`,
            status: report.status ? toTitleStatus(report.status) : "Pending",
            due: report.due_date ? new Date(report.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD",
        }));

        const paymentRows = payments.slice(0, 4).map((payment, index) => ({
            month: payment.payment_month || `Month ${index + 1}`,
            amount: formatMoney(payment.amount_cents, payment.currency),
            status: payment.status ? toTitleStatus(payment.status) : "Pending",
        }));

        return {
            activeProject: primaryGrant?.project_title || "1",
            nextReportDue: reportTimeline[0]?.due || "Apr 30",
            fundingStatus: paymentRows.some((row) => row.status === "Pending") ? "Pending" : "On Track",
            reportTimeline,
            paymentRows,
            grantSummary: primaryGrant
                ? {
                    project: primaryGrant.project_title || "HUKIA Airport Wildlife Hazard Control Unit",
                    duration: "12 months",
                    funding: `${formatMoney(primaryGrant.total_amount_cents ? Math.round(primaryGrant.total_amount_cents / 12) : undefined, primaryGrant.currency)} / month`,
                    currentStatus: primaryGrant.status ? toTitleStatus(primaryGrant.status) : "Active",
                    nextReportDue: reportTimeline[0]?.due || "April 30",
                }
                : undefined,
        };
    } catch {
        return undefined;
    }
}
