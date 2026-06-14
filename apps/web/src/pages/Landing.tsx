import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView, animate, AnimatePresence } from "framer-motion";
import { 
  Sparkles, 
  ArrowRight, 
  Menu, 
  X,
  CheckCircle2,
  MessageSquare,
  LayoutDashboard,
  Calendar,
  Users,
  Receipt,
  Package,
  Globe,
  Globe2,
  Eye,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Stat Counter Component
function StatCounter({ value, label, suffix = "" }: { value: number; label: string; suffix?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isInView) {
      const controls = animate(0, value, {
        duration: 2,
        ease: "easeOut",
        onUpdate: (v) => setCount(Math.floor(v)),
      });
      return controls.stop;
    }
    return undefined;
  }, [isInView, value]);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-[var(--color-absolute-canvas)] border border-[var(--color-boundary-frame)] rounded-[var(--radius-contentcards)] p-8 flex flex-col items-center justify-center text-center relative overflow-hidden"
    >
      <div className="text-5xl md:text-6xl font-sans font-bold text-[var(--color-structural-ink)] mb-2 tracking-[-0.04em]">
        {count}{suffix}
      </div>
      <div className="text-[var(--color-graphite-metadata)] font-medium text-[16px]">{label}</div>
    </motion.div>
  );
}

// Spotlight Card Component mimicking Aceternity for Bento Grid
function SpotlightCard({ children, className = "" }: { children: React.ReactNode, className?: string }) {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden bg-[var(--color-absolute-canvas)] border border-[var(--color-boundary-frame)] rounded-[var(--radius-contentcards)] p-6 transition-colors hover:border-[var(--color-structural-ink)] ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300"
        style={{
          opacity,
          background: `radial-gradient(400px circle at ${position.x}px ${position.y}px, rgba(0,0,0,0.03), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setIsMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-[var(--color-absolute-canvas)] text-[var(--color-structural-ink)] flex flex-col relative overflow-hidden selection:bg-[var(--color-structural-ink)] selection:text-white">

      <style>{`
        @keyframes scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-scroll {
          animation: scroll 30s linear infinite;
        }
        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>

      {/* 1. NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-[rgba(255,255,255,0.9)] backdrop-blur-md border-b border-[var(--color-boundary-frame)]" : "bg-transparent"}`}>
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-[var(--color-structural-ink)] text-[24px] tracking-[-0.04em] font-sans">nicheflow</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo("features")} className="text-[16px] font-medium text-[var(--color-graphite-metadata)] hover:text-[var(--color-structural-ink)] transition-colors tracking-tight">Features</button>
              <button onClick={() => scrollTo("how-it-works")} className="text-[16px] font-medium text-[var(--color-graphite-metadata)] hover:text-[var(--color-structural-ink)] transition-colors tracking-tight">How it Works</button>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-[16px] font-semibold text-[var(--color-structural-ink)] hover:text-[var(--color-graphite-metadata)] transition-colors tracking-tight">
                Log In
              </Link>
              <Link href="/signup">
                <Button variant="primary">
                  Get started
                </Button>
              </Link>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-[var(--color-structural-ink)]">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden bg-[var(--color-absolute-canvas)] border-b border-[var(--color-boundary-frame)] absolute w-full px-6 py-6 flex flex-col gap-4 shadow-[var(--shadow-xl)] z-50"
            >
              <button onClick={() => scrollTo("features")} className="text-left py-2 text-[var(--color-graphite-metadata)] text-[16px] font-medium tracking-tight">Features</button>
              <button onClick={() => scrollTo("how-it-works")} className="text-left py-2 text-[var(--color-graphite-metadata)] text-[16px] font-medium tracking-tight">How it Works</button>
              <div className="h-px bg-[var(--color-boundary-frame)] my-2" />
              <Link href="/login" className="py-2 text-[var(--color-structural-ink)] font-semibold text-[16px] tracking-tight">Log In</Link>
              <Link href="/signup">
                <Button variant="primary" className="w-full">Get Started</Button>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* 2. HERO SECTION */}
      <main className="flex-1 pt-40 pb-24 relative z-10">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-12 flex flex-col items-center text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center max-w-5xl">
            
            <motion.h1 variants={fadeInUp} className="text-6xl md:text-8xl lg:text-[110px] font-sans font-bold tracking-[-0.03em] leading-[0.95] mb-8 text-[var(--color-structural-ink)]">
              Your business.
              <br/>
              Built in seconds.
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-xl md:text-2xl text-[var(--color-graphite-metadata)] max-w-3xl mb-12 leading-[1.4] font-medium tracking-tight">
              Describe what you do — NicheFlow builds your entire business operating system. Bookings, clients, invoices, inventory and more. Tailored to your niche.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-10">
              <Link href="/signup">
                <Button variant="primary" size="lg" className="w-full sm:w-auto h-14 rounded-full px-8 text-[18px]">
                  Get started for free
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* GENERATOR MOCKUP - PROMPT PANEL STYLE */}
          <motion.div 
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-4xl bg-[var(--color-absolute-canvas)] rounded-[var(--radius-floatingpanels)] p-8 mt-10 shadow-[var(--shadow-xl)] relative"
          >
            <div className="bg-[#f7f7f7] rounded-[8px] p-6 flex flex-col md:flex-row items-center justify-between border border-[var(--color-boundary-frame)] gap-4">
              <div className="flex items-center text-left flex-1 w-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, ease: "linear", delay: 1 }}
                  className="overflow-hidden whitespace-nowrap font-medium text-[var(--color-structural-ink)] text-[20px] tracking-tight"
                >
                  I run a dog training business in Chennai...
                </motion.div>
                <motion.div 
                  animate={{ opacity: [1, 0] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="w-[2px] h-[24px] bg-[var(--color-structural-ink)] ml-1 shrink-0"
                />
              </div>
              <Button variant="contextual" className="shrink-0 w-full md:w-auto">
                Generate <Sparkles className="w-4 h-4 ml-2"/>
              </Button>
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5 }}
              className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
            >
              {[
                { label: "Bookings", status: "Configured" },
                { label: "Clients", status: "Database Ready" },
                { label: "Invoices", status: "Templates Set" },
                { label: "Inventory", status: "Linked" }
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 4.2 + (i * 0.2) }}
                  className="bg-[#ffffff] border border-[var(--color-boundary-frame)] rounded-[0px] p-4 flex flex-col items-start gap-1 text-left shadow-sm"
                >
                  <span className="font-bold text-[16px] text-[var(--color-structural-ink)] tracking-tight">{item.label}</span>
                  <span className="text-[12px] font-mono text-[var(--color-graphite-metadata)] tracking-wider uppercase">{item.status}</span>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </main>

      {/* 3. NICHE TICKER */}
      <div className="w-full overflow-hidden border-y border-[var(--color-boundary-frame)] py-6 bg-[var(--color-absolute-canvas)] relative z-10">
        <div className="flex whitespace-nowrap animate-scroll w-[200%]">
          {[1, 2].map((group) => (
            <div key={group} className="flex items-center text-[24px] font-bold text-[var(--color-structural-ink)] w-1/2 justify-around tracking-[-0.02em]">
              <span>Dog Trainers</span><span className="text-[var(--color-boundary-frame)] mx-8">—</span>
              <span>Urban Farmers</span><span className="text-[var(--color-boundary-frame)] mx-8">—</span>
              <span>Tailoring Shops</span><span className="text-[var(--color-boundary-frame)] mx-8">—</span>
              <span>Home Repair</span><span className="text-[var(--color-boundary-frame)] mx-8">—</span>
              <span>Photography Studios</span><span className="text-[var(--color-boundary-frame)] mx-8">—</span>
              <span>Event Planners</span><span className="text-[var(--color-boundary-frame)] mx-8">—</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PROBLEM SECTION */}
      <section id="features" className="py-32 px-6 lg:px-12 max-w-[1440px] mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-sans font-bold mb-6 tracking-[-0.03em]">63M businesses.<br/>3% have software.</h2>
          <p className="text-xl text-[var(--color-graphite-metadata)] leading-[1.4] font-medium">
            Most niche business owners in India manage everything on paper, WhatsApp, or Excel. NicheFlow changes that by bringing enterprise-grade tools to your local business.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCounter value={63} suffix="M+" label="Small businesses in India" />
          <StatCounter value={97} suffix="%" label="Have no dedicated software" />
          <StatCounter value={11} suffix="hrs" label="Lost per week to manual work" />
        </div>
      </section>

      {/* 5. FEATURES BENTO GRID */}
      <section className="py-32 px-6 lg:px-12 max-w-[1440px] mx-auto border-t border-[var(--color-boundary-frame)]">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-20"
        >
          <h2 className="text-5xl md:text-7xl font-sans font-bold tracking-[-0.03em]">Everything your business needs</h2>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {/* Large Card */}
          <SpotlightCard className="lg:col-span-2 lg:row-span-2 flex flex-col bg-[#fcfcfc]">
            <div className="w-14 h-14 bg-[var(--color-structural-ink)] rounded-full flex items-center justify-center text-[#ffffff] mb-8">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-4xl font-bold mb-4 text-[var(--color-structural-ink)] tracking-[-0.02em]">AI Assistant Built-in</h3>
            <p className="text-[var(--color-graphite-metadata)] mb-10 leading-[1.4] text-[18px] font-medium">Talk to your data. Ask your AI agent to book appointments, analyze revenue, or send invoice reminders—all using natural language.</p>
            <div className="mt-auto bg-[#ffffff] rounded-[0px] p-6 border border-[var(--color-boundary-frame)] flex items-center gap-4">
              <div className="flex space-x-1.5">
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0 }} className="w-2 h-2 bg-[var(--color-structural-ink)]" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-[var(--color-structural-ink)]" />
                <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-[var(--color-structural-ink)]" />
              </div>
              <span className="text-[14px] font-mono font-bold tracking-wider uppercase text-[var(--color-structural-ink)]">Analyzing Revenue</span>
            </div>
          </SpotlightCard>

          {/* Medium Cards */}
          <SpotlightCard>
            <h3 className="text-2xl font-bold mb-2 text-[var(--color-structural-ink)] tracking-tight">Smart Bookings</h3>
            <p className="text-[16px] font-medium text-[var(--color-graphite-metadata)] leading-[1.4]">Schedule and manage appointments effortlessly.</p>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="text-2xl font-bold mb-2 text-[var(--color-structural-ink)] tracking-tight">Client Hub</h3>
            <p className="text-[16px] font-medium text-[var(--color-graphite-metadata)] leading-[1.4]">Keep track of every client, their history and spend.</p>
          </SpotlightCard>

          {/* Small Cards */}
          <SpotlightCard>
            <h3 className="text-2xl font-bold mb-2 text-[var(--color-structural-ink)] tracking-tight">Invoicing</h3>
            <p className="text-[16px] font-medium text-[var(--color-graphite-metadata)] leading-[1.4]">Create and send professional GST invoices.</p>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="text-2xl font-bold mb-2 text-[var(--color-structural-ink)] tracking-tight">Inventory</h3>
            <p className="text-[16px] font-medium text-[var(--color-graphite-metadata)] leading-[1.4]">Track stock and get automated low-stock alerts.</p>
          </SpotlightCard>

          <SpotlightCard className="lg:col-span-2">
            <h3 className="text-2xl font-bold mb-2 text-[var(--color-structural-ink)] tracking-tight">Public Business Page</h3>
            <p className="text-[16px] font-medium text-[var(--color-graphite-metadata)] leading-[1.4]">Your own beautiful webpage where clients can find you and book directly.</p>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="text-2xl font-bold mb-2 text-[var(--color-structural-ink)] tracking-tight">8 Languages</h3>
            <p className="text-[16px] font-medium text-[var(--color-graphite-metadata)]">Works natively in Hindi, Tamil, Telugu, and more.</p>
          </SpotlightCard>

          <SpotlightCard>
            <h3 className="text-2xl font-bold mb-2 text-[var(--color-structural-ink)] tracking-tight">Simple Mode</h3>
            <p className="text-[16px] font-medium text-[var(--color-graphite-metadata)]">Clean, distraction-free interface for every user.</p>
          </SpotlightCard>

        </motion.div>
      </section>

      {/* 6. TESTIMONIALS (COMMUNITY CARDS) */}
      <section className="py-32 border-t border-[var(--color-boundary-frame)] bg-[#f7f7f7]">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16 px-6"
        >
          <h2 className="text-5xl md:text-7xl font-sans font-bold tracking-[-0.03em]">Operators who switched</h2>
        </motion.div>

        <div className="w-full overflow-hidden pb-8">
          <div className="flex animate-scroll w-[200%] gap-6 px-6">
            {[1, 2].map((group) => (
              <React.Fragment key={group}>
                {[
                  { q: "Finally software that understands my dog training business. My clients love the booking page.", n: "Riya S.", r: "Dog Trainer, Bangalore" },
                  { q: "I track all my crop inventory and client orders in one place now. No more notebooks.", n: "Manoj K.", r: "Urban Farmer, Pune" },
                  { q: "The invoice feature alone saved me hours every week.", n: "Fatima A.", r: "Tailor, Chennai" },
                  { q: "Stopped losing track of repair jobs. Now everything is in one place.", n: "Vijay R.", r: "Home Repair, Hyderabad" }
                ].map((t, i) => (
                  <div key={i} className="min-w-[400px] max-w-[400px] bg-[var(--color-absolute-canvas)] border border-[var(--color-boundary-frame)] rounded-[0px] p-8 flex flex-col justify-between whitespace-normal">
                    <p className="text-[24px] font-bold tracking-tight mb-12 leading-[1.3]">"{t.q}"</p>
                    <div className="flex flex-col gap-1 border-t border-[var(--color-boundary-frame)] pt-6">
                      <p className="font-bold text-[16px]">{t.n}</p>
                      <p className="text-[12px] font-mono text-[var(--color-graphite-metadata)] uppercase tracking-wider">{t.r}</p>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 7. FINAL CTA */}
      <section className="py-40 border-y border-[var(--color-boundary-frame)] bg-[var(--color-absolute-canvas)] text-center">
        <div className="max-w-[1440px] mx-auto px-6">
          <h2 className="text-6xl md:text-9xl font-sans font-bold mb-8 tracking-[-0.04em]">Your software<br/>is waiting.</h2>
          <Link href="/signup">
            <Button variant="primary" size="lg" className="rounded-full px-12 h-16 text-[18px]">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="bg-[var(--color-absolute-canvas)] py-12 px-6 lg:px-12 border-t border-[var(--color-boundary-frame)]">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-[20px] tracking-[-0.04em] font-sans">nicheflow</span>
          </div>
          
          <div className="flex items-center gap-8 text-[14px] font-bold text-[var(--color-graphite-metadata)]">
            <Link href="#" className="hover:text-[var(--color-structural-ink)] transition-colors">Product</Link>
            <Link href="#" className="hover:text-[var(--color-structural-ink)] transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-[var(--color-structural-ink)] transition-colors">About</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
