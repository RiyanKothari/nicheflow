import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Sparkles, Loader2, ShieldCheck, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLogin } from "@workspace/api-client-react";
import { motion, AnimatePresence } from "framer-motion";

const TESTIMONIALS = [
  { quote: "I set up my entire dog training workspace in 2 minutes. It just works.", name: "Riya S.", role: "Dog Trainer", city: "Bangalore" },
  { quote: "Finally software that actually understands what a tailor needs.", name: "Fatima A.", role: "Tailor", city: "Chennai" },
  { quote: "My crop inventory and client orders all in one place. No more notebooks.", name: "Manoj K.", role: "Urban Farmer", city: "Pune" }
];

const NICHES = ["🐕 Dog Training", "🌿 Urban Farming", "✂️ Tailoring", "🔧 Home Repair", "📸 Photography"];

export function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const { mutate: loginMutate, isPending } = useLogin();
  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % TESTIMONIALS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const fillDemo = () => {
    setEmail("demo@nicheflow.app");
    setPassword("demo1234");
    setErrorMsg("");
    setFieldErrors({});
    loginMutate(
      { data: { email: "demo@nicheflow.app", password: "demo1234" } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          setLocation("/dashboard");
        },
        onError: () => {
          setErrorMsg("Demo login failed — please try again");
        }
      }
    );
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMsg("");
    setFieldErrors({});

    const errors: Record<string, string> = {};
    if (!email.includes("@")) errors.email = "Please enter a valid email address";
    if (!password) errors.password = "Password is required";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    loginMutate(
      { data: { email, password } },
      {
        onSuccess: (data) => {
          login(data.token, data.user);
          setLocation("/dashboard");
        },
        onError: () => {
          setErrorMsg("Invalid email or password");
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-1/2 bg-card border-r border-border flex-col p-12 relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute w-64 h-64 rounded-full bg-primary/10 blur-3xl -top-16 -right-16 pointer-events-none" />
        <div className="absolute w-48 h-48 rounded-full bg-primary/5 blur-2xl -bottom-12 -left-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-7 h-7 text-primary" />
            <span className="font-bold text-xl text-foreground">NicheFlow</span>
          </div>

          <div className="flex-1" />

          {/* Main content block */}
          <div className="mb-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full border border-primary/20 mb-6">
              <ShieldCheck className="w-3.5 h-3.5" />
              500+ businesses trust NicheFlow
            </div>
            <h1 className="text-2xl font-bold text-foreground leading-snug mb-3">
              The OS for niche businesses in India.
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Real bookings. Real invoices. Real clients. All in one place designed for how you actually work.
            </p>

            {/* Rotating Testimonial */}
            <div className="bg-background/60 backdrop-blur border border-border rounded-2xl p-5 mt-6 min-h-[160px] flex flex-col">
              <div className="text-4xl text-primary/40 font-serif leading-none mb-2">"</div>
              <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeIndex}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.35 }}
                    className="absolute inset-0"
                  >
                    <p className="text-sm text-foreground/90 italic mb-4 leading-relaxed">
                      {TESTIMONIALS[activeIndex].quote}
                    </p>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold">
                        {TESTIMONIALS[activeIndex].name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{TESTIMONIALS[activeIndex].name}</div>
                        <div className="text-xs text-muted-foreground">{TESTIMONIALS[activeIndex].role}, {TESTIMONIALS[activeIndex].city}</div>
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>
              <div className="flex gap-1.5 mt-4 justify-center z-10">
                {TESTIMONIALS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === activeIndex ? "w-4 bg-primary" : "w-1.5 bg-border"}`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Niche Icon Strip */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs text-muted-foreground">Popular niches:</span>
            {NICHES.map((niche, i) => (
              <span key={i} className="text-xs text-muted-foreground bg-background/40 border border-border/60 rounded-full px-2.5 py-1">
                {niche}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex justify-center mb-8">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-7 h-7 text-primary" />
              <span className="font-bold text-xl text-foreground">NicheFlow</span>
            </div>
          </div>
          
          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-8">
            Don't have an account? <Link href="/signup" className="text-primary hover:text-primary/80 transition-colors">Sign up</Link>
          </p>

          {/* Try Demo Banner */}
          <motion.button
            type="button"
            onClick={fillDemo}
            disabled={isPending}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full mb-6 flex items-center justify-between gap-3 bg-primary/8 border border-primary/25 rounded-2xl px-4 py-3 hover:bg-primary/12 hover:border-primary/40 transition-all group disabled:opacity-70"
            aria-label="Try live demo"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                {isPending ? <Loader2 className="w-4 h-4 text-primary animate-spin" /> : <Sparkles className="w-4 h-4 text-primary" />}
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-primary">Try the Live Demo</p>
                <p className="text-xs text-muted-foreground">{isPending ? "Logging you in…" : "Dog trainer workspace, pre-loaded with data"}</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 rounded-lg px-2.5 py-1 shrink-0 group-hover:bg-primary/20 transition-colors">
              {isPending ? "…" : "Enter →"}
            </span>
          </motion.button>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {errorMsg && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-xl p-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <p>{errorMsg}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Email address</label>
              <input
                name="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
              />
              {fieldErrors.email && <p className="mt-1.5 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.email}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">Password</label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full px-3.5 py-2.5 bg-background border border-border rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1.5 text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{fieldErrors.password}</p>}
            </div>

            <div className="flex items-center justify-between mt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded accent-primary border-border bg-background" />
                <span className="text-sm text-muted-foreground">Remember me</span>
              </label>
              <a href="#" onClick={(e) => e.preventDefault()} className="text-sm text-primary hover:text-primary/80 transition-colors">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isPending}
              className="w-full mt-2 bg-primary text-primary-foreground hover:bg-primary/90 py-2.5 px-4 rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isPending ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="flex items-center gap-3 my-5">
            <hr className="flex-1 border-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <hr className="flex-1 border-border" />
          </div>

          <button
            type="button"
            onClick={() => alert("Google login coming soon")}
            className="w-full py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-card text-sm font-medium text-foreground flex items-center justify-center gap-2.5 transition-all"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
