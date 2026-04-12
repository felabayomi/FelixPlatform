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

const CHICAGO_FORMSPREE_ENDPOINT = getGroupTourFormspreeEndpoint("chicago");

export default function ChicagoGroupTourForm() {
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    let fieldValue: string | boolean = value;
    if (type === "checkbox" && "checked" in e.target) {
      fieldValue = (e.target as HTMLInputElement).checked;
    }
    setForm({
      ...form,
      [name]: fieldValue,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const res = await fetch(CHICAGO_FORMSPREE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Submission failed");
      alert("🎉 Chicago Tour Registered!");
      setForm({
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
    } catch (err) {
      alert("Submission failed. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white flex items-center justify-center p-6">
      <div className="max-w-5xl w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl grid md:grid-cols-2 overflow-hidden">
        {/* LEFT SIDE */}
        <div className="p-8 bg-gradient-to-br from-indigo-600 to-blue-700">
          <h1 className="text-3xl font-bold mb-4">🌆 Chicago Group Tour</h1>
          <p className="text-sm opacity-90 mb-6">September 10–13, 2026</p>
          <ul className="space-y-3 text-sm">
            <li>✔ Millennium Park & Cloud Gate</li>
            <li>✔ Architecture River Cruise</li>
            <li>✔ Navy Pier & lakefront</li>
            <li>✔ Skydeck Chicago</li>
            <li>✔ Art Institute visit</li>
            <li>✔ West Loop dining</li>
          </ul>
          <div className="mt-8 text-sm">
            <p><strong>👥 Spots Left:</strong> 25 / 30</p>
          </div>
        </div>
        {/* FORM */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4">
          <h2 className="text-2xl font-semibold">Reserve Your Spot</h2>
          {/* Name */}
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            required
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20"
          />
          {/* Email */}
          <input
            type="email"
            name="email"
            placeholder="Email Address"
            required
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20"
          />
          {/* Phone */}
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
          {/* ✅ FIXED Participants Dropdown */}
          <select
            name="participants"
            value={form.participants}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20 text-white"
          >
            {PARTICIPANT_OPTIONS.map((num) => (
              <option key={num} value={num} className="text-black">
                {num} Participant{num > 1 ? "s" : ""}
              </option>
            ))}
          </select>
          {/* Emergency Contact */}
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
          {/* Requests */}
          <textarea
            name="requests"
            placeholder="Special Requests / Accessibility Needs"
            value={form.requests}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20"
          />
          {/* ✅ FIXED Referral Dropdown (Reusable) */}
          <select
            name="referral"
            value={form.referral}
            onChange={handleChange}
            className="w-full p-3 rounded-xl bg-white/20 border border-white/20 text-white"
          >
            <option value="" className="text-black">
              How did you hear about us?
            </option>
            {REFERRAL_OPTIONS.map((option) => (
              <option key={option} value={option} className="text-black">
                {option}
              </option>
            ))}
          </select>
          {/* Checkbox */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="updates"
              checked={form.updates}
              onChange={handleChange}
            />
            Receive updates about future tours
          </label>
          {/* Submit */}
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-indigo-500 to-blue-600 hover:scale-105 transition-transform p-3 rounded-xl font-semibold"
          >
            🚀 Book My Spot
          </button>
        </form>
      </div>
    </div>
  );
}
