import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calendar, CheckCircle2, FileText } from "lucide-react";
import Hero from "@/components/Hero";
import PricingInfo from "@/components/PricingInfo";
import BookingForm, { type BookingFormData } from "@/components/BookingForm";
import QuoteForm, { type QuoteFormData } from "@/components/QuoteForm";
import ConfirmationView from "@/components/ConfirmationView";
import LocationInfo from "@/components/LocationInfo";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@shared/schema";
import logoImage from "@assets/image_1759927814809.png";

interface QuoteSubmissionResult {
  id?: string;
  status?: string;
  admin_email_sent?: boolean;
  customer_email_sent?: boolean;
  customer_email_recipient?: string | null;
}

type ServiceFlow = "booking" | "quote" | null;

export default function Home() {
  const [activeFlow, setActiveFlow] = useState<ServiceFlow>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const [submittedQuote, setSubmittedQuote] = useState<QuoteSubmissionResult | null>(null);
  const { toast } = useToast();

  const scrollToSection = (sectionId: string) => {
    setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return await res.json() as Appointment;
    },
    onSuccess: (appointment) => {
      setConfirmedBooking(appointment);
      setSubmittedQuote(null);
      setActiveFlow(null);
      scrollToSection("confirmation-section");
      toast({
        title: "Booking Confirmed!",
        description: "Your appointment has been scheduled successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Booking Failed",
        description: "There was an error scheduling your appointment. Please try again.",
        variant: "destructive",
      });
    },
  });

  const createQuoteMutation = useMutation({
    mutationFn: async (data: QuoteFormData) => {
      const res = await apiRequest("POST", "/api/quotes", data);
      return await res.json() as QuoteSubmissionResult;
    },
    onSuccess: (quoteResult) => {
      setSubmittedQuote(quoteResult);
      setConfirmedBooking(null);
      setActiveFlow(null);
      scrollToSection("quote-confirmation-section");
      toast({
        title: "Quote Request Received!",
        description: "We’ll review your laundry request and contact you shortly.",
      });
    },
    onError: () => {
      toast({
        title: "Quote Request Failed",
        description: "We couldn’t submit your quote request right now. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleBookNow = () => {
    setActiveFlow("booking");
    setConfirmedBooking(null);
    setSubmittedQuote(null);
    scrollToSection("service-request-section");
  };

  const handleRequestQuote = () => {
    setActiveFlow("quote");
    setConfirmedBooking(null);
    setSubmittedQuote(null);
    scrollToSection("service-request-section");
  };

  const handleBookingSubmit = (data: BookingFormData) => {
    createAppointmentMutation.mutate(data);
  };

  const handleQuoteSubmit = (data: QuoteFormData) => {
    createQuoteMutation.mutate(data);
  };

  const handleNewBooking = () => {
    setConfirmedBooking(null);
    setSubmittedQuote(null);
    setActiveFlow("booking");
    scrollToSection("service-request-section");
  };

  const handleNewQuote = () => {
    setConfirmedBooking(null);
    setSubmittedQuote(null);
    setActiveFlow("quote");
    scrollToSection("service-request-section");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4 gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <img
                src={logoImage}
                alt="A & F Laundry Service"
                className="h-32 w-auto mix-blend-darken dark:mix-blend-lighten"
              />
              <div className="hidden lg:flex items-center gap-4 text-sm text-muted-foreground">
                <a href="https://felixplatforms.com/" className="hover:text-foreground transition-colors">Felix Platform</a>
                <a href="https://felixstore.felixplatforms.com/" className="hover:text-foreground transition-colors">Felix Store</a>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!confirmedBooking && !submittedQuote && (
                <>
                  <Button
                    variant={activeFlow === "booking" ? "default" : "outline"}
                    onClick={handleBookNow}
                    data-testid="button-book-now-header"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Schedule</span>
                  </Button>
                  <Button
                    variant={activeFlow === "quote" ? "default" : "outline"}
                    onClick={handleRequestQuote}
                    data-testid="button-request-quote-header"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    <span className="hidden sm:inline">Request Quote</span>
                    <span className="sm:hidden">Quote</span>
                  </Button>
                </>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main>
        <Hero onBookNow={handleBookNow} onRequestQuote={handleRequestQuote} />
        <PricingInfo />

        {activeFlow && !confirmedBooking && !submittedQuote && (
          <section id="service-request-section" className="py-16 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex flex-col sm:flex-row justify-center gap-3 mb-8">
                <Button variant={activeFlow === "booking" ? "default" : "outline"} onClick={handleBookNow}>
                  <Calendar className="w-4 h-4 mr-2" />
                  Book Laundry
                </Button>
                <Button variant={activeFlow === "quote" ? "default" : "outline"} onClick={handleRequestQuote}>
                  <FileText className="w-4 h-4 mr-2" />
                  Request a Quote
                </Button>
              </div>

              {activeFlow === "booking" ? (
                <BookingForm onSubmit={handleBookingSubmit} />
              ) : (
                <QuoteForm onSubmit={handleQuoteSubmit} isSubmitting={createQuoteMutation.isPending} />
              )}
            </div>
          </section>
        )}

        {confirmedBooking && (
          <section id="confirmation-section" className="py-16 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <ConfirmationView booking={confirmedBooking} onNewBooking={handleNewBooking} />
            </div>
          </section>
        )}

        {submittedQuote && (
          <section id="quote-confirmation-section" className="py-16 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="p-6 sm:p-8 text-center space-y-6">
                <div className="flex justify-center">
                  <div className="rounded-full bg-primary/10 p-3">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Quote Request Received</h3>
                  <p className="text-muted-foreground">
                    We’ve received your A&F Laundry quote request and will contact you shortly with next steps.
                  </p>
                </div>

                <div className="rounded-lg bg-muted/50 p-4 text-sm text-left space-y-2">
                  <p><strong>Request Reference:</strong> {submittedQuote.id ? submittedQuote.id.substring(0, 8).toUpperCase() : "Pending"}</p>
                  <p><strong>Admin Notification:</strong> {submittedQuote.admin_email_sent ? "Sent" : "Queued / pending"}</p>
                  <p><strong>Customer Confirmation:</strong> {submittedQuote.customer_email_sent ? `Sent to ${submittedQuote.customer_email_recipient || "your email"}` : "Queued / pending"}</p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button onClick={handleNewQuote}>Request Another Quote</Button>
                  <Button variant="outline" onClick={handleBookNow}>Book a Drop-off Instead</Button>
                </div>
              </Card>
            </div>
          </section>
        )}

        <LocationInfo />
      </main>

      <footer className="bg-card border-t border-card-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© 2026 A & F Laundry Service. All rights reserved.</p>
          <p className="mt-2">Professional wash, dry, fold, and quote-based laundry service in Wiley Ford, WV</p>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-4">
            <a href="https://felixplatforms.com/" className="hover:text-foreground transition-colors">Felix Platform</a>
            <a href="https://felixstore.felixplatforms.com/" className="hover:text-foreground transition-colors">Felix Store</a>
            <a href="https://admin.felixplatforms.com/" className="hover:text-foreground transition-colors">Admin</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
