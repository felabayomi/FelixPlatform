"use client";

import { useState } from "react";
import { getGroupTourFormspreeEndpoint } from "../../data/groupTourFormspree";

const PARTICIPANT_OPTIONS = Array.from({ length: 10 }, (_, i) => i + 1);

const REFERRAL_OPTIONS = [
  "Instagram",
  "Facebook",
  "Google",
  "Friend / Referral",
  "Email Campaign",
  "Other",
];

const ATLANTA_FORMSPREE_ENDPOINT = getGroupTourFormspreeEndpoint("atlanta");

export default function AtlantaGroupTourForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    participants: "1",
    updates: false,
    emergencyName: "",
    emergencyPhone: "",
    requests: "",
    referral: "",
  });

  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const fieldValue = type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : value;
    setForm({ ...form, [name]: fieldValue });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(ATLANTA_FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          ...form,
          tourName: "Atlanta Group Tour",
          tourDates: "Oct 29 – Nov 1, 2026",
        }),
      });

      if (!response.ok) {
        throw new Error("Submission failed. Please try again.");
      }

      setSubmitted(true);
    } catch (submissionError) {
      const message = submissionError instanceof Error
        ? submissionError.message
        : "Submission failed. Please try again.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return <p className="text-center text-xl mt-10">Thanks for joining!</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-6">
      <div className="max-w-5xl w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden">

        <div className="p-8 bg-gradient-to-br from-orange-400 to-blue-900">
          <h1 className="text-3xl font-bold mb-4">🍑 Atlanta Group Tour</h1>
          <p className="text-sm opacity-90 mb-6">October 29 – November 1, 2026</p>

          <ul className="space-y-3 text-sm">
            <li>✔ MLK Jr. Historic Park</li>
            <li>✔ World of Coca-Cola</li>
            <li>✔ Georgia Aquarium</li>
            <li>✔ Atlanta BeltLine</li>
            <li>✔ Krog Street Market</li>
            <li>✔ Ponce City Market rooftop</li>
          </ul>

          <div className="mt-8 text-sm">
            <p><strong>👥 Spots Left:</strong> 22 / 28</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          {error && <p className="text-red-500 text-sm mb-2">{error}</p>}

          <h2 className="text-2xl font-semibold">Reserve Your Spot</h2>

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20"
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20"
          />

          <input
            type="tel"
            name="phone"
            placeholder="Phone Number"
            required
            minLength={10}
            value={form.phone}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20"
          />

          <select
            name="participants"
            value={form.participants}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20 text-white"
          >
            {PARTICIPANT_OPTIONS.map((num) => (
              <option key={num} value={num} className="text-black bg-white">
                {num} Participant{num > 1 ? "s" : ""}
              </option>
            ))}
          </select>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              name="emergencyName"
              placeholder="Emergency Contact"
              value={form.emergencyName}
              onChange={handleChange}
              className="p-3 rounded-xl bg-white/20 border border-white/20"
            />
            <input
              type="tel"
              name="emergencyPhone"
              placeholder="Emergency Phone"
              value={form.emergencyPhone}
              onChange={handleChange}
              className="p-3 rounded-xl bg-white/20 border border-white/20"
            />
          </div>

          <textarea
            name="requests"
            placeholder="Special Requests / Accessibility Needs"
            value={form.requests}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20"
          />

          <select
            name="referral"
            value={form.referral}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20 text-white"
          >
            <option value="" className="text-black bg-white">
              How did you hear about us?
            </option>
            {REFERRAL_OPTIONS.map((option) => (
              <option key={option} value={option} className="text-black bg-white">
                {option}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="updates"
              checked={form.updates}
              onChange={handleChange}
            />
            Receive updates about future tours
          </label>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-orange-400 to-blue-900 hover:scale-105 transition-transform p-3 rounded-xl font-semibold"
          >
            {isSubmitting ? "Sending..." : "🍑 Book My Spot"}
          </button>
        </form>
      </div>
    </div>
  );
}
