import { BarChart3 } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-muted/30">
      <div className="max-w-7xl mx-auto px-6 py-12 lg:px-8">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Campaign Intelligence</span>
            </div>
            <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
              Professional polling and research services for political campaigns.
              Data-driven insights and strategic intelligence to power campaign
              success across all parties and races.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#services" className="hover:text-foreground transition-colors">
                  Voter Modeling
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-foreground transition-colors">
                  Focus Groups
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-foreground transition-colors">
                  Polling Coordination
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-foreground transition-colors">
                  Voter File Analysis
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <a href="#case-studies" className="hover:text-foreground transition-colors">
                  Case Studies
                </a>
              </li>
              <li>
                <a href="#insights" className="hover:text-foreground transition-colors">
                  Insights
                </a>
              </li>
              <li>
                <a href="#contact" className="hover:text-foreground transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <a href="/dashboard" className="hover:text-foreground transition-colors">
                  Client Portal
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Campaign Intelligence Solutions. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="hover:text-foreground transition-colors">
              Terms of Service
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
