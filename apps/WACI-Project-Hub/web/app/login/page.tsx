"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL || "https://felix-platform-backend.onrender.com"
).replace(/\/$/, "");

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [keepLoggedIn, setKeepLoggedIn] = useState(true);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleLogin = async () => {
        setMessage(null);
        setError(null);
        setLoading(true);

        const result = await signIn("credentials", {
            email,
            password,
            rememberMe: keepLoggedIn,
            callbackUrl: "/",
            redirect: false,
        });

        setLoading(false);

        if (result?.error) {
            setError("Invalid email or password.");
            return;
        }

        window.location.href = result?.url || "/";
    };

    const handleForgotPassword = async () => {
        setMessage(null);
        setError(null);

        if (!email.trim()) {
            setError("Enter your email first, then click Forgot password.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE}/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: email.trim() }),
            });

            if (!res.ok) {
                throw new Error(`Request failed: ${res.status}`);
            }

            setMessage("Password reset instructions sent if the account exists.");
        } catch {
            setError("Unable to send reset request right now. Try again shortly.");
        }
    };

    return (
        <div className="container section">
            <div className="card" style={{ padding: 24, maxWidth: 420, display: "grid", gap: 12 }}>
                <h2>Login</h2>

                <input
                    placeholder="Email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--border)" }}
                />

                <div style={{ position: "relative" }}>
                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="current-password"
                        style={{
                            width: "100%",
                            padding: "10px 42px 10px 12px",
                            borderRadius: 10,
                            border: "1px solid var(--border)",
                        }}
                    />
                    <button
                        type="button"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        style={{
                            position: "absolute",
                            right: 8,
                            top: "50%",
                            transform: "translateY(-50%)",
                            border: "none",
                            background: "transparent",
                            cursor: "pointer",
                            fontSize: 16,
                        }}
                    >
                        {showPassword ? "🙈" : "👁"}
                    </button>
                </div>

                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                    <input
                        type="checkbox"
                        checked={keepLoggedIn}
                        onChange={(e) => setKeepLoggedIn(e.target.checked)}
                    />
                    Keep me logged in
                </label>

                <button
                    type="button"
                    onClick={handleForgotPassword}
                    style={{
                        width: "fit-content",
                        border: "none",
                        background: "transparent",
                        color: "var(--primary)",
                        cursor: "pointer",
                        padding: 0,
                        fontSize: 14,
                    }}
                >
                    Forgot password?
                </button>

                {error && (
                    <div style={{ fontSize: 13, color: "#991b1b", background: "#fee2e2", padding: 10, borderRadius: 8 }}>
                        {error}
                    </div>
                )}

                {message && (
                    <div style={{ fontSize: 13, color: "#166534", background: "#dcfce7", padding: 10, borderRadius: 8 }}>
                        {message}
                    </div>
                )}

                <button
                    className="btn btn-primary"
                    type="button"
                    onClick={handleLogin}
                    disabled={loading}
                >
                    {loading ? "Logging in..." : "Login"}
                </button>
            </div>
        </div>
    );
}
