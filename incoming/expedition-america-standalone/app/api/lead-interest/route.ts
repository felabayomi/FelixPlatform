import { NextResponse } from "next/server";
import { appendFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

type LeadPayload = {
  fullName?: string;
  email?: string;
  cityOfInterest?: string;
  travelDates?: string;
  experienceType?: string;
  additionalNotes?: string;
};

async function saveLeadToSupabase(leadRecord: {
  timestamp: string;
  source: string;
  name: string;
  email: string;
  city: string;
  dates: string;
  experience: string;
  notes: string;
  backup_reason?: string;
}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const leadsTable = process.env.SUPABASE_LEADS_TABLE ?? "lead_submissions";

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }

  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false },
  });

  const { error } = await supabase.from(leadsTable).insert(leadRecord);

  if (error) {
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as LeadPayload;

    if (!payload.fullName || !payload.email || !payload.cityOfInterest || !payload.experienceType) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const leadRecord = {
      timestamp: new Date().toISOString(),
      source: "events-expression-of-interest",
      name: payload.fullName,
      email: payload.email,
      city: payload.cityOfInterest,
      dates: payload.travelDates ?? "",
      experience: payload.experienceType,
      notes: payload.additionalNotes ?? "",
    };

    let savedToSupabase = false;

    try {
      await saveLeadToSupabase(leadRecord);
      savedToSupabase = true;
    } catch (supabaseError) {
      console.error("Supabase primary save failed", supabaseError);
    }

    const response = await fetch("https://formspree.io/f/xqeywzzq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
      },
      body: JSON.stringify(leadRecord),
      cache: "no-store",
    });

    if (!response.ok) {
      const responseText = await response.text();
      console.error("Formspree error", response.status, responseText);

      if (savedToSupabase) {
        return NextResponse.json({
          ok: true,
          queued: true,
          message: "Lead was saved to Supabase backup.",
        });
      }

      try {
        await saveLeadToSupabase({
          ...leadRecord,
          backup_reason: `formspree-${response.status}`,
        });

        return NextResponse.json({
          ok: true,
          queued: true,
          message: "Lead was saved to Supabase backup.",
        });
      } catch (backupError) {
        console.error("Supabase backup failed", backupError);

        try {
          await appendFile(
            "/tmp/expedition-america-leads-backup.jsonl",
            `${JSON.stringify({ ...leadRecord, backupReason: `formspree-${response.status}` })}\n`,
            "utf8"
          );

          return NextResponse.json({
            ok: true,
            queued: true,
            message: "Lead was saved to emergency backup queue.",
          });
        } catch (emergencyBackupError) {
          console.error("Emergency backup write failed", emergencyBackupError);
          return NextResponse.json(
            { error: "Lead capture failed at destination and backup storage." },
            { status: 502 }
          );
        }
      }
    }

    return NextResponse.json({ ok: true, stored: savedToSupabase });
  } catch (error) {
    console.error("Lead API unexpected error", error);
    return NextResponse.json(
      { error: "Unexpected server error." },
      { status: 500 }
    );
  }
}
