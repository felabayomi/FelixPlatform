import { FileText, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Terms() {
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
            <FileText className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>
          <p className="text-center text-lg text-muted-foreground">
            Last updated: November 7, 2024
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="prose prose-slate max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Agreement to Terms</h2>
            <p className="text-muted-foreground mb-4">
              These Terms of Service ("Terms") constitute a legally binding agreement between you and Expedition America Travel Co., operating as City Discoverer ("Company," "we," "us," or "our"), concerning your access to and use of our website and tour services.
            </p>
            <p className="text-muted-foreground">
              By accessing or using our services, you agree to be bound by these Terms. If you disagree with any part of these Terms, you may not access our services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Tour Bookings and Reservations</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Registration</h3>
            <p className="text-muted-foreground mb-4">
              When you register for a tour, you agree to provide accurate, current, and complete information. You are responsible for maintaining the confidentiality of your booking information and for all activities that occur under your registration.
            </p>

            <h3 className="text-xl font-semibold mb-3 mt-6">Payment Terms</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>A deposit is required at the time of booking to secure your spot</li>
              <li>Full payment is due 45 days prior to the tour start date</li>
              <li>Failure to pay the balance by the due date may result in cancellation of your reservation</li>
              <li>All prices are in USD unless otherwise stated</li>
              <li>Prices are subject to change until payment is received in full</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Tour Capacity</h3>
            <p className="text-muted-foreground">
              Tours have limited capacity. Registrations are accepted on a first-come, first-served basis. We reserve the right to close registration once capacity is reached.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Cancellations and Refunds</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Cancellation by Participant</h3>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li><strong>60+ days before tour:</strong> Full refund minus $50 administrative fee</li>
              <li><strong>30-59 days before tour:</strong> 50% refund</li>
              <li><strong>Less than 30 days before tour:</strong> No refund; transfer to another tour available</li>
              <li><strong>No-shows:</strong> No refund or credit</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Cancellation by Company</h3>
            <p className="text-muted-foreground mb-4">
              We reserve the right to cancel any tour due to insufficient enrollment, force majeure, or other circumstances beyond our control. In such cases:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>You will receive a full refund of all payments made</li>
              <li>We will notify you at least 14 days prior to the tour start date when possible</li>
              <li>We are not responsible for any additional costs you may have incurred (e.g., flights, accommodations)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Tour Participant Responsibilities</h2>
            <p className="text-muted-foreground mb-3">
              As a tour participant, you agree to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Arrive on time for all scheduled activities</li>
              <li>Follow instructions from tour guides and respect local laws and customs</li>
              <li>Treat fellow participants, guides, and locals with respect</li>
              <li>Not engage in illegal activities or behavior that endangers yourself or others</li>
              <li>Inform us of any medical conditions, dietary restrictions, or accessibility needs in advance</li>
              <li>Purchase appropriate travel insurance</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Limitation of Liability</h2>
            
            <h3 className="text-xl font-semibold mb-3 mt-6">Tour Services</h3>
            <p className="text-muted-foreground mb-4">
              City Discoverer acts as an intermediary between participants and tour service providers. While we carefully select our partners and guides, we are not liable for:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
              <li>Acts or omissions of third-party service providers</li>
              <li>Personal injury, illness, death, or property damage</li>
              <li>Loss, theft, or damage to personal belongings</li>
              <li>Delays or changes to tour itineraries due to weather, strikes, or other unforeseen circumstances</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 mt-6">Maximum Liability</h3>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, our total liability to you for any claims arising from your use of our services shall not exceed the amount you paid for the specific tour in question.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Travel Insurance</h2>
            <p className="text-muted-foreground">
              We strongly recommend that all participants purchase comprehensive travel insurance covering trip cancellation, medical expenses, emergency evacuation, and personal liability. Travel insurance is your responsibility and is not included in the tour price.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Photography and Media</h2>
            <p className="text-muted-foreground">
              By participating in our tours, you consent to being photographed or filmed for promotional purposes. If you object to being included in promotional materials, please inform us in writing before the tour begins.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
            <p className="text-muted-foreground mb-4">
              All content on our website, including text, graphics, logos, images, and software, is the property of Expedition America Travel Co. or its content suppliers and is protected by copyright and other intellectual property laws.
            </p>
            <p className="text-muted-foreground">
              You may not reproduce, distribute, modify, or create derivative works from any content without our express written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Prohibited Conduct</h2>
            <p className="text-muted-foreground mb-3">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
              <li>Use our services for any illegal purpose</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Interfere with or disrupt our services or servers</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Impersonate any person or entity</li>
              <li>Harass, abuse, or harm other participants or guides</li>
              <li>Submit false or misleading information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Dispute Resolution</h2>
            <p className="text-muted-foreground mb-4">
              Any disputes arising from these Terms or your use of our services will first be addressed through good-faith negotiation. If negotiation fails, disputes will be resolved through binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>
            <p className="text-muted-foreground">
              You waive any right to participate in class action lawsuits or class-wide arbitration.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
            <p className="text-muted-foreground">
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
            <p className="text-muted-foreground">
              We reserve the right to modify these Terms at any time. Changes will be effective immediately upon posting to our website. Your continued use of our services after changes are posted constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Severability</h2>
            <p className="text-muted-foreground">
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
            <p className="text-muted-foreground mb-3">
              If you have any questions about these Terms of Service, please contact us:
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

          <section className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Acknowledgment</h2>
            <p className="text-muted-foreground">
              By using our services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
