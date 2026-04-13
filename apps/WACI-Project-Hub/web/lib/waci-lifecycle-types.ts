export type ProjectStatus =
    | "draft"
    | "published"
    | "awarded"
    | "active"
    | "completed";

export type GrantOfferStatus =
    | "draft"
    | "sent"
    | "accepted"
    | "declined"
    | "expired";

export type GrantAgreementStatus = "active" | "terminated" | "completed";

export type DashboardFundingStatus =
    | "on_track"
    | "awaiting_report"
    | "review"
    | "released";

export type DashboardProfileStatus = "active" | "completed";

export type MonthlyReportStatus = "pending" | "submitted" | "approved" | "rejected";

export type FundingReleaseStatus = "locked" | "eligible" | "released";

export type Project = {
    id: string;
    slug: string;
    title: string;
    location: string;
    summary: string;
    focus: string;
    durationMonths: number;
    monthlyFunding: number;
    objectives: string[];
    deliverables: string[];
    methodology: string[];
    reportingRequirements: string[];
    status: ProjectStatus;
    createdAt: string;
};

export type GrantOffer = {
    id: string;
    projectId: string;
    offerCode: string;
    volunteerName?: string;
    volunteerEmail?: string;
    durationMonths: number;
    monthlyFunding: number;
    deliverables: string[];
    reportingRequirements: string[];
    status: GrantOfferStatus;
    createdAt: string;
};

export type GrantAgreement = {
    id: string;
    grantOfferId: string;
    projectId: string;
    granteeName: string;
    granteeEmail: string;
    signatureName: string;
    signedAt: string;
    status: GrantAgreementStatus;
};

export type DashboardProfile = {
    id: string;
    projectId: string;
    grantAgreementId: string;
    granteeEmail: string;
    nextReportDue: string;
    activeMonth: number;
    fundingStatus: DashboardFundingStatus;
    status: DashboardProfileStatus;
};

export type MonthlyReport = {
    id: string;
    projectId: string;
    grantAgreementId: string;
    dashboardProfileId: string;
    monthNumber: number;
    dueDate: string;
    submittedAt?: string;
    status: MonthlyReportStatus;
    narrative: string;
    attachments: string[];
};

export type FundingMilestone = {
    id: string;
    projectId: string;
    grantAgreementId: string;
    monthNumber: number;
    amount: number;
    releaseStatus: FundingReleaseStatus;
    releasedAt?: string;
};
