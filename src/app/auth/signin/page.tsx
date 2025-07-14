"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { GlassCard } from "@/components/ui/GlassCard";
import { MorphButton } from "@/components/ui/MorphButton";
import { Heading } from "@/components/ui/Heading";
import { IconLock } from "@tabler/icons-react";

export default function SignIn() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError("Invalid credentials");
      } else if (result?.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-terminal-bg">
      <div className="w-full max-w-md">
        <GlassCard elevation={3} className="p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-electric-blue/10 mb-4">
              <IconLock className="w-8 h-8 text-electric-blue" />
            </div>
            <Heading size="h2" className="text-electric-blue">
              Admin Access
            </Heading>
            <p className="text-slate-400 mt-2">
              Enter your credentials to continue
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-300 mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-4 py-3 bg-terminal-bg/50 border border-terminal-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-colors"
                placeholder="Enter username"
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-terminal-bg/50 border border-terminal-border rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-electric-blue focus:ring-1 focus:ring-electric-blue transition-colors"
                placeholder="Enter password"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-error-red/10 border border-error-red/20 rounded-lg">
                <p className="text-error-red text-sm">{error}</p>
              </div>
            )}

            <MorphButton
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </MorphButton>
          </form>
        </GlassCard>
      </div>
    </div>
  );
}