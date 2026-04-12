import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { HelpCircle, Mail, Home } from "lucide-react";

export default function FAQ() {
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
            <HelpCircle className="w-10 h-10 text-primary" />
            <h1 className="text-4xl font-bold">Frequently Asked Questions</h1>
          </div>
          <p className="text-center text-lg text-muted-foreground">
            Find answers to common questions about City Discoverer group tours
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-12">
        <Accordion type="single" collapsible className="space-y-4">
          <AccordionItem value="item-1" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-what-included">
              What's included in the tour price?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Our tour price includes expert local guides, curated itineraries, and group coordination throughout your journey. You'll receive a detailed itinerary before your tour begins. Accommodations, meals, and transportation to/from the destination are not included but can be arranged separately. We focus on providing authentic experiences and insider knowledge to help you discover each city like a local.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-2" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-group-size">
              How large are the tour groups?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                We keep our groups intentionally small, typically between 16-24 participants. This allows for a more intimate experience, easier coordination, and the flexibility to explore hidden gems that larger tour groups can't access. Small groups also mean you'll have more opportunities to interact with your guide and fellow travelers.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-3" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-cancellation">
              What is your cancellation policy?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground mb-3">
                We understand that plans can change. Our cancellation policy is designed to be fair to both travelers and our operations:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground">
                <li><strong>60+ days before tour:</strong> Full refund minus $50 administrative fee</li>
                <li><strong>30-59 days before tour:</strong> 50% refund</li>
                <li><strong>Less than 30 days:</strong> No refund, but you can transfer to another tour</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                We highly recommend purchasing travel insurance to protect your investment.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-4" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-fitness-level">
              What fitness level is required?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Most of our city tours involve moderate walking (3-5 miles per day) on varied terrain including sidewalks, stairs, and sometimes cobblestones. We take regular breaks and maintain a comfortable pace. If you have specific mobility concerns, please contact us before booking so we can discuss accommodations and ensure the tour is suitable for you.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-5" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-solo-travelers">
              Can I join as a solo traveler?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Absolutely! Many of our travelers join solo and find it a great way to meet like-minded people. Our small group format makes it easy to connect with fellow travelers. While we don't charge single supplements for the tour itself, please note that if you're booking accommodations through our partners, single room rates may apply.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-6" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-payment">
              What payment methods do you accept?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                We accept all major credit cards (Visa, MasterCard, American Express, Discover) and bank transfers. After you submit your signup, we'll send you a secure payment link to complete your booking. A deposit is required to reserve your spot, with the balance due 45 days before the tour start date.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-7" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-weather">
              What if there's bad weather?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Our tours operate rain or shine! We'll provide suggestions for appropriate clothing and gear based on the season and destination. Our experienced guides are skilled at adapting itineraries to weather conditions, moving indoor activities earlier if needed or finding covered alternatives. We believe every city has something special to offer regardless of the weather.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-8" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-age-restrictions">
              Are there age restrictions?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Our tours are designed for adults and welcome travelers 18 and older. Minors ages 16-17 may join if accompanied by a parent or guardian. We don't have an upper age limit—if you're excited about exploring and can handle moderate walking, you're welcome to join us!
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-9" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-dietary">
              Can you accommodate dietary restrictions?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                While meals are not included in the tour price, our guides are knowledgeable about local dining options and can recommend restaurants that accommodate various dietary needs including vegetarian, vegan, gluten-free, and other restrictions. Please let us know about any dietary requirements when you sign up.
              </p>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="item-10" className="bg-card rounded-md px-6 border">
            <AccordionTrigger data-testid="faq-local-picks">
              What is Local Picks?
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">
                Local Picks is our personalized tour planning service. If none of our scheduled tours match your dates or preferred destinations, tell us where you want to go and when you're available. Our team will create a custom itinerary based on your interests and connect you with a group of like-minded travelers. It's a great way to discover hidden gems and travel on your own schedule.
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <Card className="mt-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Still have questions?
            </CardTitle>
            <CardDescription>
              We're here to help! Contact our team for personalized assistance.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-4">
            <Link href="/contact">
              <Button data-testid="button-contact-us">Contact Us</Button>
            </Link>
            <a href="mailto:discoverercity@gmail.com">
              <Button variant="outline" data-testid="button-email-us">
                Email: discoverercity@gmail.com
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
