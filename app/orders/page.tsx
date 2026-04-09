// Client logic removed - converted back to Server Component

import { auth } from "@/app/auth"
import { getOrdersByUser } from "@/dal/orders"
import { redirect } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { ChevronRight, Package, Clock, Calendar } from "lucide-react"

// Note: Since this is a client-side layout usually, but the original was a server component, 
// I will keep it as an async server component but ensure the UI is monumental.
// Wait, the original file was "export default async function", so it's a Server Component.
// I should keep it as a Server Component.

import { use } from "react"

export default async function CustomerOrdersPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const orders = await getOrdersByUser(session.user.id)

  return (
    <div className="bg-white min-h-screen white-pattern">
      {/* Monumental Page Header */}
      <header className="pt-32 pb-20 px-8 text-center bg-brand-cream/[0.03] border-b border-brand-brass/10">
        <div className="max-w-4xl mx-auto space-y-6">
           <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold">Your Orders</span>
           <h1 className="text-5xl md:text-6xl font-serif text-brand-navy tracking-tighter leading-none">My Orders</h1>
           <div className="h-px w-24 bg-brand-gold/50 mx-auto" />
           <p className="text-base text-brand-navy/70 font-sans max-w-xl mx-auto leading-relaxed">
             Track and manage your orders from Jain Metals.
           </p>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-20 lg:py-32">
        {orders.length === 0 ? (
          <div className="text-center py-40 border border-dashed border-brand-brass/20 bg-brand-cream/[0.02] space-y-10 rounded-sm">
            <div className="space-y-4">
               <h3 className="font-serif text-3xl text-brand-navy opacity-60">No Orders Yet</h3>
               <p className="text-xs uppercase tracking-[0.2em] text-brand-navy/50 font-bold max-w-sm mx-auto leading-relaxed">
                  You haven't placed any orders yet. Start shopping to see your orders here.
               </p>
            </div>
            <Link
              href="/products"
              className="inline-flex items-center gap-8 bg-brand-navy text-white px-12 py-6 uppercase tracking-[0.3em] text-xs font-bold hover:bg-brand-gold transition-all duration-700 shadow-xl hover:shadow-2xl rounded-sm"
            >
              Shop Now <ChevronRight className="w-5 h-5 opacity-80" />
            </Link>
          </div>
        ) : (
          <div className="space-y-16">
            <div className="flex items-center justify-between border-b border-brand-brass/20 pb-8">
               <p className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/60">
                  {orders.length} Order{orders.length !== 1 ? 's' : ''}
               </p>
            </div>

            <div className="grid gap-8">
              {orders.map((order: any) => (
                <Link key={order.id} href={`/orders/${order.id}`} className="block group">
                  <div className="p-10 card-premium-light rounded-sm">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-10">
                      
                      <div className="space-y-6">
                        <div className="flex items-center gap-6">
                           <div className="w-1.5 h-12 bg-brand-gold/20 group-hover:bg-brand-gold transition-all duration-700 rounded-full" />
                           <div className="space-y-1.5">
                              <span className="text-xs uppercase tracking-[0.2em] font-bold text-brand-gold">Order</span>
                              <h3 className="font-serif text-2xl text-brand-navy tracking-tight group-hover:text-brand-gold transition-colors">
                                #{order.orderNumber.slice(-8).toUpperCase()}
                              </h3>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-12 text-xs text-brand-navy/60 font-bold uppercase tracking-[0.1em] pl-7">
                           <span className="flex items-center gap-3">
                              <Calendar className="w-4 h-4 opacity-70 text-brand-gold" /> 
                              {new Date(order.createdAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'long', year: 'numeric' })}
                           </span>
                           <span className="flex items-center gap-3">
                              <Package className="w-4 h-4 opacity-70 text-brand-gold" /> 
                              {order.items.length} Items
                           </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-16 w-full md:w-auto justify-between md:justify-end border-t md:border-0 pt-10 md:pt-0 border-brand-brass/10 pl-7 md:pl-0">
                        <div className="text-left md:text-right space-y-2">
                           <p className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/50">Status</p>
                           <span className="inline-block text-xs uppercase tracking-[0.2em] font-bold text-brand-gold py-2 px-6 border border-brand-gold/20 bg-brand-gold/10 rounded-sm">
                              {order.status}
                           </span>
                        </div>
                        <div className="text-right space-y-2">
                           <p className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/50">Total</p>
                           <p className="text-2xl font-sans font-bold text-brand-navy tracking-tighter">
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

            <div className="pt-24 border-t border-brand-brass/20 flex justify-center">
               <p className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/40 text-center max-w-md leading-relaxed">
                  Thank you for shopping with Jain Metals. Quality products since 1964.
               </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
