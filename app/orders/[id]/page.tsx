import { getOrderById } from "@/dal/orders"
import { auth } from "@/app/auth"
import { notFound, redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ArrowLeft, CheckCircle2, Package, MapPin, CreditCard, ChevronRight, Calendar } from "lucide-react"

export default async function CustomerOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params
  const order = await getOrderById(id)

  if (!order) notFound()
  if (order.userId !== session.user.id) notFound()

  const isPaid = order.paymentStatus === "PAID"

  return (
    <div className="bg-white min-h-screen">
      {/* Monumental Page Header */}
      <header className="pt-32 pb-20 px-8 text-center bg-brand-cream/5 border-b border-brand-brass/10">
        <div className="max-w-5xl mx-auto space-y-8">
           <Link href="/orders" className="inline-flex items-center gap-4 text-[10px] uppercase tracking-[0.4em] font-bold text-brand-gold hover:gap-6 transition-all duration-700">
              <ArrowLeft className="w-4 h-4" /> Back to Orders
           </Link>
           
           <div className="space-y-4">
              <span className="text-[10px] uppercase tracking-[0.5em] font-bold text-brand-navy/30">Order Details</span>
              <h1 className="text-5xl md:text-6xl font-serif text-brand-navy tracking-tighter leading-none">
                 #{order.orderNumber.slice(-8).toUpperCase()}
              </h1>
           </div>

           <div className="flex justify-center gap-6">
              <div className="flex items-center gap-3 px-6 py-2 border border-brand-gold/20 bg-brand-gold/5">
                 <span className="w-1.5 h-1.5 rounded-full bg-brand-gold animate-pulse" />
                 <span className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-gold">{order.status}</span>
              </div>
              <div className={isPaid ? "flex items-center gap-3 px-6 py-2 border border-brand-navy bg-brand-navy text-white text-[10px] uppercase tracking-[0.3em] font-bold" : "flex items-center gap-3 px-6 py-2 border border-brand-navy/10 bg-white text-brand-navy text-[10px] uppercase tracking-[0.3em] font-bold opacity-40"}>
                 {order.paymentStatus}
              </div>
           </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-8 py-24 lg:py-32">
        <div className="grid lg:grid-cols-3 gap-24 xl:gap-32">
          
          {/* Main Artifact Column */}
          <div className="lg:col-span-2 space-y-24">
            {isPaid && (
               <div className="p-12 border border-brand-gold/20 bg-brand-navy text-white relative overflow-hidden group">
                 <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 border border-white/20 flex items-center justify-center">
                       <CheckCircle2 className="w-6 h-6 text-brand-gold" />
                    </div>
                    <div className="space-y-3">
                       <h3 className="font-serif text-3xl">Order Confirmed</h3>
                       <p className="text-[13px] text-white/50 max-w-lg leading-relaxed font-sans">
                          Your order has been confirmed and is being prepared. We'll update you once it's shipped.
                       </p>
                    </div>
                 </div>
                 <div className="absolute -right-12 -bottom-12 text-white/[0.02] rotate-12 transition-transform duration-1000 group-hover:scale-110">
                    <Package className="w-64 h-64" />
                 </div>
               </div>
             )}

             <section className="space-y-12">
                <div className="flex items-center gap-6 border-b border-brand-brass/10 pb-8">
                   <span className="text-[10px] uppercase tracking-[0.4em] font-bold text-brand-gold">Items</span>
                   <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-brand-navy/20">{order.items.length} Products</p>
                </div>
               
              <div className="space-y-0">
                {order.items.map((item: any) => (
                  <div key={item.id} className="flex items-center gap-12 py-12 border-b border-brand-brass/5 group last:border-0 hover:bg-brand-cream/[0.01] transition-all px-4">
                    <div className="w-32 h-32 bg-brand-cream/5 border border-brand-brass/10 overflow-hidden flex-shrink-0 relative group">
                      {item.product?.images?.[0] ? (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name ?? "Product"}
                          className="w-full h-full object-cover grayscale-[0.2] transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-5">🪔</div>
                      )}
                      <div className="absolute inset-0 bg-brand-navy/0 group-hover:bg-brand-navy/5 transition-colors" />
                    </div>
                    
                    <div className="flex-1 space-y-2">
                       <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-brand-gold opacity-60">Product</span>
                       <h3 className="font-serif text-2xl text-brand-navy tracking-tight">{item.product?.name ?? "Product"}</h3>
                       <div className="flex items-center gap-6 pt-2">
                          <p className="text-[10px] uppercase tracking-widest text-brand-navy/40 font-bold">
                            Quantity: {item.quantity}
                          </p>
                          <div className="w-1 h-1 rounded-full bg-brand-gold/30" />
                          <p className="text-[10px] uppercase tracking-widest text-brand-navy/40 font-bold">
                             Status: Active
                          </p>
                       </div>
                    </div>
                    
                    <div className="text-right">
                       <p className="text-2xl font-serif text-brand-navy leading-none">
                         ₹{(Number(item.unitPrice) * item.quantity).toLocaleString("en-IN")}
                       </p>
                    </div>
                  </div>
                ))}
              </div>
             </section>
          </div>

          {/* Sidebar Column */}
          <div className="space-y-20">
            {/* Valuation Module */}
            <section className="space-y-10 border border-brand-brass/10 p-10 bg-white relative">
               <div className="absolute -top-3 left-10 bg-white px-4">
                  <span className="text-[9px] uppercase tracking-[0.5em] font-bold text-brand-gold">Order Summary</span>
               </div>
               
               <div className="space-y-6 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-brand-navy/20">Subtotal</span>
                    <span className="font-serif text-brand-navy text-lg">₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-[0.4em] font-bold text-brand-navy/20">Delivery</span>
                    <span className="font-sans text-brand-navy font-bold text-sm">₹{Number(order.deliveryFee).toLocaleString("en-IN")}</span>
                  </div>
                  {Number(order.discountAmount) > 0 && (
                    <div className="flex justify-between items-center text-brand-gold">
                      <span className="text-[9px] uppercase tracking-[0.4em] font-bold">Discount</span>
                      <span className="font-bold">−₹{Number(order.discountAmount).toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  
                  <div className="pt-10 border-t border-brand-navy bg-brand-navy/[0.03] -mx-10 px-10 pb-10 space-y-4">
                     <div className="flex justify-between items-end">
                        <span className="text-[9px] uppercase tracking-[0.5em] font-bold text-brand-navy">Total</span>
                        <span className="text-4xl font-sans font-bold text-brand-navy tracking-tight leading-none">₹{Number(order.total).toLocaleString("en-IN")}</span>
                     </div>
                     <p className="text-[10px] text-center text-brand-navy/30 leading-relaxed pt-2">
                        Quality products since 1964.
                     </p>
                  </div>
               </div>
            </section>

            {/* Destination Module */}
            <section className="space-y-10 border border-brand-brass/10 p-10 bg-white relative">
               <div className="absolute -top-3 left-10 bg-white px-4">
                  <span className="text-[9px] uppercase tracking-[0.5em] font-bold text-brand-gold">Delivery Address</span>
               </div>
               
               <div className="space-y-8 pt-4">
                  <div className="flex items-start gap-6">
                     <div className="w-12 h-12 bg-brand-cream/10 border border-brand-brass/10 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-brand-gold opacity-60" />
                     </div>
                     <div className="space-y-2">
                        <p className="font-serif text-brand-navy text-2xl tracking-tight italic">{order.address.fullName}</p>
                        <p className="text-[10px] font-bold text-brand-navy/30 uppercase tracking-[0.3em]">{order.address.phone}</p>
                     </div>
                  </div>
                  
                   <div className="bg-brand-cream/[0.03] p-8 border border-brand-brass/10 border-dashed space-y-2">
                      <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-brand-navy/20 mb-4">Address</p>
                      <div className="text-[13px] text-brand-navy/60 leading-relaxed font-sans space-y-1">
                         <p>{order.address.line1}</p>
                         {order.address.line2 && <p>{order.address.line2}</p>}
                         <p>{order.address.city}, {order.address.state} — {order.address.pincode}</p>
                      </div>
                   </div>
                </div>
             </section>

             {/* Authentication Badge */}
             <div className="text-center space-y-6 pt-10 border-t border-brand-brass/10">
                <div className="flex items-center justify-center gap-4 text-[9px] text-brand-navy/30 uppercase tracking-[0.4em] font-bold">
                   <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold" />
                   <span>Jain Metals Since 1964</span>
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
