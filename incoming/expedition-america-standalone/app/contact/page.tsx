import React from 'react';

export default function ContactPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-white py-12 px-4 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
      <section className="mb-8 w-full max-w-md text-center">
        <p className="text-lg mb-2">Have questions or want to reach out?</p>
        <p className="mb-1">Email: <a className="text-blue-600 underline" href="mailto:support@expeditionamerica.us">support@expeditionamerica.us</a></p>
        <p className="mb-1">Phone: <a className="text-blue-600 underline" href="tel:+12406642270">+1 (240) 664-2270</a></p>
      </section>
      <section className="w-full flex flex-col items-center">
        <h2 className="text-xl font-semibold mb-4">Book an Appointment</h2>
        <div className="rounded-lg shadow-lg overflow-hidden border border-gray-200 w-full max-w-3xl mx-auto flex justify-center" style={{ maxHeight: '1200px', overflowY: 'auto' }}>
          <iframe
            src="https://appointment.expeditionamerica.us/"
            title="Appointment Calendar"
            width="100%"
            height="1200"
            className="w-full h-[1200px] border-none"
            style={{ minHeight: '1200px', maxWidth: '100%', display: 'block', margin: '0 auto', border: 'none' }}
            allowFullScreen
            scrolling="no"
          />
        </div>
      </section>
    </main>
  );
}
