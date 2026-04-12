import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { buildApiUrl } from "@/lib/queryClient";
import { Eye, EyeOff, Shield, Loader2 } from "lucide-react";
import logoSrc from "/logo.png";

interface AdminLoginProps {
  onAuthenticated: (token: string, remember: boolean) => void;
}

export function AdminLogin({ onAuthenticated }: AdminLoginProps) {
  const [code, setCode] = useState("");
  const [showCode, setShowCode] = useState(false);
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError("Please enter your access code.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl("/api/admin/auth"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Incorrect code. Please try again.");
        setCode("");
      } else {
        onAuthenticated(data.token, keepSignedIn);
      }
    } catch {
      setError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <img src={logoSrc} alt="Expedition America" className="h-12 w-auto object-contain mb-6" />
          <div className="flex items-center gap-2 mb-1">
            <Shield className="h-4 w-4 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Editorial Access</h1>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Enter your access code to manage the Expedition America newsroom.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-background border rounded-md p-6 shadow-sm space-y-5">
          <div className="space-y-2">
            <Label htmlFor="admin-code">Access Code</Label>
            <div className="relative">
              <Input
                id="admin-code"
                type={showCode ? "text" : "password"}
                value={code}
                onChange={e => { setCode(e.target.value); setError(""); }}
                placeholder="Enter your code"
                autoComplete="current-password"
                className="pr-10"
                data-testid="input-admin-code"
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowCode(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
                aria-label={showCode ? "Hide code" : "Show code"}
                data-testid="button-toggle-password-visibility"
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && (
              <p className="text-xs text-destructive" data-testid="text-login-error">{error}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Checkbox
              id="keep-signed-in"
              checked={keepSignedIn}
              onCheckedChange={v => setKeepSignedIn(Boolean(v))}
              data-testid="checkbox-keep-signed-in"
            />
            <Label htmlFor="keep-signed-in" className="text-sm font-normal cursor-pointer">
              Keep me signed in
            </Label>
          </div>

          <Button
            type="submit"
            className="w-full gap-2"
            disabled={loading}
            data-testid="button-admin-login"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Verifying...</>
            ) : (
              <><Shield className="h-4 w-4" />Enter Newsroom</>
            )}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Expedition America Editorial System
        </p>
      </div>
    </div>
  );
}
