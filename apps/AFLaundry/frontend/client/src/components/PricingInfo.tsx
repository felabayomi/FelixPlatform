import { Card } from "@/components/ui/card";
import { DollarSign, Package } from "lucide-react";

export default function PricingInfo() {
  return (
    <section id="pricing" className="py-16 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-lg text-muted-foreground">Pay on drop-off for quality service</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">$1.50 per pound</h3>
                <p className="text-muted-foreground mb-4">Standard wash, dry, and fold service</p>
                <div className="text-sm text-muted-foreground">
                  <p>• Your laundry is weighed at drop-off</p>
                  <p>• Payment collected on-site</p>
                  <p>• Professional cleaning and folding</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-8">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-chart-3/10 rounded-lg">
                <Package className="w-6 h-6 text-chart-3" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-2">$20 per item</h3>
                <p className="text-muted-foreground mb-4">Heavy item surcharge</p>
                <div className="text-sm text-muted-foreground">
                  <p>• Duvets and comforters</p>
                  <p>• Rugs and blankets</p>
                  <p>• Other oversized items</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
