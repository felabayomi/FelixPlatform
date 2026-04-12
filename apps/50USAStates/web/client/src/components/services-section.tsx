import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, BarChart3, Database, TrendingUp } from "lucide-react";

const services = [
  {
    icon: BarChart3,
    title: "Voter Modeling & Analytics",
    description:
      "Advanced statistical modeling to identify and target key voter segments. Predictive analytics to forecast electoral outcomes and optimize campaign strategy.",
    features: [
      "Demographic segmentation",
      "Predictive modeling",
      "Turnout forecasting",
      "Micro-targeting strategies",
    ],
  },
  {
    icon: Users,
    title: "Focus Group Coordination",
    description:
      "Professional facilitation of focus groups to gather qualitative insights. Understanding voter attitudes, concerns, and messaging effectiveness.",
    features: [
      "Moderator-led sessions",
      "Detailed reporting",
      "Message testing",
      "Video analysis",
    ],
  },
  {
    icon: TrendingUp,
    title: "Polling Firm Partnership",
    description:
      "Coordination with top-tier polling firms for comprehensive survey research. Regular tracking polls and benchmark studies throughout your campaign.",
    features: [
      "Survey design",
      "Data collection",
      "Trend analysis",
      "Competitor tracking",
    ],
  },
  {
    icon: Database,
    title: "Voter File Analysis",
    description:
      "In-depth analysis of voter registration data and historical voting patterns. Custom data appends and enhancement for precision targeting.",
    features: [
      "Data acquisition",
      "File enhancement",
      "Pattern analysis",
      "List generation",
    ],
  },
];

export function ServicesSection() {
  return (
    <section id="services" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-semibold mb-4">
            Comprehensive Research Services
          </h2>
          <p className="text-lg text-muted-foreground">
            Strategic intelligence and data-driven insights to power your
            campaign from launch to election day.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <Card
              key={index}
              className="hover-elevate transition-all duration-200"
              data-testid={`card-service-${index}`}
            >
              <CardHeader className="gap-4">
                <div className="w-12 h-12 rounded-md bg-primary/10 flex items-center justify-center">
                  <service.icon className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-xl">{service.title}</CardTitle>
                <CardDescription className="leading-relaxed">
                  {service.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {service.features.map((feature, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-muted-foreground flex items-center gap-2"
                    >
                      <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
