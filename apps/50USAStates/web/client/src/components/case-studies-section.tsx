import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight } from "lucide-react";

const caseStudies = [
  {
    title: "Statewide Senate Campaign",
    category: "Senate",
    challenge:
      "Candidate polling 8 points behind incumbent with high name recognition deficit in rural districts.",
    approach:
      "Implemented targeted voter modeling to identify persuadable voters. Conducted focus groups in key counties to refine messaging. Deployed micro-targeted digital campaigns based on voter file analysis.",
    results:
      "Closed the gap to 2 points within 10 weeks. Increased rural support by 12 percentage points. Campaign won by 3.5% margin.",
    metrics: ["+15% Rural Turnout", "52.5% Final Vote", "94% Name Recognition"],
  },
  {
    title: "Congressional District Race",
    category: "House",
    challenge:
      "Competitive open seat with fragmented electorate and unclear issue priorities across diverse suburban communities.",
    approach:
      "Executed comprehensive polling program with weekly tracking. Coordinated focus groups across demographic segments. Built predictive models for turnout optimization.",
    results:
      "Identified winning issue coalition. Optimized field operations for maximum efficiency. Secured victory in a 50-50 district.",
    metrics: ["+8% Suburban Women", "51.2% Victory Margin", "18% Higher Turnout"],
  },
  {
    title: "Municipal Mayoral Campaign",
    category: "Local",
    challenge:
      "First-time candidate in crowded primary field with limited budget and resources.",
    approach:
      "Leveraged voter file analysis to maximize limited resources. Conducted cost-effective online polling. Developed data-driven canvassing lists prioritizing high-value contacts.",
    results:
      "Won 5-way primary with 38% of vote. Reduced cost-per-contact by 40%. Built foundation for general election victory.",
    metrics: ["38% Primary Win", "-40% Cost Efficiency", "62% General Victory"],
  },
  {
    title: "Ballot Initiative Campaign",
    category: "Initiative",
    challenge:
      "Complex policy issue requiring voter education and coalition building across partisan divides.",
    approach:
      "Deployed message testing through extensive focus groups. Created voter education models based on demographic analysis. Tracked opinion evolution with bi-weekly polling.",
    results:
      "Built bipartisan coalition of support. Increased awareness from 32% to 78%. Initiative passed with 58% support.",
    metrics: ["+46% Awareness", "58% Passage Rate", "Bipartisan Support"],
  },
];

export function CaseStudiesSection() {
  return (
    <section id="case-studies" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-semibold mb-4">
            Proven Track Record
          </h2>
          <p className="text-lg text-muted-foreground">
            Case studies demonstrating our strategic approach and measurable
            impact across diverse campaign types.
          </p>
          <p className="text-sm text-muted-foreground mt-2 italic">
            Client details anonymized for confidentiality
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {caseStudies.map((study, index) => (
            <Card
              key={index}
              className="hover-elevate transition-all duration-200"
              data-testid={`card-case-study-${index}`}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <Badge className="mb-3">{study.category}</Badge>
                    <CardTitle className="text-xl mb-2">{study.title}</CardTitle>
                  </div>
                  <ArrowUpRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                    Challenge
                  </h4>
                  <p className="text-sm leading-relaxed">{study.challenge}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                    Approach
                  </h4>
                  <p className="text-sm leading-relaxed">{study.approach}</p>
                </div>

                <div>
                  <h4 className="font-semibold mb-2 text-sm text-muted-foreground uppercase tracking-wide">
                    Results
                  </h4>
                  <p className="text-sm leading-relaxed mb-3">{study.results}</p>
                  <div className="flex flex-wrap gap-2">
                    {study.metrics.map((metric, idx) => (
                      <Badge key={idx} variant="secondary" className="font-mono text-xs">
                        {metric}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
