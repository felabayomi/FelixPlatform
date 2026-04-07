import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { format, addDays } from "date-fns";

interface BookingFormProps {
  onSubmit: (data: BookingFormData) => void;
}

export interface BookingFormData {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  dropoffDate: string;
  dropoffTime: string;
  pickupDate?: string;
  pickupTime?: string;
  soapType: string;
  hasHeavyItems: boolean;
  heavyItemsCount: number;
  specialInstructions?: string;
  schedulePickupLater: boolean;
}

export default function BookingForm({ onSubmit }: BookingFormProps) {
  const [step, setStep] = useState<'dropoff' | 'pickup'>('dropoff');
  const [formData, setFormData] = useState<BookingFormData>({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    dropoffDate: '',
    dropoffTime: '',
    soapType: '',
    hasHeavyItems: false,
    heavyItemsCount: 0,
    schedulePickupLater: false,
  });

  const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
  
  // Calculate minimum pickup date: drop-off date + 1 day (24hr processing time)
  const minPickupDate = formData.dropoffDate 
    ? format(addDays(new Date(formData.dropoffDate), 1), 'yyyy-MM-dd')
    : minDate;
  
  const timeSlots = [
    '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
    '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'
  ];

  const handleDropoffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.schedulePickupLater) {
      onSubmit(formData);
    } else {
      setStep('pickup');
    }
  };

  const handlePickupDateChange = (newPickupDate: string) => {
    // Validate that pickup is at least 24 hours after drop-off
    if (formData.dropoffDate && newPickupDate) {
      const dropoffDateTime = new Date(formData.dropoffDate);
      const pickupDateTime = new Date(newPickupDate);
      const minPickupDateTime = addDays(dropoffDateTime, 1);
      
      if (pickupDateTime < minPickupDateTime) {
        // Clear invalid date and show alert
        setFormData({ ...formData, pickupDate: '' });
        alert('Pickup must be scheduled at least 24 hours after drop-off. Same-day service requires special arrangement.');
        return;
      }
    }
    setFormData({ ...formData, pickupDate: newPickupDate });
  };

  const handleFinalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Final validation before submission
    if (formData.dropoffDate && formData.pickupDate) {
      const dropoffDateTime = new Date(formData.dropoffDate);
      const pickupDateTime = new Date(formData.pickupDate);
      const minPickupDateTime = addDays(dropoffDateTime, 1);
      
      if (pickupDateTime < minPickupDateTime) {
        alert('Pickup must be scheduled at least 24 hours after drop-off. Same-day service requires special arrangement.');
        return;
      }
    }
    
    onSubmit(formData);
  };

  if (step === 'pickup') {
    return (
      <Card className="p-6 sm:p-8">
        <div className="mb-6">
          <h3 className="text-2xl font-bold mb-2">Schedule Pickup</h3>
          <p className="text-muted-foreground">We need 24 hours to process your laundry</p>
        </div>

        <form onSubmit={handleFinalSubmit} className="space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="pickupDate">Pickup Date</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="pickupDate"
                  type="date"
                  min={minPickupDate}
                  value={formData.pickupDate || ''}
                  onChange={(e) => handlePickupDateChange(e.target.value)}
                  className="pl-10"
                  required
                  data-testid="input-pickup-date"
                />
              </div>
              <p className="text-xs text-muted-foreground">Minimum 24 hours after drop-off</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pickupTime">Pickup Time</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <select
                  id="pickupTime"
                  value={formData.pickupTime || ''}
                  onChange={(e) => setFormData({ ...formData, pickupTime: e.target.value })}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  required
                  data-testid="select-pickup-time"
                >
                  <option value="">Select time</option>
                  {timeSlots.map((time) => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep('dropoff')}
              data-testid="button-back"
            >
              Back
            </Button>
            <Button type="submit" className="flex-1" data-testid="button-confirm-booking">
              Confirm Booking
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Card>
    );
  }

  return (
    <Card className="p-6 sm:p-8">
      <div className="mb-6">
        <h3 className="text-2xl font-bold mb-2">Schedule Drop-off</h3>
        <p className="text-muted-foreground">Book your appointment at least 1 day in advance</p>
      </div>

      <form onSubmit={handleDropoffSubmit} className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="John Doe"
              required
              data-testid="input-customer-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.customerPhone}
              onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
              placeholder="240-664-2270"
              required
              data-testid="input-customer-phone"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.customerEmail}
            onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
            placeholder="john@example.com"
            required
            data-testid="input-customer-email"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="soapType">Laundry Soap Type</Label>
          <select
            id="soapType"
            value={formData.soapType}
            onChange={(e) => setFormData({ ...formData, soapType: e.target.value })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            required
            data-testid="select-soap-type"
          >
            <option value="">Select soap type</option>
            <option value="Tide Regular">Tide Regular</option>
            <option value="Tide Hypoallergenic">Tide Hypoallergenic</option>
            <option value="I provide my own">I provide my own</option>
          </select>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="dropoffDate">Drop-off Date</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                id="dropoffDate"
                type="date"
                min={minDate}
                value={formData.dropoffDate}
                onChange={(e) => setFormData({ ...formData, dropoffDate: e.target.value })}
                className="pl-10"
                required
                data-testid="input-dropoff-date"
              />
            </div>
            <p className="text-xs text-muted-foreground">Must be at least 1 day in advance</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dropoffTime">Drop-off Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <select
                id="dropoffTime"
                value={formData.dropoffTime}
                onChange={(e) => setFormData({ ...formData, dropoffTime: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                required
                data-testid="select-dropoff-time"
              >
                <option value="">Select time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            <p className="text-xs text-muted-foreground">Available 9am - 6pm</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="heavyItems"
              checked={formData.hasHeavyItems}
              onCheckedChange={(checked) => 
                setFormData({ 
                  ...formData, 
                  hasHeavyItems: checked === true,
                  heavyItemsCount: checked ? 1 : 0 
                })
              }
              data-testid="checkbox-heavy-items"
            />
            <div className="space-y-1">
              <Label htmlFor="heavyItems" className="font-medium cursor-pointer">
                I have heavy items (duvets, rugs, etc.)
              </Label>
              <p className="text-sm text-muted-foreground">$20 surcharge per item</p>
            </div>
          </div>

          {formData.hasHeavyItems && (
            <div className="ml-9 space-y-2">
              <Label htmlFor="heavyCount">Number of heavy items</Label>
              <Input
                id="heavyCount"
                type="number"
                min="1"
                value={formData.heavyItemsCount}
                onChange={(e) => setFormData({ ...formData, heavyItemsCount: parseInt(e.target.value) || 0 })}
                className="w-32"
                data-testid="input-heavy-items-count"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="instructions">Special Instructions (Optional)</Label>
          <Textarea
            id="instructions"
            value={formData.specialInstructions || ''}
            onChange={(e) => setFormData({ ...formData, specialInstructions: e.target.value })}
            placeholder="Any specific care instructions or preferences..."
            rows={3}
            data-testid="textarea-special-instructions"
          />
        </div>

        <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
          <Checkbox
            id="schedulePickupLater"
            checked={formData.schedulePickupLater}
            onCheckedChange={(checked) => 
              setFormData({ ...formData, schedulePickupLater: checked === true })
            }
            data-testid="checkbox-schedule-pickup-later"
          />
          <div className="space-y-1">
            <Label htmlFor="schedulePickupLater" className="font-medium cursor-pointer">
              I'll schedule pickup later
            </Label>
            <p className="text-sm text-muted-foreground">You can schedule pickup separately after drop-off</p>
          </div>
        </div>

        <Button type="submit" className="w-full" size="lg" data-testid="button-continue">
          {formData.schedulePickupLater ? 'Confirm Drop-off' : 'Continue to Pickup'}
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </Card>
  );
}
