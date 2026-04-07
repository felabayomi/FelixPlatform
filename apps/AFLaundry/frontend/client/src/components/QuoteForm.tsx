import { useState } from "react";
import { format, addDays } from "date-fns";
import { Calendar, FileText, MapPin, Scale, Truck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface QuoteFormProps {
    onSubmit: (data: QuoteFormData) => void;
    isSubmitting?: boolean;
}

export interface QuoteFormData {
    customerName: string;
    customerPhone: string;
    customerEmail: string;
    serviceType: string;
    preferredDate: string;
    serviceWindow: string;
    pickupAddress: string;
    deliveryAddress?: string;
    estimatedWeight?: string;
    preferredFulfillment: string;
    notes?: string;
    source?: string;
}

const initialQuoteForm: QuoteFormData = {
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    serviceType: "Wash, Dry & Fold",
    preferredDate: "",
    serviceWindow: "Morning (9 AM - 12 PM)",
    pickupAddress: "",
    deliveryAddress: "",
    estimatedWeight: "",
    preferredFulfillment: "Drop-off + pickup",
    notes: "",
    source: "web",
};

export default function QuoteForm({ onSubmit, isSubmitting = false }: QuoteFormProps) {
    const [formData, setFormData] = useState<QuoteFormData>(initialQuoteForm);
    const minDate = format(addDays(new Date(), 1), "yyyy-MM-dd");

    const handleSubmit = (event: React.FormEvent) => {
        event.preventDefault();
        onSubmit(formData);
    };

    return (
        <Card className="p-6 sm:p-8">
            <div className="mb-6">
                <h3 className="text-2xl font-bold mb-2">Request a Laundry Quote</h3>
                <p className="text-muted-foreground">
                    Tell us about your laundry needs and we’ll review pricing with you before you book.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="quoteName">Full Name</Label>
                        <Input
                            id="quoteName"
                            value={formData.customerName}
                            onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                            placeholder="John Doe"
                            required
                            data-testid="input-quote-customer-name"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="quotePhone">Phone Number</Label>
                        <Input
                            id="quotePhone"
                            type="tel"
                            value={formData.customerPhone}
                            onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                            placeholder="240-664-2270"
                            required
                            data-testid="input-quote-customer-phone"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="quoteEmail">Email Address</Label>
                    <Input
                        id="quoteEmail"
                        type="email"
                        value={formData.customerEmail}
                        onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                        placeholder="john@example.com"
                        required
                        data-testid="input-quote-customer-email"
                    />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="serviceType">Service Type</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <select
                                id="serviceType"
                                value={formData.serviceType}
                                onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                                className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                required
                                data-testid="select-quote-service-type"
                            >
                                <option value="Wash, Dry & Fold">Wash, Dry & Fold</option>
                                <option value="Heavy Items / Bedding">Heavy Items / Bedding</option>
                                <option value="Recurring Weekly Laundry">Recurring Weekly Laundry</option>
                                <option value="Pickup & Delivery Estimate">Pickup & Delivery Estimate</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="estimatedWeight">Estimated Weight (lbs)</Label>
                        <div className="relative">
                            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                id="estimatedWeight"
                                type="number"
                                min="1"
                                value={formData.estimatedWeight || ""}
                                onChange={(e) => setFormData({ ...formData, estimatedWeight: e.target.value })}
                                className="pl-10"
                                placeholder="20"
                                data-testid="input-quote-estimated-weight"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="preferredDate">Preferred Service Date</Label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <Input
                                id="preferredDate"
                                type="date"
                                min={minDate}
                                value={formData.preferredDate}
                                onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                                className="pl-10"
                                required
                                data-testid="input-quote-preferred-date"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="serviceWindow">Preferred Time Window</Label>
                        <select
                            id="serviceWindow"
                            value={formData.serviceWindow}
                            onChange={(e) => setFormData({ ...formData, serviceWindow: e.target.value })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            required
                            data-testid="select-quote-service-window"
                        >
                            <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                            <option value="Midday (12 PM - 3 PM)">Midday (12 PM - 3 PM)</option>
                            <option value="Afternoon (3 PM - 6 PM)">Afternoon (3 PM - 6 PM)</option>
                            <option value="Flexible">Flexible</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="preferredFulfillment">Preferred Fulfillment</Label>
                    <div className="relative">
                        <Truck className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <select
                            id="preferredFulfillment"
                            value={formData.preferredFulfillment}
                            onChange={(e) => setFormData({ ...formData, preferredFulfillment: e.target.value })}
                            className="flex h-9 w-full rounded-md border border-input bg-transparent pl-10 pr-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                            required
                            data-testid="select-quote-preferred-fulfillment"
                        >
                            <option value="Drop-off + pickup">Drop-off + pickup</option>
                            <option value="Drop-off only">Drop-off only</option>
                            <option value="Pickup & delivery quote needed">Pickup & delivery quote needed</option>
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="pickupAddress">Pickup / Contact Address</Label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                        <Textarea
                            id="pickupAddress"
                            value={formData.pickupAddress}
                            onChange={(e) => setFormData({ ...formData, pickupAddress: e.target.value })}
                            className="pl-10 min-h-[88px]"
                            placeholder="50 Stately St, Suite 2, Wiley Ford, WV 26767"
                            required
                            data-testid="textarea-quote-pickup-address"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="deliveryAddress">Delivery Address (optional)</Label>
                    <Textarea
                        id="deliveryAddress"
                        value={formData.deliveryAddress || ""}
                        onChange={(e) => setFormData({ ...formData, deliveryAddress: e.target.value })}
                        placeholder="Add a different delivery address if needed"
                        data-testid="textarea-quote-delivery-address"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="quoteNotes">Notes</Label>
                    <Textarea
                        id="quoteNotes"
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Tell us about heavy items, same-day needs, detergent requests, or special handling"
                        data-testid="textarea-quote-notes"
                    />
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting} data-testid="button-request-quote">
                    {isSubmitting ? "Sending Quote Request..." : "Request Quote"}
                </Button>
            </form>
        </Card>
    );
}
