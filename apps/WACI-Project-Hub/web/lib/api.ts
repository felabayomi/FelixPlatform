import axios from "axios";

const BASE_URL = (
    process.env.NEXT_PUBLIC_API_URL || "https://felix-platform-backend.onrender.com"
).replace(/\/$/, "");

const api = axios.create({ baseURL: BASE_URL });

// ─── Auth helpers (client-side only) ──────────────────────────
export const getToken = (): string | null =>
    typeof window !== "undefined" ? localStorage.getItem("waci_hub_token") : null;

export const saveToken = (token: string) =>
    typeof window !== "undefined" && localStorage.setItem("waci_hub_token", token);

export const clearToken = () =>
    typeof window !== "undefined" && localStorage.removeItem("waci_hub_token");

api.interceptors.request.use((config) => {
    const token = getToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ─── Types ────────────────────────────────────────────────────
export type WaciProject = {
    id: number;
    title: string;
    slug: string;
    purpose?: string;
    objectives?: string;
    methodology?: string;
    deliverables?: string;
    expectations?: string;
    region?: string;
    status: string;
    start_date?: string;
    end_date?: string;
    assignment_count?: number;
};

export type WaciGrantOffer = {
    id: number;
    user_id?: number;
    project_id: number;
    offer_code?: string;
    project_title: string;
    project_slug: string;
    project_region?: string;
    volunteer_name?: string;
    volunteer_email?: string;
    title: string;
    purpose?: string;
    objectives?: string;
    methodology?: string;
    deliverables?: string;
    expectations?: string;
    funding_structure?: string;
    reporting_deadlines?: string;
    final_reporting_requirement?: string;
    total_amount_cents: number;
    currency: string;
    status: string;
    issued_at: string;
    expires_at?: string;
    signature_name?: string;
    accepted_at?: string;
    signed_at?: string;
    pdf_url?: string;
};

export type WaciReport = {
    id: number;
    project_id: number;
    project_title: string;
    project_slug: string;
    user_id: number;
    volunteer_name: string;
    grant_offer_id?: number;
    report_month: string;
    due_date?: string;
    is_late?: boolean;
    summary: string;
    challenges?: string;
    next_steps?: string;
    status: string;
    submitted_at: string;
    reviewed_at?: string;
    admin_notes?: string;
    payment_unlock_eligible?: boolean;
};

export type WaciFundingMilestone = {
    id: number;
    project_id: number;
    grant_offer_id: number;
    user_id: number;
    amount_cents: number;
    currency: string;
    status: string;
    payment_month?: string;
};

export type WaciPayment = {
    id: number;
    grant_offer_id: number;
    user_id: number;
    project_id: number;
    project_title: string;
    volunteer_name: string;
    amount_cents: number;
    currency: string;
    status: string;
    payout_method?: string;
    payment_month?: string;
    processed_at?: string;
    report_status?: string;
    payment_unlock_eligible?: boolean;
};

export type WaciScheduledReport = {
    id: number;
    project_id: number;
    project_title: string;
    project_slug: string;
    grant_agreement_id: number;
    dashboard_profile_id: number;
    month_number: number;
    due_date: string;
    submitted_at?: string;
    status: string;
    narrative: string;
    attachments: string[];
    funding_status?: string;
};

// ─── API calls ────────────────────────────────────────────────

export async function getProjects(status?: string): Promise<WaciProject[]> {
    const params = status ? { status } : {};
    const res = await api.get("/api/waci/projects", { params });
    return res.data;
}

export async function getProject(slug: string): Promise<WaciProject> {
    const res = await api.get(`/api/waci/projects/${slug}`);
    return res.data;
}

export async function getProjectById(id: string | number): Promise<WaciProject> {
    const res = await api.get(`/api/waci/projects/${id}`);
    return res.data;
}

export async function getProjectGrant(projectId: string | number): Promise<WaciGrantOffer | null> {
    const res = await api.get(`/api/waci/projects/${projectId}/grant`);
    return res.data;
}

export async function getProjectReports(projectId: string | number): Promise<WaciReport[]> {
    const res = await api.get(`/api/waci/projects/${projectId}/reports`);
    return res.data;
}

export async function getGrantOffer(id: string | number): Promise<WaciGrantOffer> {
    const res = await api.get(`/api/waci-hub/grants/${id}`);
    return res.data;
}

export async function getMyGrantOffers(): Promise<WaciGrantOffer[]> {
    const res = await api.get('/api/waci-hub/grants/mine');
    return res.data;
}

export async function getGrantOffers(status?: string): Promise<WaciGrantOffer[]> {
    const res = await api.get('/api/waci-hub/grants', {
        params: status ? { status } : undefined,
    });
    return res.data;
}

export async function generateGrantOfferFromProject(projectId: number): Promise<WaciGrantOffer> {
    const res = await api.post(`/api/waci-hub/grants/from-project/${projectId}`);
    return res.data;
}

export async function sendGrantOffer(
    id: string | number,
    payload: { volunteer_name: string; volunteer_email: string }
): Promise<WaciGrantOffer & { acceptance_url?: string }> {
    const res = await api.post(`/api/waci-hub/grants/${id}/send`, payload);
    return res.data;
}

export async function acceptGrantOffer(
    id: string | number,
    payload: { signature_name: string; signature_data?: string }
): Promise<unknown> {
    const res = await api.post(`/api/waci-hub/grants/${id}/accept`, payload);
    return res.data;
}

export async function getMyReports(): Promise<WaciReport[]> {
    const res = await api.get("/api/waci-hub/reports/mine");
    return res.data;
}

export async function getReports(params?: {
    project_id?: number;
    user_id?: number;
    status?: string;
}): Promise<WaciReport[]> {
    const res = await api.get('/api/waci-hub/reports', { params });
    return res.data;
}

export async function approveReport(id: number | string, admin_notes?: string): Promise<unknown> {
    const res = await api.post(`/api/waci-hub/reports/${id}/approve`, { admin_notes });
    return res.data;
}

export async function getMyScheduledReports(): Promise<WaciScheduledReport[]> {
    const res = await api.get('/api/waci-hub/reports/schedule/mine');
    return res.data;
}

export async function getScheduledReport(id: number | string): Promise<WaciScheduledReport> {
    const res = await api.get(`/api/waci-hub/reports/schedule/${id}`);
    return res.data;
}

export async function submitScheduledReport(
    id: number | string,
    payload: {
        narrative: string;
        attachments?: string[];
        challenges?: string;
        next_steps?: string;
    }
): Promise<unknown> {
    const res = await api.post(`/api/waci-hub/reports/${id}/submit`, payload);
    return res.data;
}

export async function submitReport(payload: {
    project_id: number;
    grant_offer_id?: number;
    report_month: string;
    summary: string;
    challenges?: string;
    next_steps?: string;
}): Promise<WaciReport> {
    const res = await api.post("/api/waci-hub/reports", payload);
    return res.data;
}

export async function addReportAttachment(reportId: number, payload: { file_url: string; file_name?: string }) {
    const res = await api.post(`/api/waci-hub/reports/${reportId}/attachments`, payload);
    return res.data;
}

export async function getMyPayments(): Promise<WaciPayment[]> {
    const res = await api.get('/api/waci-hub/reports/payments/mine');
    return res.data;
}

export async function getPayments(params?: {
    project_id?: number;
    user_id?: number;
    status?: string;
}): Promise<WaciFundingMilestone[]> {
    const res = await api.get('/api/waci-hub/reports/payments', { params });
    return res.data;
}

export default api;
