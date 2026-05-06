// Client logic removed - converted back to Server Component

import { auth } from "@/app/auth"
import { getOrdersByUser } from "@/dal/orders"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ChevronRight, Package, Calendar } from "lucide-react"

// Note: Since this is a client-side layout usually, but the original was a server component, 
// I will keep it as an async server component but ensure the UI is monumental.
// Wait, the original file was "export default async function", so it's a Server Component.
// I should keep it as a Server Component.

export default async function CustomerOrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const orders = await getOrdersByUser(session.user.id)

  return (
    <div className="bg-white min-h-screen white-pattern">
      {/* Monumental Page Header */}
      <header className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-8 text-center bg-brand-cream/[0.03] border-b border-brand-brass/10">
        <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
           <span className="text-[11px] sm:text-xs uppercase tracking-[0.24em] sm:tracking-[0.3em] font-bold text-brand-gold">Your Orders</span>
           <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-brand-navy tracking-normal leading-[0.95]">My Orders</h1>
           <div className="h-px w-24 bg-brand-gold/50 mx-auto" />
           <p className="text-sm sm:text-base text-brand-navy/70 font-sans max-w-xl mx-auto leading-relaxed">
             Track and manage your orders from Jain Metals.
           </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-10 sm:py-20 lg:py-32">
        {orders.length === 0 ? (
          <div className="text-center px-5 py-20 sm:py-40 border border-dashed border-brand-brass/20 bg-brand-cream/[0.02] space-y-8 sm:space-y-10 rounded-sm">
            <div className="space-y-4">
               <h3 className="font-serif text-2xl sm:text-3xl text-brand-navy opacity-60">No Orders Yet</h3>
               <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] text-brand-navy/50 font-bold max-w-sm mx-auto leading-relaxed">
                  You haven't placed any orders yet. Start shopping to see your orders here.
               </p>
            </div>
            <Link
              href="/products"
              className="inline-flex w-full sm:w-auto items-center justify-center gap-4 sm:gap-8 bg-brand-navy text-white px-6 sm:px-12 py-4 sm:py-6 uppercase tracking-[0.2em] sm:tracking-[0.3em] text-xs font-bold hover:bg-brand-gold transition-all duration-700 shadow-xl hover:shadow-2xl rounded-sm"
            >
              Shop Now <ChevronRight className="w-5 h-5 opacity-80" />
            </Link>
          </div>
        ) : (
          <div className="space-y-8 sm:space-y-16">
            <div className="flex items-center justify-between border-b border-brand-brass/20 pb-5 sm:pb-8">
               <p className="text-[11px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.2em] font-bold text-brand-navy/60">
                  {orders.length} Order{orders.length !== 1 ? 's' : ''}
               </p>
            </div>

            <div className="grid gap-4 sm:gap-8">
              {orders.map((order: any) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="block group">
                  <div className="p-4 sm:p-6 lg:p-10 card-premium-light rounded-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 sm:gap-10">
                      
                      <div className="w-full min-w-0 space-y-4 sm:space-y-6">
                        <div className="flex items-center gap-4 sm:gap-6">
                           <div className="w-1.5 h-10 sm:h-12 bg-brand-gold/20 group-hover:bg-brand-gold transition-all duration-700 rounded-full shrink-0" />
                           <div className="space-y-1.5">
                              <span className="text-[11px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.2em] font-bold text-brand-gold">Order</span>
                              <h3 className="font-serif text-xl sm:text-2xl text-brand-navy tracking-tight group-hover:text-brand-gold transition-colors">
                                #{order.orderNumber.slice(-8).toUpperCase()}
                              </h3>
                           </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-x-12 sm:gap-y-4 text-[11px] sm:text-xs text-brand-navy/60 font-bold uppercase tracking-[0.08em] sm:tracking-[0.1em] pl-5 sm:pl-7">
                           <span className="flex items-center gap-2 sm:gap-3">
                              <Calendar className="w-4 h-4 opacity-70 text-brand-gold" /> 
                              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}
                           </span>
                           <span className="flex items-center gap-2 sm:gap-3">
                              <Package className="w-4 h-4 opacity-70 text-brand-gold" /> 
                              {order.items.length} Items
                           </span>
                        </div>
                      </div>

                      <div className="grid w-full grid-cols-2 gap-4 md:flex md:w-auto md:items-center md:gap-16 md:justify-end border-t md:border-0 pt-5 sm:pt-10 md:pt-0 border-brand-brass/10 pl-5 sm:pl-7 md:pl-0">
                        <div className="text-left md:text-right space-y-2">
                           <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/50">Status</p>
                           <span className="inline-block max-w-full truncate text-[10px] sm:text-xs uppercase tracking-[0.14em] sm:tracking-[0.2em] font-bold text-brand-gold py-2 px-3 sm:px-6 border border-brand-gold/20 bg-brand-gold/10 rounded-sm">
                              {order.status}
                           </span>
                        </div>
                        <div className="text-right space-y-2">
                           <p className="text-[10px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/50">Total</p>
                           <p className="text-xl sm:text-2xl font-sans font-bold text-brand-navy tracking-tight tabular-nums">
                              ₹{Number(order.total).toLocaleString("en-IN")}
                           </p>
                        </div>
                        <ChevronRight className="w-6 h-6 text-brand-navy/20 group-hover:text-brand-gold transition-all duration-700 ml-6 hidden md:block" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            <div className="pt-12 sm:pt-24 border-t border-brand-brass/20 flex justify-center">
               <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/40 text-center max-w-md leading-relaxed">
                  Thank you for shopping with Jain Metals. Quality products since 1964.
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
