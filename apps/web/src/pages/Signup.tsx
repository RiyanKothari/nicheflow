import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";

export function Signup() {
  const [, setLocation] = useLocation();
  const { signupMutate, isSigningUp } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password || !firstName || !lastName) {
      setError("Please fill in all fields");
      return;
    }
    signupMutate(
      { 
        data: { 
          email, 
          password,
          options: {
            data: {
              first_name: firstName,
              last_name: lastName
            }
          }
        } 
      },
      {
        onSuccess: () => setLocation("/dashboard"),
        onError: (err: any) => setError(err.message || "Failed to create account")
      }
    );
  };

  return (
    <div className="min-h-screen bg-[var(--color-absolute-canvas)] flex items-center justify-center p-6 selection:bg-[var(--color-structural-ink)] selection:text-white">
      <div className="w-full max-w-md">
        <div className="mb-12 text-center">
          <Link href="/">
            <span className="font-bold text-[28px] tracking-[-0.04em] font-sans cursor-pointer">nicheflow</span>
          </Link>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--color-absolute-canvas)] rounded-[var(--radius-floatingpanels)] p-8 shadow-[var(--shadow-xl)] border border-[var(--color-boundary-frame)]"
        >
          <div className="mb-8">
            <h1 className="text-4xl font-sans font-bold tracking-[-0.03em] mb-2 text-[var(--color-structural-ink)]">Create workspace</h1>
            <p className="text-[16px] text-[var(--color-graphite-metadata)] font-medium">Set up your business operating system in seconds.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="First name"
                type="text"
                placeholder="Rahul"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isSigningUp}
              />
              <Input
                label="Last name"
                type="text"
                placeholder="Sharma"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isSigningUp}
              />
            </div>

            <Input
              label="Email address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSigningUp}
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSigningUp}
            />

            {error && (
              <div className="p-4 bg-[#fff1f2] border border-[#ffe4e6] rounded-[8px] flex items-center gap-2 text-[#e11d48]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-[14px] font-medium">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              variant="contextual"
              className="w-full h-12 text-[16px] mt-2"
              isLoading={isSigningUp}
            >
              Build my workspace
            </Button>
          </form>

          <div className="mt-8 text-center text-[14px] font-medium text-[var(--color-graphite-metadata)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[var(--color-structural-ink)] font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
