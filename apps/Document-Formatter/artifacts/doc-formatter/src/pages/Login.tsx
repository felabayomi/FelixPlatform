import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import { Loader2, ShieldCheck, Sparkles } from "lucide-react";

import { signInToFormatter, type FormatterUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LoginPageProps {
    onSignedIn: (user: FormatterUser) => void;
}

export default function LoginPage({ onSignedIn }: LoginPageProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) {
            setError("Email and password are required.");
            return;
        }

        setSubmitting(true);
        setError("");

        try {
            const user = await signInToFormatter(email, password);
            onSignedIn(user);
        } catch (err) {
            console.error(err);
            setError(err instanceof Error ? err.message : "Unable to sign in right now.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md shadow-xl border-slate-200">
                <CardHeader className="space-y-3">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <CardTitle className="text-2xl">Document Formatter Login</CardTitle>
                        <CardDescription className="mt-1">
                            Sign in with your Felix Platform account to format and export documents securely.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setEmail(event.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="Enter your password"
                            value={password}
                            onChange={(event: ChangeEvent<HTMLInputElement>) => setPassword(event.target.value)}
                            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
                                if (event.key === "Enter") {
                                    void handleSubmit();
                                }
                            }}
                        />
                    </div>

                    {error ? <p className="text-sm text-red-600">{error}</p> : null}

                    <Button className="w-full" onClick={() => void handleSubmit()} disabled={submitting}>
                        {submitting ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Signing in...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" />
                                Continue to Formatter
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
