import { useState } from "react";
import Hero from "@/components/Hero";
import PricingInfo from "@/components/PricingInfo";
import BookingForm, { type BookingFormData } from "@/components/BookingForm";
import ConfirmationView from "@/components/ConfirmationView";
import LocationInfo from "@/components/LocationInfo";
import ThemeToggle from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";
import logoImage from "@assets/image_1759927814809.png";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Appointment } from "@shared/schema";

export default function Home() {
  const [showBooking, setShowBooking] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);
  const { toast } = useToast();

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: BookingFormData) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return await res.json() as Appointment;
    },
    onSuccess: (appointment) => {
      setConfirmedBooking(appointment);
      setTimeout(() => {
        document.getElementById('confirmation-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
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

  const handleBookNow = () => {
    setShowBooking(true);
    setTimeout(() => {
      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleBookingSubmit = (data: BookingFormData) => {
    createAppointmentMutation.mutate(data);
  };

  const handleNewBooking = () => {
    setConfirmedBooking(null);
    setShowBooking(true);
    setTimeout(() => {
      document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
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
              {!showBooking && !confirmedBooking && (
                <Button onClick={handleBookNow} data-testid="button-book-now-header">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Schedule Now</span>
                  <span className="sm:hidden">Schedule</span>
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <main>
        <Hero onBookNow={handleBookNow} />
        <PricingInfo />

        {showBooking && !confirmedBooking && (
          <section id="booking-section" className="py-16 bg-muted/30">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
              <BookingForm onSubmit={handleBookingSubmit} />
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

        <LocationInfo />
      </main>

      <footer className="bg-card border-t border-card-border py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm text-muted-foreground">
          <p>© 2026 A & F Laundry Service. All rights reserved.</p>
          <p className="mt-2">Professional wash, dry, and fold service in Wiley Ford, WV</p>
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
