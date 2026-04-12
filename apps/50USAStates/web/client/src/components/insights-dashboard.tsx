import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Pie,
  PieChart,
  Cell,
} from "recharts";

const pollingTrends = [
  { month: "Jan", support: 42, opposition: 38, undecided: 20 },
  { month: "Feb", support: 44, opposition: 37, undecided: 19 },
  { month: "Mar", support: 46, opposition: 36, undecided: 18 },
  { month: "Apr", support: 48, opposition: 35, undecided: 17 },
  { month: "May", support: 51, opposition: 34, undecided: 15 },
  { month: "Jun", support: 52, opposition: 33, undecided: 15 },
];

const demographics = [
  { age: "18-29", percentage: 68 },
  { age: "30-44", percentage: 58 },
  { age: "45-64", percentage: 52 },
  { age: "65+", percentage: 45 },
];

const voterSegments = [
  { name: "Strong Support", value: 32, color: "hsl(var(--chart-1))" },
  { name: "Lean Support", value: 24, color: "hsl(var(--chart-2))" },
  { name: "Undecided", value: 18, color: "hsl(var(--chart-3))" },
  { name: "Lean Opposition", value: 14, color: "hsl(var(--chart-4))" },
  { name: "Strong Opposition", value: 12, color: "hsl(var(--chart-5))" },
];

export function InsightsDashboard() {
  return (
    <section id="insights" className="py-24">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl lg:text-4xl font-semibold mb-4">
            Sample Insights Dashboard
          </h2>
          <p className="text-lg text-muted-foreground">
            Demonstrating our analytical capabilities with sample polling data
            and voter research visualizations.
          </p>
          <p className="text-sm text-muted-foreground mt-2 italic">
            All data shown is for demonstration purposes only
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <Card data-testid="card-polling-trends">
            <CardHeader>
              <CardTitle>Polling Trend Analysis</CardTitle>
              <CardDescription>
                Six-month tracking poll showing support evolution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pollingTrends}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="month"
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="support"
                    stroke="hsl(var(--chart-1))"
                    strokeWidth={2}
                    name="Support"
                  />
                  <Line
                    type="monotone"
                    dataKey="opposition"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    name="Opposition"
                  />
                  <Line
                    type="monotone"
                    dataKey="undecided"
                    stroke="hsl(var(--chart-4))"
                    strokeWidth={2}
                    name="Undecided"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-voter-segments">
            <CardHeader>
              <CardTitle>Voter Segmentation</CardTitle>
              <CardDescription>
                Distribution across support levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={voterSegments}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.name}: ${entry.value}%`}
                    labelLine={false}
                  >
                    {voterSegments.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card data-testid="card-demographics" className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Demographic Performance</CardTitle>
              <CardDescription>
                Support levels across age groups
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={demographics}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis
                    dataKey="age"
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis
                    fontSize={12}
                    stroke="hsl(var(--muted-foreground))"
                    label={{
                      value: "Support %",
                      angle: -90,
                      position: "insideLeft",
                    }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "6px",
                    }}
                  />
                  <Bar
                    dataKey="percentage"
                    fill="hsl(var(--chart-1))"
                    radius={[4, 4, 0, 0]}
                    name="Support %"
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
