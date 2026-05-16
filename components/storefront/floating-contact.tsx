import Link from "next/link"
import { WhatsappLogo, MapsLogo } from "@/components/icons"

export function FloatingContact() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-4">
      <Link
        href="https://maps.google.com"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-white border border-brand-gold/30 rounded-full flex items-center justify-center shadow-2xl hover:bg-brand-gold transition-all group hover:-translate-y-1"
        aria-label="Find us on Google Maps"
      >
        <MapsLogo className="w-7 h-7 text-brand-navy transition-colors group-hover:text-brand-navy" />
      </Link>
      <Link
        href={`https://wa.me/${process.env.WHATSAPPCONTACT}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-brand-navy border border-brand-gold/50 rounded-full flex items-center justify-center shadow-2xl hover:bg-brand-gold transition-all group hover:-translate-y-1"
        aria-label="Contact us on WhatsApp"
      >
        <WhatsappLogo className="w-7 h-7 text-brand-gold transition-colors group-hover:text-brand-navy" />
      </Link>
    </div>
  )
}
