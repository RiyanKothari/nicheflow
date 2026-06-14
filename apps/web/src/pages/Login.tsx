import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion } from "framer-motion";

export function Login() {
  const [, setLocation] = useLocation();
  const { loginMutate, isLoggingIn } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }
    loginMutate(
      { data: { email, password } },
      {
        onSuccess: () => setLocation("/dashboard"),
        onError: (err: any) => setError(err.message || "Failed to log in")
      }
    );
  };

  const handleDemoLogin = () => {
    loginMutate(
      { data: { email: "demo@nicheflow.app", password: "demo1234" } },
      {
        onSuccess: () => setLocation("/dashboard"),
        onError: (err: any) => setError(err.message || "Demo account login failed. Make sure the database is configured.")
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
            <h1 className="text-4xl font-sans font-bold tracking-[-0.03em] mb-2 text-[var(--color-structural-ink)]">Welcome back</h1>
            <p className="text-[16px] text-[var(--color-graphite-metadata)] font-medium">Enter your credentials to access your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Input
              label="Email address"
              type="email"
              placeholder="name@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoggingIn}
            />
            
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoggingIn}
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
              className="w-full h-12 text-[16px]"
              isLoading={isLoggingIn}
            >
              Sign in to Workspace
            </Button>
          </form>

          <div className="mt-8 text-center text-[14px] font-medium text-[var(--color-graphite-metadata)]">
            Don't have an account?{" "}
            <Link href="/signup" className="text-[var(--color-structural-ink)] font-bold hover:underline">
              Create one
            </Link>
          </div>
        </motion.div>

        {/* Demo Login (Floating Panel) */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-[#f7f7f7] rounded-[var(--radius-floatingpanels)] p-6 text-center border border-[var(--color-boundary-frame)]"
        >
          <p className="text-[14px] font-medium text-[var(--color-graphite-metadata)] mb-4">Just looking around?</p>
          <Button 
            variant="secondary" 
            onClick={handleDemoLogin} 
            className="w-full h-10"
            disabled={isLoggingIn}
          >
            Try Demo Account
          </Button>
        </motion.div>
      </div>
    </div>
  );
}
