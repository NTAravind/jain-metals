import Link from "next/link"
import { ArrowRight, MapPin, Phone, Mail, } from "lucide-react"

export function Footer() {
  return (
    <footer className="storefront  bg-brand-navy text-white pt-24 pb-12 border-t border-white/10 relative overflow-hidden">
      {/* Subtle floral pattern at the edges */}
      <div className="absolute inset-0  blue-texture  pointer-events-none"></div>

      <div className="max-w-[1440px] mx-auto px-8 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-20 mb-24 relative z-10">

        {/* 1. Brand Identity */}
        <div className="space-y-10">
          <Link href="/" className="group block">
            <img
              src="/images/brand/logo_gold_clean.png"
              alt="Jain Metals"
              className="h-14  transition-all duration-700 group-hover:scale-110"
            />
          </Link>
          <p className="text-sm text-white/50 leading-relaxed max-w-xs font-sans border-l border-white/20 pl-6 uppercase tracking-widest text-[10px]">
            Established in 1964. Precision-crafted idols, heritage utensils, and metallurgical excellence. Direct from our manufacturing unit to your doorstep.
          </p>
          <div className="flex gap-6 pt-4">
            <Link href="#" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all rounded-none opacity-40 hover:opacity-100">
              <Mail className="w-4 h-4 text-white" />
            </Link>
            <Link href="#" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all rounded-none opacity-40 hover:opacity-100">
              <Mail className="w-4 h-4 text-white" />
            </Link>
            <Link href="#" className="w-10 h-10 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all rounded-none opacity-40 hover:opacity-100">
              <Mail className="w-4 h-4 text-white" />
            </Link>
          </div>
        </div>

        {/* 2. Shop Links */}
        <div className="space-y-8">
          <h4 className="font-bold text-[10px] uppercase tracking-[0.4em] text-white/40">Inventory</h4>
          <ul className="space-y-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
            <li><Link href="/products?category=Brass" className="hover:text-white transition-colors">Brass Idols & Decor</Link></li>
            <li><Link href="/products?category=Copper" className="hover:text-white transition-colors">Copper Utensils</Link></li>
            <li><Link href="/products" className="hover:text-white transition-colors">New Arrivals</Link></li>
          </ul>
        </div>

        {/* 3. Help Links */}
        <div className="space-y-8">
          <h4 className="font-bold text-[10px] uppercase tracking-[0.4em] text-white/40">Operational</h4>
          <ul className="space-y-5 text-[10px] font-bold uppercase tracking-[0.25em] text-white/60">
            <li><Link href="/story" className="hover:text-white transition-colors">Our Story</Link></li>
            <li><Link href="/shipping" className="hover:text-white transition-colors">Shipping Info</Link></li>
            <li><Link href="/returns" className="hover:text-white transition-colors">Returns</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms</Link></li>
            <li><Link href="/faq" className="hover:text-white transition-colors">FAQ</Link></li>
          </ul>
        </div>

        {/* 4. Contact */}
        <div className="space-y-8">
          <h4 className="font-bold text-[10px] uppercase tracking-[0.4em] text-white/40">Correspondence</h4>
          <div className="flex flex-col gap-8">
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-white/40 shrink-0 mt-1" />
              <address className="not-italic text-[11px] font-bold uppercase tracking-widest text-white/60 leading-relaxed font-sans">
                Jain Metals HQ,<br />
                Jaipur, RJ,<br />
                Indian Union
              </address>
            </div>
            <div className="flex items-center gap-4">
              <Phone className="w-5 h-5 text-white/40 shrink-0" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 font-sans">+91 98765 43210</p>
            </div>
            <div className="flex items-center gap-4">
              <Mail className="w-5 h-5 text-white/40 shrink-0" />
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/60 font-sans">contact@jainmetals.com</p>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Copyright Bar */}
      <div className="max-w-[1440px] mx-auto px-8 md:px-12 pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] uppercase tracking-[0.3em] text-white/30 font-bold relative z-10 text-center md:text-left">
        <p>© 2024 JAIN METALS TRADITION. INTEGRITY SINCE 1964.</p>
        <div className="flex flex-wrap justify-center gap-10">
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy Disclosure</Link>
          <Link href="/auth/admin" className="hover:text-white transition-colors">Admin Gateway</Link>
          <span className="opacity-40">Precision Cast</span>
        </div>
      </div>
    </footer>
  )
}
