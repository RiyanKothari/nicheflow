import React, { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { motion, useInView, useAnimation, animate } from "framer-motion";
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
  }, [isInView, value]);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center justify-center text-center shadow-lg"
    >
      <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">
        {count}{suffix}
      </div>
      <div className="text-muted-foreground font-medium">{label}</div>
    </motion.div>
  );
}

export function Landing() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTab((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const scrollTo = (id: string) => {
    setIsMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
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
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm" : "bg-transparent"}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <span className="font-display font-bold text-xl tracking-tight">NicheFlow</span>
            </div>
            
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollTo("features")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</button>
              <button onClick={() => scrollTo("how-it-works")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</button>
              <button onClick={() => scrollTo("pricing")} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Pricing</button>
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                Log In
              </Link>
              <Link href="/signup" className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5">
                Get Started Free
              </Link>
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="p-2 text-foreground">
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-card border-b border-border absolute w-full px-4 py-4 flex flex-col gap-4 shadow-xl">
            <button onClick={() => scrollTo("features")} className="text-left py-2 text-muted-foreground">Features</button>
            <button onClick={() => scrollTo("how-it-works")} className="text-left py-2 text-muted-foreground">How it Works</button>
            <button onClick={() => scrollTo("pricing")} className="text-left py-2 text-muted-foreground">Pricing</button>
            <div className="h-px bg-border my-2" />
            <Link href="/login" className="py-2 text-muted-foreground">Log In</Link>
            <Link href="/signup" className="py-2 text-primary font-medium">Get Started Free</Link>
          </div>
        )}
      </nav>

      {/* 2. HERO SECTION */}
      <main className="flex-1 pt-32 pb-20 relative z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
          <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="flex flex-col items-center max-w-4xl">
            
            <motion.h1 variants={fadeInUp} className="text-4xl sm:text-5xl md:text-7xl font-display font-extrabold tracking-tight leading-[1.1] mb-6">
              Your business. Your software. <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">Built in seconds.</span>
            </motion.h1>
            
            <motion.p variants={fadeInUp} className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10 leading-relaxed">
              Describe what you do — NicheFlow builds your entire business operating system. Bookings, clients, invoices, inventory and more. Tailored to your niche.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mb-6">
              <Link href="/signup" className="px-8 py-4 bg-primary text-primary-foreground font-semibold rounded-xl text-lg flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
                Get Started Free
              </Link>
              <button onClick={() => scrollTo("how-it-works")} className="px-8 py-4 border border-border bg-card text-foreground font-semibold rounded-xl text-lg flex items-center justify-center gap-2 hover:bg-muted transition-all duration-300">
                Watch How It Works
              </button>
            </motion.div>
            
            <motion.div variants={fadeInUp} className="text-sm text-muted-foreground flex items-center justify-center flex-wrap gap-2 mb-16">
              <span>No credit card required</span>
              <span className="text-primary font-bold">·</span>
              <span>Setup in 30 seconds</span>
              <span className="text-primary font-bold">·</span>
              <span>Works in 8 languages</span>
            </motion.div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="w-full max-w-3xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden p-6 md:p-8 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
            
            <div className="bg-background border border-border rounded-xl p-4 flex items-center mb-6">
              <Sparkles className="w-5 h-5 text-primary mr-3 shrink-0" />
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "linear", delay: 1 }}
                className="overflow-hidden whitespace-nowrap text-left font-medium text-foreground/90"
              >
                I run a dog training business in Chennai...
              </motion.div>
              <motion.div 
                animate={{ opacity: [1, 0] }}
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="w-0.5 h-5 bg-primary ml-1 shrink-0"
              />
            </div>
            
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3.5 }}
              className="mb-6 text-left"
            >
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Generating your workspace...</span>
                <span className="text-primary">100%</span>
              </div>
              <div className="h-1.5 w-full bg-border rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 1.5, delay: 3.5 }}
                  className="h-full bg-primary"
                />
              </div>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "Bookings", icon: Calendar },
                { label: "Clients", icon: Users },
                { label: "Invoices", icon: Receipt },
                { label: "Inventory", icon: Package }
              ].map((item, i) => (
                <motion.div
                  key={item.label}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 5.2 + (i * 0.3) }}
                  className="bg-background border border-success/30 rounded-lg p-3 flex items-center gap-3"
                >
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  <span className="font-medium">{item.label} — Ready</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </main>

      {/* 3. NICHE TICKER */}
      <div className="w-full overflow-hidden border-y border-border bg-card py-3">
        <div className="flex whitespace-nowrap animate-scroll w-[200%]">
          {[1, 2].map((group) => (
            <div key={group} className="flex items-center text-sm font-medium text-muted-foreground w-1/2 justify-around">
              <span>Dog Trainers</span><span className="text-primary mx-4">·</span>
              <span>Urban Farmers</span><span className="text-primary mx-4">·</span>
              <span>Tailoring Shops</span><span className="text-primary mx-4">·</span>
              <span>Home Repair</span><span className="text-primary mx-4">·</span>
              <span>Photography Studios</span><span className="text-primary mx-4">·</span>
              <span>Event Planners</span><span className="text-primary mx-4">·</span>
              <span>Music Teachers</span><span className="text-primary mx-4">·</span>
              <span>Yoga Instructors</span><span className="text-primary mx-4">·</span>
              <span>Freelance Tutors</span><span className="text-primary mx-4">·</span>
              <span>Local Caterers</span><span className="text-primary mx-4">·</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. PROBLEM SECTION */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">63 million businesses. 3% have software.</h2>
          <p className="text-lg text-muted-foreground">
            Most niche business owners in India manage everything on paper, WhatsApp, or Excel. NicheFlow changes that.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCounter value={63} suffix="M+" label="Small businesses in India" />
          <StatCounter value={97} suffix="%" label="Have no dedicated software" />
          <StatCounter value={11} suffix="hrs" label="Lost per week to manual work" />
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section id="how-it-works" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold">Three steps to your business OS</h2>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
        >
          {[
            { num: "01", icon: MessageSquare, title: "Describe", desc: "Type what your business does in plain language" },
            { num: "02", icon: Sparkles, title: "Generate", desc: "AI builds your complete workspace in seconds" },
            { num: "03", icon: LayoutDashboard, title: "Run", desc: "Manage everything from one place, in your language" }
          ].map((step, i) => (
            <motion.div key={i} variants={fadeInUp} className="bg-card border border-border rounded-2xl p-8 relative overflow-hidden group hover:border-primary/40 transition-colors">
              <div className="absolute top-6 right-6 text-5xl font-display font-bold text-primary/10 group-hover:text-primary/20 transition-colors">{step.num}</div>
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
                <step.icon className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 6. NICHE SHOWCASE */}
      <section id="showcase" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Built for your industry. Not everyone else's.</h2>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {["Dog Trainer", "Urban Farmer", "Tailor", "Home Repair"].map((tab, i) => (
              <button
                key={i}
                onClick={() => setActiveTab(i)}
                className={`px-6 py-2 rounded-full font-medium transition-all ${
                  activeTab === i 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-card hover:text-foreground border border-transparent hover:border-border"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 min-h-[300px] relative shadow-2xl overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-[50px] pointer-events-none" />
            
            {activeTab === 0 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h3 className="text-xl font-bold border-b border-border pb-4 mb-4">Dog Training Dashboard</h3>
                <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                  <div><p className="text-sm text-muted-foreground">Next Session</p><p className="font-semibold">Bruno (Labrador) - Advanced</p></div>
                  <div className="text-right"><p className="text-sm text-primary font-medium">Today, 4:00 PM</p></div>
                </div>
                <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                  <div><p className="text-sm text-muted-foreground">New Client Request</p><p className="font-semibold">Max (German Shepherd)</p></div>
                  <button className="px-3 py-1 bg-primary/10 text-primary rounded text-sm font-medium">Review</button>
                </div>
              </motion.div>
            )}

            {activeTab === 1 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <h3 className="text-xl font-bold border-b border-border pb-4 mb-4">Farm Operations</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-background rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground">Inventory Alert</p>
                    <p className="font-semibold text-warning">Tomato Seedlings: Low (24)</p>
                  </div>
                  <div className="p-4 bg-background rounded-xl border border-border">
                    <p className="text-sm text-muted-foreground">Weekly Revenue</p>
                    <p className="font-semibold text-success">₹18,400</p>
                  </div>
                </div>
                <div className="p-4 bg-background rounded-xl border border-border mt-4">
                  <p className="text-sm text-muted-foreground mb-1">Active Orders</p>
                  <p className="font-semibold">12x Organic Veggie Box for Saturday Delivery</p>
                </div>
              </motion.div>
            )}

            {activeTab === 2 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <h3 className="text-xl font-bold border-b border-border pb-4 mb-4">Tailor Studio</h3>
                <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                  <div><p className="font-semibold">Rahul Sharma - Bespoke Suit</p><p className="text-sm text-muted-foreground">Measurements: 42 Chest, 32 Waist</p></div>
                  <span className="px-2 py-1 bg-warning/20 text-warning text-xs rounded-full font-medium">In Progress</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                  <div><p className="font-semibold">Overdue Invoice</p><p className="text-sm text-muted-foreground">INV-0089</p></div>
                  <p className="text-destructive font-bold">₹2,200</p>
                </div>
              </motion.div>
            )}

            {activeTab === 3 && (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
                <h3 className="text-xl font-bold border-b border-border pb-4 mb-4">Field Service View</h3>
                <div className="p-4 bg-background rounded-xl border border-border border-l-4 border-l-primary">
                  <div className="flex justify-between items-start mb-2">
                    <div><p className="font-bold text-lg">Fix Geyser Leak</p><p className="text-sm text-muted-foreground">Whitefield, Bangalore</p></div>
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-full font-medium">9:00 AM</span>
                  </div>
                  <p className="text-sm">Status: Confirmed</p>
                </div>
                <div className="flex items-center justify-between p-4 bg-background rounded-xl border border-border">
                  <div><p className="font-semibold">Recent Payment</p><p className="text-sm text-muted-foreground">INV-0047</p></div>
                  <p className="text-success font-bold">+₹3,500</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* 7. FEATURES BENTO GRID */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border bg-card/30">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold">Everything your business needs</h2>
        </motion.div>

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          {/* Large Card */}
          <motion.div variants={fadeInUp} className="bg-card border border-border rounded-2xl p-6 lg:col-span-2 lg:row-span-2 hover:-translate-y-1 hover:border-primary/40 transition-all flex flex-col">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-bold mb-3">AI Workspace Generator</h3>
            <p className="text-muted-foreground mb-8">Describe your business, AI builds everything. Bookings, clients, invoices — all set up in seconds.</p>
            <div className="mt-auto bg-background rounded-lg p-4 border border-border flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="text-sm text-muted-foreground font-mono">Generating modules...</span>
            </div>
          </motion.div>

          {/* Medium Cards */}
          <motion.div variants={fadeInUp} className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 hover:border-primary/40 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Smart Bookings</h3>
            <p className="text-sm text-muted-foreground">Schedule and manage appointments effortlessly</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 hover:border-primary/40 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Client Management</h3>
            <p className="text-sm text-muted-foreground">Keep track of every client, their history and spend</p>
          </motion.div>

          {/* Small Cards */}
          <motion.div variants={fadeInUp} className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 hover:border-primary/40 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
              <Receipt className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Invoicing</h3>
            <p className="text-sm text-muted-foreground">Create and send professional invoices</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 hover:border-primary/40 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Inventory</h3>
            <p className="text-sm text-muted-foreground">Track stock and get low-stock alerts</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-card border border-border rounded-2xl p-6 lg:col-span-2 hover:-translate-y-1 hover:border-primary/40 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
              <Globe className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Public Business Page</h3>
            <p className="text-sm text-muted-foreground">Your own webpage clients can find and book from</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 hover:border-primary/40 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">8 Languages</h3>
            <p className="text-sm text-muted-foreground">Works in Hindi, Tamil, Telugu, and more</p>
          </motion.div>

          <motion.div variants={fadeInUp} className="bg-card border border-border rounded-2xl p-6 hover:-translate-y-1 hover:border-primary/40 transition-all">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary mb-4">
              <Eye className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold mb-2">Simple Mode</h3>
            <p className="text-sm text-muted-foreground">Clean, distraction-free interface for every user</p>
          </motion.div>

        </motion.div>
      </section>

      {/* 8. TESTIMONIALS */}
      <section className="py-24 border-t border-border overflow-hidden bg-background">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-16 px-4"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold">Operators who switched to NicheFlow</h2>
        </motion.div>

        <div className="w-full overflow-hidden pb-8">
          <div className="flex animate-scroll w-[200%] gap-6 px-6">
            {[1, 2].map((group) => (
              <React.Fragment key={group}>
                {[
                  { q: "Finally software that understands my dog training business. My clients love the booking page.", n: "Riya S.", r: "Dog Trainer, Bangalore" },
                  { q: "I track all my crop inventory and client orders in one place now. No more notebooks.", n: "Manoj K.", r: "Urban Farmer, Pune" },
                  { q: "The invoice feature alone saved me hours every week.", n: "Fatima A.", r: "Tailor, Chennai" },
                  { q: "Stopped losing track of repair jobs. Now everything is in one place.", n: "Vijay R.", r: "Home Repair, Hyderabad" },
                  { q: "My photography clients can book sessions directly from my public page.", n: "Priya N.", r: "Photographer, Mumbai" },
                  { q: "NicheFlow is what I wished Excel could be. Simple yet powerful.", n: "Karan D.", r: "Freelance Tutor, Delhi" }
                ].map((t, i) => (
                  <div key={i} className="min-w-[320px] max-w-[320px] bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col justify-between whitespace-normal">
                    <p className="italic text-foreground mb-6 leading-relaxed">"{t.q}"</p>
                    <div>
                      <p className="font-semibold text-sm">{t.n}</p>
                      <p className="text-xs text-muted-foreground">{t.r}</p>
                    </div>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 9. PRICING */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-border">
        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-5xl font-display font-bold mb-6">Start free. Upgrade when you're ready.</h2>
          
          <div className="flex items-center justify-center gap-4 mt-8">
            <span className={`text-sm font-medium ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Monthly</span>
            <button 
              onClick={() => setIsAnnual(!isAnnual)}
              className="w-14 h-8 bg-card border border-border rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-primary rounded-full transition-transform ${isAnnual ? "translate-x-6" : ""}`} />
            </button>
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}>Annual</span>
              <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-full">Save 40%</span>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Free Card */}
          <motion.div variants={fadeInUp} className="bg-card border border-border rounded-2xl p-8 flex flex-col">
            <h3 className="text-2xl font-bold mb-2">Free Forever</h3>
            <div className="text-4xl font-display font-extrabold mb-6">₹0</div>
            
            <ul className="space-y-4 mb-8 flex-1">
              {["Bookings", "Clients", "Tasks", "Dashboard", "AI Onboarding", "Public Page (limited)"].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <Check className="w-5 h-5 text-muted-foreground shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            
            <Link href="/signup" className="w-full py-3 rounded-xl border border-border bg-transparent text-foreground font-semibold flex items-center justify-center hover:bg-muted transition-colors">
              Get Started Free
            </Link>
          </motion.div>

          {/* Premium Card */}
          <motion.div variants={fadeInUp} className="bg-card border-2 border-primary rounded-2xl p-8 flex flex-col relative shadow-xl shadow-primary/10">
            <div className="absolute top-0 right-8 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
              Most Popular
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Premium</h3>
            <div className="text-4xl font-display font-extrabold mb-2">
              {isAnnual ? "₹299" : "₹499"}
              <span className="text-lg text-muted-foreground font-normal">/mo</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 h-5">{isAnnual ? "Billed annually" : ""}</p>
            
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3 text-sm font-medium pb-2 border-b border-border">
                <Check className="w-5 h-5 text-primary shrink-0" />
                <span>All Free features, plus:</span>
              </li>
              {["Invoicing", "Full Inventory", "Unlimited Public Page", "Advanced Analytics", "Priority Support", "Custom Domain"].map((f, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            
            <Link href="/signup" className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold flex items-center justify-center shadow-lg shadow-primary/40 hover:-translate-y-0.5 transition-all">
              Upgrade to Premium
            </Link>
          </motion.div>
        </div>
        
        <p className="text-center text-sm text-muted-foreground mt-8">No hidden fees. Cancel anytime.</p>
      </section>

      {/* 10. FINAL CTA */}
      <section className="relative py-32 border-y border-border bg-card overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-6xl font-display font-extrabold mb-4">Your software is waiting.</h2>
          <p className="text-xl text-muted-foreground mb-10">Just describe what you do.</p>
          <Link href="/signup" className="inline-flex items-center justify-center px-10 py-5 bg-primary text-primary-foreground font-bold rounded-xl text-lg shadow-xl shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300">
            Get Started Free
          </Link>
          <p className="text-sm text-muted-foreground mt-6">Join 500+ niche businesses already on NicheFlow</p>
        </div>
      </section>

      {/* 11. FOOTER */}
      <footer className="bg-background border-t border-border py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <span className="font-display font-bold text-lg">NicheFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">Built for the 97%</p>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="#" className="hover:text-foreground transition-colors">Product</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Pricing</Link>
            <Link href="#" className="hover:text-foreground transition-colors">About</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Contact</Link>
          </div>
          
          <div className="text-sm text-muted-foreground">
            Made with <span className="text-destructive">♥</span> in India
          </div>
        </div>
      </footer>
    </div>
  );
}
