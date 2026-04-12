import { Shield, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen">
      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-background py-16">
        <div className="max-w-4xl mx-auto px-4">
          <Link href="/">
            <Button variant="outline" className="mb-6" data-testid="button-return-home">
              <Home className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </Link>
          <div className="flex items-center justify-center gap-3 mb-4">
            <Shield className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>
          <p className="text-center text-lg text-muted-foreground">
            Last updated: November 7, 2024
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Introduction</h2>
            <p className="text-muted-foreground mb-4">
              City Discoverer, operated by Expedition America Travel Co. ("we," "our," or "us"), is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our tour booking services.
            </p>
            <p className="text-muted-foreground">
              By using our services, you agree to the collection and use of information in accordance with this policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Personal Information</h3>
            <p className="text-muted-foreground mb-3">
              When you sign up for tours or use our services, we may collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Full name</li>
              <li>Email address</li>
              <li>Phone number</li>
              <li>Travel preferences and interests</li>
              <li>Payment information (processed securely through third-party payment providers)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Automatically Collected Information</h3>
            <p className="text-muted-foreground mb-3">
              When you visit our website, we automatically collect:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Browser type and version</li>
              <li>Operating system</li>
              <li>IP address</li>
              <li>Pages visited and time spent on pages</li>
              <li>Referring website addresses</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">How We Use Your Information</h2>
            <p className="text-muted-foreground mb-3">
              We use the information we collect to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Process your tour bookings and registrations</li>
              <li>Send you confirmation emails and tour information</li>
              <li>Respond to your inquiries and provide customer support</li>
              <li>Send newsletters and marketing communications (with your consent)</li>
              <li>Improve our website and services</li>
              <li>Comply with legal obligations</li>
              <li>Prevent fraud and ensure security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Information Sharing and Disclosure</h2>
            <p className="text-muted-foreground mb-4">
              We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
            </p>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Service Providers</h3>
            <p className="text-muted-foreground mb-4">
              We may share information with trusted third-party service providers who assist us in operating our website, conducting our business, or servicing you (e.g., payment processors, email service providers). These parties are obligated to keep your information confidential.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Legal Requirements</h3>
            <p className="text-muted-foreground mb-4">
              We may disclose your information if required by law or in response to valid requests by public authorities.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Business Transfers</h3>
            <p className="text-muted-foreground">
              In the event of a merger, acquisition, or sale of assets, your information may be transferred. We will notify you before your information becomes subject to a different privacy policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Data Security</h2>
            <p className="text-muted-foreground mb-4">
              We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. These measures include:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Secure SSL encryption for data transmission</li>
              <li>Regular security assessments</li>
              <li>Limited access to personal information by employees and contractors</li>
              <li>Secure database storage</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
            <p className="text-muted-foreground mb-3">
              You have the right to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
              <li><strong>Deletion:</strong> Request deletion of your personal information</li>
              <li><strong>Object:</strong> Object to processing of your personal information</li>
              <li><strong>Withdraw consent:</strong> Withdraw consent for marketing communications at any time</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              To exercise these rights, please contact us at discoverercity@gmail.com.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Cookies and Tracking Technologies</h2>
            <p className="text-muted-foreground mb-4">
              We use cookies and similar tracking technologies to improve your browsing experience, analyze website traffic, and understand where our visitors are coming from. You can control cookie settings through your browser preferences.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Third-Party Links</h2>
            <p className="text-muted-foreground">
              Our website may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. We encourage you to read the privacy policies of any third-party sites you visit.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Children's Privacy</h2>
            <p className="text-muted-foreground">
              Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Changes to This Privacy Policy</h2>
            <p className="text-muted-foreground">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
            <p className="text-muted-foreground mb-3">
              If you have any questions about this Privacy Policy, please contact us:
            </p>
            <div className="bg-card p-6 rounded-md border">
              <p className="text-muted-foreground mb-2">
                <strong>Email:</strong> discoverercity@gmail.com
              </p>
              <p className="text-muted-foreground">
                <strong>Company:</strong> Expedition America Travel Co. (City Discoverer)
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
