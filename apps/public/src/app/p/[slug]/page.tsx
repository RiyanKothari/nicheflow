import { notFound } from 'next/navigation';

export default function PublicPage({ params }: { params: { slug: string } }) {
  // In a real app, we would fetch data for params.slug from Supabase
  const slug = params.slug;
  
  if (!slug) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-[#FEF3C7] text-[#1C1917] font-sans selection:bg-[#F97316]/30">
      <header className="px-6 py-8 md:px-12 md:py-12 border-b border-[#1C1917]/10 flex justify-between items-center bg-[#FEF3C7]/80 backdrop-blur sticky top-0 z-50">
        <h1 className="text-2xl font-bold font-serif">Business {slug}</h1>
        <button className="bg-[#F97316] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#F97316]/90 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
          Book Now
        </button>
      </header>

      <main className="px-6 py-16 md:px-12 max-w-5xl mx-auto">
        <section className="text-center mb-24">
          <h2 className="text-5xl md:text-7xl font-bold font-serif mb-6 leading-tight">
            Premium Services <br className="hidden md:block"/> Tailored For You.
          </h2>
          <p className="text-xl text-[#1C1917]/70 max-w-2xl mx-auto mb-10">
            Welcome to our official booking page. Select a service below to get started and instantly secure your appointment.
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example Service Cards */}
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-3xl p-6 shadow-sm border border-black/5 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
              <div className="aspect-video bg-[#FDE68A] rounded-2xl mb-6"></div>
              <h3 className="text-xl font-bold font-serif mb-2">Signature Service {i}</h3>
              <p className="text-[#1C1917]/60 text-sm mb-6">Experience our most popular offering tailored perfectly to your specific requirements.</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">₹ 1,500</span>
                <button className="text-[#F97316] font-semibold hover:bg-[#F97316]/10 px-4 py-2 rounded-full transition-colors">Select</button>
              </div>
            </div>
          ))}
        </section>
      </main>

      <footer className="px-6 py-12 md:px-12 border-t border-[#1C1917]/10 text-center text-[#1C1917]/50 text-sm">
        <p>Powered by NicheFlow</p>
      </footer>
    </div>
  );
}
