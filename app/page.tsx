import Link from "next/link"
import { Button } from "@/components/ui/button"
import { getProducts } from "@/dal/products"
import { ProductCard } from "@/components/storefront/product-card"
import { StorefrontLayout } from "@/components/storefront/storefront-layout"
import { ArrowRight, Box, ShieldCheck, Truck, Trophy } from "lucide-react"

export const revalidate = 60

export default async function HomePage() {
  const { products } = await getProducts(1, 8)

  return (
    <StorefrontLayout>
      {/* 1. HERO */}
      <section className="section-white relative min-h-[95vh] flex items-center overflow-hidden border-b border-brand-navy/5">
        <div className="max-w-[1440px] mx-auto px-8 md:px-12 w-full grid lg:grid-cols-2 gap-20 items-center relative z-10 pt-32">
          <div className="space-y-10 animate-in fade-in slide-in-from-left-8 duration-1000">
            <div className="space-y-4">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-brand-navy flex items-center gap-3">
                <span className="w-8 h-[1.5px] bg-brand-navy"></span>
                Trusted Since 1964
              </span>
              <h1 className="text-6xl md:text-8xl font-serif tracking-tighter text-brand-navy leading-[0.95] drop-shadow-sm">
                Handcrafted <br />
                <span className="italic opacity-60">Metals & Art</span>
              </h1>
            </div>

            <p className="text-lg md:text-xl text-brand-navy/60 max-w-xl font-sans leading-relaxed border-l-2 border-brand-navy/10 pl-8">
              Exquisite brass idols, timeless home decor, and heritage copper utensils — orchestrated with precision and delivered with integrity.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 pt-6">
              <Button asChild size="lg" className="bg-brand-navy text-white hover:bg-brand-surface transition-all duration-500 text-sm px-12 h-14 rounded-none uppercase tracking-[0.2em] font-bold shadow-2xl shadow-brand-navy/20 group border-0">
                <Link href="/products" className="flex items-center gap-3">
                  Shop Now <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="ghost" className="text-brand-navy border border-brand-navy/10 hover:bg-brand-navy/5 transition-all text-sm px-12 h-14 rounded-none uppercase tracking-[0.2em] font-bold">
                <Link href="/products">
                  Our Story
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative hidden lg:block animate-in fade-in zoom-in-95 duration-1000 delay-300">
            <div className="aspect-[4/5] bg-zinc-100 relative overflow-hidden rounded-none border border-brand-navy/5">
              <img
                src="/images/hero.webp"
                className="w-full h-full object-cover opacity-90"
                alt="Metal Craft"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-brand-navy/80 via-transparent to-transparent" />
              <div className="absolute bottom-10 left-10 space-y-2">
                <p className="text-xs uppercase tracking-[0.3em] text-white/60 font-bold">Handcrafted</p>
                <p className="text-3xl font-serif text-white italic tracking-tighter">Premium Collection</p>
              </div>
            </div>
            <div className="absolute -inset-4 border border-brand-navy/10 -z-10 translate-x-4 translate-y-4"></div>
          </div>
        </div>

        <div className="absolute bottom-12 right-12 hidden md:flex items-center gap-4">
          <span className="text-[9px] uppercase tracking-[0.5em] text-brand-navy/30 font-bold rotate-90 origin-right whitespace-nowrap">Quality First</span>
          <div className="w-[1.5px] h-24 bg-brand-navy/10"></div>
        </div>
      </section>

      {/* 2. TRUST STRIP */}
      <section className="bg-brand-navy py-24 relative overflow-hidden">
        <div className="max-w-[1440px] mx-auto px-8 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-16 relative z-10">
          {[
            { icon: Truck, title: "Fast Delivery", desc: "Reliable shipping across India with industrial-grade packaging." },
            { icon: ShieldCheck, title: "Quality Assured", desc: "Every piece undergoes rigorous inspection before dispatch." },
            { icon: Box, title: "Best Prices", desc: "Transparent pricing directly from our manufacturing unit." },
            { icon: Trophy, title: "Since 1964", desc: "Half a century of metallurgical excellence and trust." },
          ].map((f) => (
            <div key={f.title} className="space-y-6 group">
              <div className="w-12 h-12 bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:bg-white/10 group-hover:scale-110">
                <f.icon className="w-5 h-5 text-white/70" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-[11px] uppercase tracking-[0.2em] text-white">{f.title}</h3>
                <p className="text-[13px] text-white/50 leading-relaxed font-sans">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. COLLECTION */}
      <section className="section-white py-32 bg-white">
        <div className="max-w-[1440px] mx-auto px-8 md:px-12">
          <div className="flex flex-col md:flex-row items-end justify-between mb-20 gap-8">
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-navy/40">Inventory</span>
                <div className="w-12 h-[1px] bg-brand-navy/10"></div>
              </div>
              <h2 className="text-5xl md:text-6xl font-serif text-brand-navy tracking-tighter">Shop Our Collection</h2>
              <p className="text-brand-navy/50 font-sans max-w-md leading-relaxed text-lg">
                Precision-crafted idols and heritage utensils, designed for the discerning collector.
              </p>
            </div>
            <Link
              href="/products"
              className="group flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] font-bold text-brand-navy hover:opacity-60 transition-all pb-4 border-b border-brand-navy/10"
            >
              Examine All Records <ArrowRight className="w-4 h-4 group-hover:translate-x-3 transition-transform duration-500" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-20">
            {products.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* 4. HERITAGE */}
      <section className="bg-brand-navy py-40 relative overflow-hidden border-y border-white/5">
        <div className="absolute inset-0 opacity-10 grayscale"></div>
        <div className="relative z-10 max-w-4xl mx-auto px-8 space-y-12 text-center">
          <div className="space-y-8">
            <span className="text-[10px] uppercase tracking-[0.5em] text-white/40 font-bold">The Heritage</span>
            <h2 className="text-5xl md:text-7xl font-serif text-white leading-[1.1] tracking-tighter">
              Three Generations <br />
              <span className="italic opacity-60 text-brand-gold">of Integrity</span>
            </h2>
            <p className="text-white/50 font-sans leading-relaxed text-xl max-w-2xl mx-auto italic">
              "Established in 1964, Jain Metals evolved from a traditional workshop into a hallmark of quality. Today, we continue the legacy of metallurgical precision, ethical commerce, and enduring value."
            </p>
          </div>

          <div className="flex flex-col items-center gap-8 pt-8">
            <div className="w-24 h-[1.5px] bg-white/10"></div>
            <p className="text-[10px] uppercase tracking-[0.4em] text-white/40 font-bold">Established 1964</p>
            <Button asChild variant="outline" className="border-white/10 text-brand-navy hover:bg-white hover:text-brand-gold hover:text-[15px] rounded-none h-14 px-12 transition-all duration-700 uppercase tracking-widest text-[10px]">
              <Link href="/products">Shop Inventory</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* 5. WHATSAPP CONTACT */}
      <section className="section-white py-32 relative overflow-hidden bg-white">
        <div className="max-w-[1440px] mx-auto px-8 md:px-12 grid lg:grid-cols-2 gap-20 items-center">
          <div className="space-y-10">
            <div className="space-y-4">
              <h3 className="text-4xl md:text-5xl font-serif text-brand-navy tracking-tighter leading-tight">Professional Consultation<br />Direct Channel</h3>
              <p className="text-brand-navy/50 leading-relaxed font-sans text-lg border-l-4 border-brand-navy pl-10 max-w-lg">
                Inquire about custom orders, bulk acquisitions, or product specifics.
                Our team is available for real-time correspondence via encrypted chat.
              </p>
            </div>
            <div className="pt-6">
              <Button asChild size="lg" className="bg-brand-navy text-white hover:bg-brand-surface transition-all duration-500 text-[10px] px-14 h-18 rounded-none uppercase tracking-[0.3em] font-bold shadow-2xl shadow-brand-navy/10 group">

                <a href={`https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "919000000000"}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4"
                >
                  Chat on WhatsApp <ArrowRight className="w-4 h-4 group-hover:translate-x-3 transition-transform" />
                </a>
              </Button>
            </div>
          </div>
          <div className="relative group overflow-hidden border border-brand-navy/5">
            <img
              src="/images/website 003.webp"
              className="w-full h-full object-cover aspect-video object-center grayscale hover:grayscale-0 transition-all duration-1000"
              alt="Industrial Products"
            />
            <div className="absolute inset-0 border-[20px] border-white/5 m-4 pointer-events-none"></div>
          </div>
        </div>
      </section>
    </StorefrontLayout >
  )
}