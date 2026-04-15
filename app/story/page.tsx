import { StorefrontLayout } from "@/components/storefront/storefront-layout"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Trophy } from "lucide-react"

export default function StoryPage() {
  return (
    <StorefrontLayout>
      {/* Editorial Header */}
      <section className="pt-40 pb-20 px-8 text-center bg-white border-b border-brand-brass/10 white-pattern relative overflow-hidden">
         <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-brand-gold/5 blur-[100px] rounded-full pointer-events-none" />
         <div className="max-w-4xl mx-auto space-y-8 relative z-10">
            <span className="text-xs uppercase tracking-[0.4em] font-extrabold text-brand-gold">Our Legacy</span>
            <h1 className="text-5xl md:text-7xl font-serif text-brand-navy tracking-tighter leading-none">
              A Tradition of <span className="italic opacity-80">Excellence</span>
            </h1>
            <div className="h-px w-24 bg-brand-gold/50 mx-auto" />
            <p className="text-lg md:text-xl text-brand-navy/60 font-sans max-w-2xl mx-auto leading-relaxed border-l-2 border-brand-gold/30 pl-6 text-left">
              Established in 1964 by Mr. Madanlal, Jain Metals has grown from a humble beginning into a trusted name in the world of brass and copper products.
            </p>
         </div>
      </section>

      {/* Main Content Areas */}
      <section className="max-w-[1200px] mx-auto px-8 py-24 md:py-32 space-y-32">
        
        {/* Foundation */}
        <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-serif text-brand-navy leading-tight">Built on Integrity. <br/> Continued by Generations.</h2>
            <div className="space-y-4">
              <p className="text-brand-navy/70 leading-relaxed font-sans text-lg">
                Built on a strong foundation of integrity, quality, and customer satisfaction, our business proudly continues to thrive under the guidance of the second and third generations.
              </p>
              <p className="text-brand-navy/70 leading-relaxed font-sans text-lg">
                We specialize in a wide range of products, including beautifully crafted brass idols and décor pieces, as well as durable and functional copper utensils and storage containers. Each product reflects our commitment to craftsmanship and timeless design.
              </p>
            </div>
          </div>
          <div className="aspect-[4/5] bg-brand-navy/5 relative overflow-hidden border border-brand-brass/20 p-2">
             <img src="/images/brand/promo_statue.jpg" alt="Brass Craftsmanship" className="w-full h-full object-cover opacity-80 mix-blend-multiply" />
             <div className="absolute inset-0 bg-brand-gold/5 pointer-events-none" />
          </div>
        </div>

        {/* Evolution */}
        <div className="grid md:grid-cols-2 gap-16 md:gap-20 items-center md:flex-row-reverse">
          <div className="aspect-[4/3] bg-brand-navy/5 relative flex items-center justify-center border border-brand-brass/20 md:order-last p-2 group overflow-hidden">
            <Trophy className="w-24 h-24 text-brand-gold/30 group-hover:scale-110 transition-transform duration-700" />
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-gold/5 to-transparent pointer-events-none" />
          </div>
          <div className="space-y-6">
             <h2 className="text-3xl md:text-4xl font-serif text-brand-navy leading-tight">From Local Markets <br/> To Global Commerce.</h2>
            <div className="space-y-4">
              <p className="text-brand-navy/70 leading-relaxed font-sans text-lg">
                Jain Metals began its journey as a B2B enterprise, serving retailers and businesses with consistent quality and reliable service. Over time, we expanded into the B2C space, bringing our products directly to customers who value authenticity and excellence.
              </p>
              <p className="text-brand-navy/70 leading-relaxed font-sans text-lg">
                Today, we are taking the next step forward by extending our presence online, making it easier for customers to explore and purchase our offerings from anywhere.
              </p>
            </div>
          </div>
        </div>

        {/* Values */}
        <div className="bg-brand-cream/10 p-12 md:p-24 border border-brand-brass/20 rounded-sm text-center space-y-12 relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/50 blur-[80px]" />
           <div className="space-y-6 relative z-10 max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-serif text-brand-navy leading-tight">Rooted in Tradition. <br/> Embracing the Modern.</h2>
              <div className="space-y-4">
                <p className="text-brand-navy/70 leading-relaxed font-sans text-lg">
                  What sets us apart is our unwavering focus on quality products, dependable service, and offering the best possible prices. For us, every customer relationship is built on trust — a value that has defined Jain Metals for over six decades.
                </p>
                <p className="text-brand-navy/70 leading-relaxed font-sans text-lg italic border-t border-brand-brass/20 pt-6 mt-6">
                  "As we continue to grow, we remain rooted in our tradition while embracing modern ways to serve you better."
                </p>
              </div>
           </div>
           
           <div className="flex justify-center pt-4 relative z-10">
              <Button asChild className="h-16 px-12 bg-brand-navy text-white hover:bg-brand-gold rounded-none uppercase tracking-[0.2em] font-bold text-xs transition-all duration-500 shadow-xl">
                 <Link href="/products" className="flex items-center gap-4">
                    Explore Inventory <ArrowRight className="w-4 h-4 opacity-80" />
                 </Link>
              </Button>
           </div>
        </div>

      </section>
    </StorefrontLayout>
  )
}
