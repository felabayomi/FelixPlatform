export type WaciProject = {
    slug: string;
    title: string;
    location: string;
    status: "Pilot" | "Active" | "Completed";
    summary: string;
    focus: string;
    duration: string;
    monthlyFunding: string;
    objectives: string[];
    deliverables: string[];
};

export const projects: WaciProject[] = [
    {
        slug: "hukia-airport",
        title: "HUKIA Airport Wildlife Hazard Control Unit",
        location: "Katsina, Nigeria",
        status: "Pilot",
        summary:
            "A pilot conservation operations project focused on reducing bird and wildlife strike risk through field observation, logging, reporting, and habitat response support.",
        focus: "Bird/Wildlife Hazard Reduction",
        duration: "12 months",
        monthlyFunding: "$300",
        objectives: [
            "Track wildlife activity near airport operational zones.",
            "Maintain practical field logs and monthly reports.",
            "Support low-cost habitat and risk observations that inform mitigation.",
        ],
        deliverables: [
            "Daily field notebook logs",
            "Monthly narrative report",
            "Monthly photo evidence upload",
            "Final project summary report",
        ],
    },
];

export function getProjectBySlug(slug: string) {
    return projects.find((project) => project.slug === slug);
}
