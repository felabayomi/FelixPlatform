import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function Appointment() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="max-w-7xl mx-auto w-full px-4 lg:px-8 py-8">
          <div className="space-y-2 mb-6">
            <h1 className="text-3xl lg:text-4xl font-bold">Book an Appointment</h1>
            <p className="text-muted-foreground">
              Schedule a call with our team to learn more about our group tours and find the right fit for you.
            </p>
          </div>
        </div>
        <div className="flex-1 w-full">
          <iframe
            src="https://appointment.expeditionamerica.us/"
            className="w-full h-full min-h-[800px] border-0"
            title="Book an Appointment"
            allowFullScreen
          />
        </div>
      </main>
      <Footer />
    </div>
  );
}
