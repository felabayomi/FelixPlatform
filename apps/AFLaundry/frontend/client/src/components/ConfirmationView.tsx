import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, Clock, MapPin, Mail, Phone, Package, Droplet } from "lucide-react";
import type { Appointment } from "@shared/schema";

interface ConfirmationViewProps {
  booking: Appointment;
  onNewBooking: () => void;
}

export default function ConfirmationView({ booking, onNewBooking }: ConfirmationViewProps) {
  const referenceNumber = booking.id.substring(0, 8).toUpperCase();

  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-chart-2/10 rounded-full mb-4">
            <CheckCircle2 className="w-8 h-8 text-chart-2" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground">Your laundry service has been scheduled</p>
          <div className="mt-4 inline-block px-4 py-2 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">Reference Number: </span>
            <span className="font-mono font-bold" data-testid="text-reference-number">{referenceNumber}</span>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Appointment Details
            </h3>
            <div className="grid sm:grid-cols-2 gap-4 ml-7">
              <div>
                <p className="text-sm text-muted-foreground">Drop-off</p>
                <p className="font-medium" data-testid="text-dropoff-details">
                  {booking.dropoffDate} at {booking.dropoffTime}
                </p>
              </div>
              {booking.pickupDate && booking.pickupTime && (
                <div>
                  <p className="text-sm text-muted-foreground">Pickup</p>
                  <p className="font-medium" data-testid="text-pickup-details">
                    {booking.pickupDate} at {booking.pickupTime}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Contact Information
            </h3>
            <div className="space-y-2 ml-7">
              <p data-testid="text-customer-name">{booking.customerName}</p>
              <p className="text-sm text-muted-foreground" data-testid="text-customer-email">{booking.customerEmail}</p>
              <p className="text-sm text-muted-foreground" data-testid="text-customer-phone">{booking.customerPhone}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Droplet className="w-5 h-5 text-primary" />
              Soap Type
            </h3>
            <p className="ml-7" data-testid="text-soap-type">{booking.soapType}</p>
          </div>

          {booking.hasHeavyItems && booking.heavyItemsCount && (
            <div>
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-chart-3" />
                Heavy Items
              </h3>
              <p className="ml-7" data-testid="text-heavy-items">
                {booking.heavyItemsCount} item{booking.heavyItemsCount > 1 ? 's' : ''} 
                <span className="text-muted-foreground ml-2">(${booking.heavyItemsCount * 20} surcharge)</span>
              </p>
            </div>
          )}

          {booking.specialInstructions && (
            <div>
              <h3 className="font-semibold mb-2">Special Instructions</h3>
              <p className="text-muted-foreground" data-testid="text-special-instructions">{booking.specialInstructions}</p>
            </div>
          )}
        </div>
      </Card>

      <Card className="p-6 bg-primary/5 border-primary/20">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Location
        </h3>
        <p className="mb-2">A & F Laundry Service</p>
        <p className="text-sm text-muted-foreground">
          EasyDesk by City Discoverer<br />
          50 Stately St, Suite 2<br />
          Wiley Ford, WV 26767
        </p>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={onNewBooking} 
          className="flex-1"
          data-testid="button-new-booking"
        >
          Book Another Appointment
        </Button>
        <Button 
          variant="outline" 
          className="flex-1"
          onClick={() => window.print()}
          data-testid="button-print"
        >
          Print Confirmation
        </Button>
      </div>
    </div>
  );
}
