import { useEffect, useState } from "react";
import { useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, MapPin, Phone, Mail } from "lucide-react";
import type { Appointment } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function Reschedule() {
  const [, params] = useRoute("/reschedule/:token");
  const token = params?.token;
  const { toast } = useToast();

  const [dropoffDate, setDropoffDate] = useState("");
  const [dropoffTime, setDropoffTime] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const { data: appointment, isLoading } = useQuery<Appointment>({
    queryKey: ["/api/reschedule", token],
    enabled: !!token,
  });

  useEffect(() => {
    if (appointment) {
      setDropoffDate(appointment.dropoffDate);
      setDropoffTime(appointment.dropoffTime);
      setPickupDate(appointment.pickupDate || "");
      setPickupTime(appointment.pickupTime || "");
    }
  }, [appointment]);

  const rescheduleMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/reschedule/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dropoffDate,
          dropoffTime,
          pickupDate: pickupDate || null,
          pickupTime: pickupTime || null,
        }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to reschedule");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Appointment Rescheduled!",
        description: "You will receive a confirmation email shortly.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Reschedule Failed",
        description: error.message || "Cannot reschedule within 6 hours of appointment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    rescheduleMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div>Loading...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-destructive">Invalid Link</CardTitle>
            <CardDescription>
              This reschedule link is invalid or has expired. Please contact us directly.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4" />
              <span>240-664-2270</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span>aflaundryservice@gmail.com</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Reschedule Appointment</h1>
          <p className="text-muted-foreground">
            Reference: {appointment.id.substring(0, 8).toUpperCase()}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Current Appointment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="font-medium">Drop-off:</span>
                <span>{appointment.dropoffDate} at {appointment.dropoffTime}</span>
              </div>
              {appointment.pickupDate && appointment.pickupTime && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">Pickup:</span>
                  <span>{appointment.pickupDate} at {appointment.pickupTime}</span>
                </div>
              )}
              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  ⚠️ Cannot reschedule within 6 hours of appointment
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>New Date & Time</CardTitle>
              <CardDescription>Select new appointment times</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="dropoffDate">Drop-off Date</Label>
                  <Input
                    id="dropoffDate"
                    type="date"
                    value={dropoffDate}
                    onChange={(e) => setDropoffDate(e.target.value)}
                    required
                    data-testid="input-reschedule-dropoff-date"
                  />
                </div>

                <div>
                  <Label htmlFor="dropoffTime">Drop-off Time</Label>
                  <Input
                    id="dropoffTime"
                    type="time"
                    value={dropoffTime}
                    onChange={(e) => setDropoffTime(e.target.value)}
                    required
                    data-testid="input-reschedule-dropoff-time"
                  />
                </div>

                {appointment.pickupDate && (
                  <>
                    <div>
                      <Label htmlFor="pickupDate">Pickup Date (Optional)</Label>
                      <Input
                        id="pickupDate"
                        type="date"
                        value={pickupDate}
                        onChange={(e) => setPickupDate(e.target.value)}
                        data-testid="input-reschedule-pickup-date"
                      />
                    </div>

                    <div>
                      <Label htmlFor="pickupTime">Pickup Time (Optional)</Label>
                      <Input
                        id="pickupTime"
                        type="time"
                        value={pickupTime}
                        onChange={(e) => setPickupTime(e.target.value)}
                        data-testid="input-reschedule-pickup-time"
                      />
                    </div>
                  </>
                )}

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={rescheduleMutation.isPending}
                  data-testid="button-confirm-reschedule"
                >
                  {rescheduleMutation.isPending ? "Rescheduling..." : "Confirm Reschedule"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">A & F Laundry Service</p>
            <p className="text-muted-foreground">50 Stately St, Suite 2</p>
            <p className="text-muted-foreground">Wiley Ford, WV 26767</p>
            <div className="mt-4 flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>240-664-2270</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span>9am - 6pm daily</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
