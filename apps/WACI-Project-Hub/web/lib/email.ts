/**
 * Server-only email utility for WACI Project Hub.
 * Uses WACI_RESEND_API_KEY, falling back to RESEND_API_KEY (shared platform key).
 * Never import this in client components.
 */

const API_KEY = process.env.WACI_RESEND_API_KEY || process.env.RESEND_API_KEY;
const FROM_EMAIL =
    process.env.WACI_RESEND_FROM_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    "WACI Project Hub <onboarding@resend.dev>";

export async function sendApprovalEmail(email: string, volunteerName?: string): Promise<void> {
    if (!API_KEY) {
        console.warn("[WACI email] No API key configured — skipping approval email.");
        return;
    }

    await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({
            from: FROM_EMAIL,
            to: email,
            subject: "Report Approved — Next Funding Released",
            text: [
                `Hi ${volunteerName || "Volunteer"},`,
                "",
                "Your monthly report has been approved.",
                "Your next payment has been queued for release.",
                "",
                "Thank you for your continued service.",
                "— WACI Project Hub",
            ].join("\n"),
        }),
    });
}

export async function sendEmail({
    to,
    subject,
    text,
    html,
}: {
    to: string;
    subject: string;
    text: string;
    html?: string;
}): Promise<void> {
    if (!API_KEY) {
        console.warn("[WACI email] No API key configured — skipping email.");
        return;
    }

    await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ from: FROM_EMAIL, to, subject, text, html }),
    });
}
