"use client";

import { useState } from "react";

type FormState = {
  fullName: string;
  email: string;
  cityOfInterest: string;
  travelDates: string;
  experienceType: string;
  additionalNotes: string;
};

const initialFormState: FormState = {
  fullName: "",
  email: "",
  cityOfInterest: "",
  travelDates: "",
  experienceType: "Full City Experience",
  additionalNotes: "",
};

const experienceOptions = [
  "Food & Dining",
  "Nightlife",
  "Culture & Arts",
  "Events",
  "Hidden Gems",
  "Full City Experience",
];

export default function EventsPage() {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage("");
    setErrorMessage("");

    try {
      const res = await fetch("https://formspree.io/f/xqeywzzq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          name: form.fullName,
          email: form.email,
          city: form.cityOfInterest,
          travelDates: form.travelDates,
          experienceType: form.experienceType,
          additionalNotes: form.additionalNotes,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      setSuccessMessage("Request submitted successfully!");
      setForm(initialFormState);
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_#f0f9ff_0%,_#ffffff_38%,_#f8fafc_100%)] pb-20 text-slate-900">
      <section className="relative overflow-hidden border-b border-cyan-100 bg-[linear-gradient(135deg,_#0f172a_0%,_#1e3a8a_48%,_#0891b2_100%)] text-white">
        <div className="absolute -left-20 top-8 h-64 w-64 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-0 top-0 h-56 w-56 rounded-full bg-emerald-300/20 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-6 py-18 md:py-22">
          <h1 className="max-w-4xl text-4xl font-black leading-tight md:text-6xl">
            Discover Any U.S. City Like a Local
          </h1>
          <p className="mt-5 max-w-3xl text-lg text-cyan-50 md:text-xl">
            Tell us where you are going and we will build your experience. Expedition America
            curates neighborhoods, hidden gems, food, culture, nightlife, and real-time city
            moments based on how you want to travel.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <a
              href="#interest-form"
              className="rounded-xl bg-white px-5 py-3 font-bold text-slate-900 shadow-lg transition hover:bg-cyan-50"
            >
              Request Your City Experience
            </a>
            <a
              href="/cities"
              className="rounded-xl border border-white/50 px-5 py-3 font-bold text-white transition hover:bg-white/15"
            >
              Explore Featured Cities
            </a>
          </div>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-6">
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl md:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">What We Do</p>
          <h2 className="mt-3 text-3xl font-black md:text-4xl">A Smarter Way to Explore Cities</h2>
          <p className="mt-4 max-w-4xl text-slate-600 md:text-lg">
            Expedition America goes beyond generic travel guides. We connect you with the true
            energy of a city, from emerging neighborhoods and local food scenes to cultural events
            and hidden gems. Whether you are planning ahead or exploring in real time, we help you
            move with confidence, style, and local insight.
          </p>
        </div>
      </section>

      <section id="interest-form" className="mx-auto mt-12 max-w-7xl px-6">
        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl md:p-10">
            <h2 className="text-3xl font-black">Plan Your City Experience</h2>
            <p className="mt-3 text-slate-600">
              Tell us where you are going and what you are looking for. We will curate
              recommendations tailored to your travel style.
            </p>

            <form className="mt-6 grid gap-4" onSubmit={handleSubmit}>
              <label className="text-sm font-semibold text-slate-700">
                Full Name
                <input
                  required
                  value={form.fullName}
                  onChange={(event) => updateField("fullName", event.target.value)}
                  placeholder="Jane Doe"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-cyan-300 placeholder:text-slate-400 focus:ring"
                />
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Email Address
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField("email", event.target.value)}
                  placeholder="you@email.com"
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-cyan-300 placeholder:text-slate-400 focus:ring"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="text-sm font-semibold text-slate-700">
                  City of Interest
                  <input
                    required
                    value={form.cityOfInterest}
                    onChange={(event) => updateField("cityOfInterest", event.target.value)}
                    placeholder="Chicago"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-cyan-300 placeholder:text-slate-400 focus:ring"
                  />
                </label>
                <label className="text-sm font-semibold text-slate-700">
                  Travel Dates (optional)
                  <input
                    value={form.travelDates}
                    onChange={(event) => updateField("travelDates", event.target.value)}
                    placeholder="Jun 15-18, 2026"
                    className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-cyan-300 placeholder:text-slate-400 focus:ring"
                  />
                </label>
              </div>

              <label className="text-sm font-semibold text-slate-700">
                Type of Experience
                <select
                  value={form.experienceType}
                  onChange={(event) => updateField("experienceType", event.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-cyan-300 focus:ring"
                >
                  {experienceOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>

              <label className="text-sm font-semibold text-slate-700">
                Additional Notes
                <textarea
                  rows={4}
                  value={form.additionalNotes}
                  onChange={(event) => updateField("additionalNotes", event.target.value)}
                  placeholder="Share your interests, pace, and must-see experiences."
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 outline-none ring-cyan-300 placeholder:text-slate-400 focus:ring"
                />
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="mt-2 inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-6 py-3 text-base font-black text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? "Submitting..." : "Submit Request"}
              </button>

              {successMessage ? (
                <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {successMessage}
                </p>
              ) : null}

              {errorMessage ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {errorMessage}
                </p>
              ) : null}
            </form>
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
              <h3 className="text-2xl font-black">Built for Modern Travelers</h3>
              <ul className="mt-4 space-y-2 text-slate-600">
                <li>Visitors who want more than tourist attractions</li>
                <li>Locals looking to rediscover their city</li>
                <li>Professionals traveling for business</li>
                <li>Groups planning curated experiences</li>
                <li>Anyone seeking authentic, real-time city discovery</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
              <h3 className="text-2xl font-black">How It Works</h3>
              <ol className="mt-4 space-y-3 text-slate-600">
                <li>1. Tell us your city and interests</li>
                <li>2. We curate tailored recommendations</li>
                <li>3. Explore the city with local-level insight</li>
              </ol>
              <p className="mt-4 font-semibold text-slate-800">
                No guesswork. No generic lists. Just real experiences.
              </p>
            </div>
          </aside>
        </div>
      </section>

      <section className="mx-auto mt-12 max-w-7xl px-6">
        <div className="rounded-3xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-8 text-center shadow-xl md:p-10">
          <h2 className="text-3xl font-black">Start Exploring a City Your Way</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-700">
            Submit your request and discover what makes each city unique.
          </p>
          <a
            href="#interest-form"
            className="mt-6 inline-flex rounded-xl bg-slate-900 px-6 py-3 font-bold text-white transition hover:bg-slate-700"
          >
            Request Your Experience
          </a>
        </div>
      </section>
    </main>
  );
}