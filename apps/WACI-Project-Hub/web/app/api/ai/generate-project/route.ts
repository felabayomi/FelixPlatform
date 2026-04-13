import { NextResponse } from "next/server";

const template = {
    type: "Wildlife Hazard Control",
    requiredDeliverables: [
        "Daily field logs",
        "Monthly report",
        "Photo documentation",
    ],
};

const OPENAI_KEY =
    process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;

export async function POST(req: Request) {
    const { input, section, current } = await req.json();

    const basePrompt = `
You are designing a WACI conservation project.

STRICT RULES:
- One project = one grantee
- Monthly funding model
- Must include reporting + deliverables
- Must be practical and field-executable
- Keep scope small and realistic
- Max 5 objectives
- Max 6 deliverables
- Reporting must include: daily logs, monthly report, final report
- Monthly funding must be realistic for pilot scale: between $100 and $500

Follow this template strictly:
${JSON.stringify(template)}

Return ONLY JSON in this format:

{
  "title": "",
  "location": "",
  "summary": "",
  "focus": "",
    "durationMonths": 12,
    "monthlyFunding": 300,
  "objectives": [],
  "deliverables": [],
  "methodology": [],
    "reportingRequirements": []
}

User input:
${input}
`;

    const sectionPrompt = section
        ? `
Regenerate ONLY this section: ${section}

Current project JSON:
${JSON.stringify(current || {}, null, 2)}

Return ONLY a JSON object with one key named exactly "${section}".
Examples:
{"${section}": []}
or
{"${section}": "..."}
`
        : "";

    const prompt = `${basePrompt}\n${sectionPrompt}`;

    if (!OPENAI_KEY) {
        return NextResponse.json(
            { error: "Missing OpenAI API key" },
            { status: 500 }
        );
    }

    const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${OPENAI_KEY}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model: "gpt-5.3",
            input: prompt,
        }),
    });

    const data = await res.json();

    const text = data.output[0].content[0].text;

    return NextResponse.json(JSON.parse(text));
}
