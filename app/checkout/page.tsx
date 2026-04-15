"use client"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useCartStore } from "@/store/cart"
import {
  createRazorpayOrder,
  verifyPaymentAction,
  createAddressAction,
  getDeliveryFeeAction,
  getDefaultAddressAction,
} from "@/actions/checkout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CartItems } from "@/components/cart-items"
import {
  Truck,
  Store,
  CheckCircle2,
  Edit3,
  Loader2,
  MapPin,
  Phone,
  User,
  Tag,
  Zap,
  ArrowRight,
  ChevronRight,
  Calendar
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"

const WHATSAPP_REDIRECT_ABOVE = 50000
const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? ""

declare global {
  interface Window {
    Razorpay: any
  }
}

type Mode = "delivery" | "pickup"
type Step = "details" | "summary"

const DELIVERY_FORM_INITIAL = {
  fullName: "",
  phone: "",
  line1: "",
  line2: "",
  city: "",
  state: "",
  pincode: "",
  country: "India",
}

export default function CheckoutPage() {
  const { data: session } = useSession()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [coupon, setCoupon] = useState("")
  const [mode, setMode] = useState<Mode>("delivery")
  const [step, setStep] = useState<Step>("details")

  // Address form
  const [form, setForm] = useState(DELIVERY_FORM_INITIAL)
  const [savedAddressId, setSavedAddressId] = useState<string | null>(null)
  const [addressSaved, setAddressSaved] = useState(false)

  // Pickup form
  const [pickupForm, setPickupForm] = useState({ fullName: "", phone: "" })

  // Delivery fee
  const [deliveryFee, setDeliveryFee] = useState<number | null>(null)
  const [deliveryInfo, setDeliveryInfo] = useState<{ serviceable: boolean; city?: string; state?: string } | null>(null)
  const [feeLoading, setFeeLoading] = useState(false)

  // Success Modal
  const [successOrder, setSuccessOrder] = useState<string | null>(null)

  // Sync session → forms and fetch saved address
  useEffect(() => {
    async function loadUserData() {
      if (session?.user) {
        const phone = (session.user as any).phone ?? ""
        const name = session.user.name ?? ""
        
        setPickupForm((p) => ({
          fullName: p.fullName || name,
          phone: p.phone || phone,
        }))

        try {
          // Fetch their latest default address
          const savedAddr = await getDefaultAddressAction()
          if (savedAddr) {
            setForm({
              fullName: savedAddr.fullName,
              phone: savedAddr.phone,
              line1: savedAddr.line1,
              line2: savedAddr.line2 || "",
              city: savedAddr.city,
              state: savedAddr.state,
              pincode: savedAddr.pincode,
              country: savedAddr.country,
            })
            setSavedAddressId(savedAddr.id)
            setAddressSaved(true)
            setStep("summary")
          } else {
            // No saved address, just prefill name and phone
            setForm((p) => ({
              ...p,
              fullName: p.fullName || name,
              phone: p.phone || phone,
            }))
          }
        } catch {
          // Ignore failures, fall back to empty form
        }
      }
    }
    loadUserData()
  }, [session])

  const subtotal = items.reduce(
    (s, i) => s + (i.product.discountedPrice ?? i.product.price) * i.quantity,
    0,
  )

  const totalWeightKg = items.reduce(
    (s, i) => s + (i.product.weightKg ?? 1) * i.quantity,
    0,
  )

  // Live delivery fee when pincode changes
  const calculateFee = useCallback(
    async (pincode: string) => {
      // Allow calculation with state even if pincode is not 6 digits
      if (pincode.length !== 6 && !form.state) {
        setDeliveryFee(null)
        setDeliveryInfo(null)
        return
      }
      setFeeLoading(true)
      try {
        const result = await getDeliveryFeeAction(
          pincode,
          subtotal,
          totalWeightKg,
          form.state,
        )
        setDeliveryFee(result.fee)
        setDeliveryInfo({ serviceable: result.serviceable, city: result.city, state: result.state })
      } catch {
        setDeliveryFee(null)
        setDeliveryInfo(null)
      } finally {
        setFeeLoading(false)
      }
    },
    [subtotal, totalWeightKg, form.state],
  )

  useEffect(() => {
    if (mode === "delivery" && (form.pincode.length === 6 || form.state)) {
      calculateFee(form.pincode)
    } else if (mode === "pickup") {
      setDeliveryFee(0)
      setDeliveryInfo(null)
    }
  }, [form.pincode, form.state, mode, calculateFee])

  const handleAddressChange = useCallback((key: keyof typeof DELIVERY_FORM_INITIAL, value: string) => {
    setForm((p) => ({ ...p, [key]: value }))
    if (savedAddressId) {
      setSavedAddressId(null)
      setAddressSaved(false)
    }
  }, [savedAddressId])

  const [scriptLoaded, setScriptLoaded] = useState(false)

  useEffect(() => {
    if (!scriptLoaded && !(window as any).Razorpay) {
      const script = document.createElement("script")
      script.src = "https://checkout.razorpay.com/v1/checkout.js"
      script.async = true
      script.onload = () => setScriptLoaded(true)
      script.onerror = () => toast.error("Failed to load payment system")
      document.head.appendChild(script)
      return () => {
        if (document.head.contains(script)) {
          document.head.removeChild(script)
        }
      }
    } else if ((window as any).Razorpay) {
      setScriptLoaded(true)
    }
  }, [scriptLoaded])

  const handleSaveAddress = async () => {
    if (mode === "pickup") {
      if (!pickupForm.fullName.trim() || !pickupForm.phone.trim()) {
        toast.error("Please fill in your name and phone number")
        return
      }
      setStep("summary")
      return
    }

    const required = ["fullName", "phone", "line1", "pincode"] as const
    for (const key of required) {
      if (!form[key]?.trim()) {
        toast.error(`Please fill in ${key === "line1" ? "your address" : key}`)
        return
      }
    }
    if (!/^\+?[0-9]{10,13}$/.test(form.phone)) {
      toast.error("Please enter a valid phone number (10-13 digits)")
      return
    }
    if (!/^\d{6}$/.test(form.pincode)) {
      toast.error("Please enter a valid 6-digit pincode")
      return
    }

    if (!deliveryInfo?.serviceable) {
      toast.error("Sorry, we don't deliver to this pincode yet")
      return
    }

    setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      const result = await createAddressAction(fd)
      if ("error" in result) throw new Error(String(result.error))
      setSavedAddressId(result.addressId)
      setAddressSaved(true)
      toast.success("Address saved!")
      setStep("summary")
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save address")
    } finally {
      setSaving(false)
    }
  }

  const handleCheckout = async (e?: React.MouseEvent) => {
    e?.preventDefault()
    
    if (!session?.user) {
      router.push("/login")
      return
    }
    if (items.length === 0) {
      toast.error("Your cart is empty")
      return
    }

    const isPickup = mode === "pickup"

    if (!isPickup && !savedAddressId) {
      toast.error("Please save your delivery address first")
      setStep("details")
      return
    }

    setLoading(true)
    try {
      // High-value → WhatsApp
      if (WHATSAPP_NUMBER && subtotal > WHATSAPP_REDIRECT_ABOVE) {
        const lines = items
          .map(
            (i) =>
              `• ${i.product.name} ×${i.quantity} = ₹${(
                (i.product.discountedPrice ?? i.product.price) * i.quantity
              ).toLocaleString("en-IN")}`,
          )
          .join("\n")
        const name = isPickup ? pickupForm.fullName : form.fullName
        const phone = isPickup ? pickupForm.phone : form.phone
        const msg = `Jain Metals Order Enquiry\n\n${lines}\n\nSubtotal: ₹${subtotal.toLocaleString("en-IN")}\nMode: ${isPickup ? "Store Pickup" : "Delivery"}\n\nName: ${name}\nPhone: ${phone}`
        window.open(
          `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`,
          "_blank",
        )
        return
      }

      const orderData = await createRazorpayOrder({
        items: items.map((i) => ({
          productId: i.productId,
          quantity: i.quantity,
          sizeVariantId: i.sizeVariantId ?? undefined,
          sizeName: i.sizeVariantName ?? undefined,
        })),
        pincode: isPickup ? undefined : form.pincode,
        couponCode: coupon || undefined,
        addressId: savedAddressId ?? undefined,
        isPickup,
        pickupDetails: isPickup ? pickupForm : undefined,
      })

      if ("error" in orderData) throw new Error(String(orderData.error))

      const rzp = new window.Razorpay({
        key: orderData.keyId,
        amount: Math.round(Number(orderData.amount) * 100),
        currency: orderData.currency,
        order_id: orderData.razorpayOrderId,
        name: "Jain Metals",
        description: `Acquiring ${items.length} Sacred Artifact(s)`,
        prefill: orderData.prefill,
        theme: { color: "#0D1235" },
        handler: async (response: any) => {
          const result = await verifyPaymentAction({
            orderId: orderData.orderId,
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
          })
          if ("error" in result) {
            toast.error("Payment verification failed")
            return
          }
          clearCart()
          setSuccessOrder(orderData.orderId)
        },
        modal: { ondismiss: () => toast.info("Acquisition cancelled") },
      })
      rzp.open()
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const total = subtotal + (deliveryFee ?? 0)

  return (
    <div className="bg-white min-h-screen white-pattern storefront">
      {/* Editorial Header */}
      <header className="pt-32 pb-20 px-8 text-center bg-brand-cream/[0.03] border-b border-brand-brass/10">
         <div className="max-w-4xl mx-auto space-y-6">
            <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold">Checkout</span>
            <h1 className="text-5xl md:text-6xl font-serif text-brand-navy tracking-tighter leading-none">Complete Your Order</h1>
            <div className="h-px w-24 bg-brand-gold/50 mx-auto" />
            <p className="text-base text-brand-navy/70 font-sans max-w-lg mx-auto leading-relaxed">
               Review your order details and place your order.
            </p>
         </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-8 py-20 lg:py-32">
        <div className="flex flex-col lg:flex-row gap-24 xl:gap-32">
          
          {/* Main Acquisition Flow */}
          <div className="flex-1 space-y-24">
            
             {/* Mode Selection: The Choice of Path */}
             <section className="space-y-10">
                <div className="flex items-center gap-6">
                   <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold">Step 01</span>
                   <h3 className="text-sm uppercase tracking-[0.2em] font-bold text-brand-navy/60">Delivery Method</h3>
                </div>
               <div className="grid md:grid-cols-2 gap-8">
                  <button
                     onClick={() => { setMode("delivery"); setStep("details"); setAddressSaved(false) }}
                     className={cn(
                       "group flex flex-col gap-6 p-10 border text-left rounded-sm transition-all duration-700 relative overflow-hidden",
                       mode === "delivery" ? "border-brand-gold bg-brand-cream/[0.1] shadow-lg shadow-brand-gold/5" : "border-brand-brass/20 hover:border-brand-navy/40 bg-white shadow-sm"
                     )}
                  >
                     <div className={cn(
                       "w-14 h-14 flex items-center justify-center rounded-full transition-all duration-700",
                       mode === "delivery" ? "bg-brand-navy text-white shadow-md" : "bg-brand-navy/5 text-brand-navy/50 group-hover:bg-brand-navy/10"
                     )}>
                        <Truck className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="font-serif text-2xl text-brand-navy leading-none mb-3">Home Delivery</p>
                        <p className="text-sm text-brand-navy/70 leading-relaxed">Get your order delivered safely to your doorstep across India.</p>
                     </div>
                  </button>

                  <button
                     onClick={() => { setMode("pickup") ; setStep("details"); setAddressSaved(false); setDeliveryFee(0) }}
                     className={cn(
                       "group flex flex-col gap-6 p-10 border text-left rounded-sm transition-all duration-700 relative overflow-hidden",
                       mode === "pickup" ? "border-brand-gold bg-brand-cream/[0.1] shadow-lg shadow-brand-gold/5" : "border-brand-brass/20 hover:border-brand-navy/40 bg-white shadow-sm"
                     )}
                  >
                     <div className={cn(
                       "w-14 h-14 flex items-center justify-center rounded-full transition-all duration-700",
                       mode === "pickup" ? "bg-brand-navy text-white shadow-md" : "bg-brand-navy/5 text-brand-navy/50 group-hover:bg-brand-navy/10"
                     )}>
                        <Store className="w-6 h-6" />
                     </div>
                     <div>
                        <p className="font-serif text-2xl text-brand-navy leading-none mb-3">Pickup</p>
                        <p className="text-sm text-brand-navy/70 leading-relaxed">Collect your order directly from our shop in [City].</p>
                     </div>
                  </button>
               </div>
             </section>

            {/* Logical Steps Wrapper */}
            <div className="space-y-24">
               {/* Step 1: Physical Parameters / Identification */}
               <section className={cn(
                  "space-y-10 transition-opacity duration-1000",
                  step === "summary" ? "opacity-40 pointer-events-none" : "opacity-100"
               )}>
                   <div className="flex items-center gap-6">
                      <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold">Step 02</span>
                      <div className="h-px w-20 bg-brand-gold/50" />
                      <h2 className="text-3xl font-serif text-brand-navy leading-none">
                         {mode === "delivery" ? "Delivery Address" : "Contact Details"}
                      </h2>
                   </div>

                  <div className="space-y-12 pl-0 md:pl-12 border-l border-brand-brass/20 ml-0 md:ml-4 pt-4">
                     {mode === "delivery" ? (
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
                            <div className="space-y-3">
                               <label className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/70">Full Name</label>
                               <Input
                                  value={form.fullName}
                                  onChange={(e) => handleAddressChange("fullName", e.target.value)}
                                  className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-14 bg-white px-4 text-brand-navy font-serif text-lg shadow-sm"
                                  placeholder="Your full name"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/70">Phone Number</label>
                              <Input
                                 value={form.phone}
                                 onChange={(e) => handleAddressChange("phone", e.target.value)}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-14 bg-white px-4 text-brand-navy font-serif text-lg shadow-sm"
                                 placeholder="+91..."
                              />
                           </div>
                           <div className="md:col-span-2 space-y-4">
                              <label className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/70">Detailed Physical Address</label>
                              <Input
                                 value={form.line1}
                                 onChange={(e) => handleAddressChange("line1", e.target.value)}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-14 bg-white px-4 text-brand-navy font-serif text-lg shadow-sm"
                                 placeholder="Street Address, Block, etc."
                              />
                              <Input
                                 value={form.line2}
                                 onChange={(e) => handleAddressChange("line2", e.target.value)}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-14 bg-white px-4 text-brand-navy font-serif text-lg shadow-sm"
                                 placeholder="Suite, Landmark (Optional)"
                              />
                           </div>
                           <div className="grid grid-cols-2 gap-6 md:gap-12 md:col-span-2">
                              <div className="space-y-3">
                                 <label className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/70">City</label>
                                 <Input
                                    value={form.city}
                                    onChange={(e) => handleAddressChange("city", e.target.value)}
                                    className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-14 bg-white px-4 text-brand-navy font-serif text-lg shadow-sm"
                                 />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/70">State / Territory</label>
                                 <Input
                                    value={form.state}
                                    onChange={(e) => handleAddressChange("state", e.target.value)}
                                    className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-14 bg-white px-4 text-brand-navy font-serif text-lg shadow-sm"
                                 />
                              </div>
                           </div>
                            <div className="space-y-3">
                               <label className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/70">Registry Pincode</label>
                               <Input
                                  value={form.pincode}
                                  maxLength={6}
                                  onChange={(e) => handleAddressChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                                  className={cn(
                                    "rounded-sm border-x border-t border-b h-14 bg-white px-4 font-serif text-lg shadow-sm",
                                    deliveryInfo?.serviceable === true ? "border-green-500/50 focus-visible:ring-green-500" : 
                                    deliveryInfo?.serviceable === false ? "border-red-500/50 focus-visible:ring-red-500" :
                                    "border-brand-brass/30 focus-visible:ring-brand-gold"
                                  )}
                               />
                               {feeLoading && <p className="text-xs italic text-brand-gold font-bold uppercase tracking-[0.2em] pt-2">Checking delivery availability...</p>}
                               {!feeLoading && form.pincode.length === 6 && deliveryInfo && (
                                 <div className={cn(
                                   "text-xs font-bold uppercase tracking-[0.2em] pt-2",
                                   deliveryInfo.serviceable ? "text-green-600" : "text-red-500"
                                 )}>
                                   {deliveryInfo.serviceable 
                                     ? `✓ Delivery available to ${deliveryInfo.city}, ${deliveryInfo.state}`
                                     : "✗ Sorry, we don't deliver to this pincode yet"
                                   }
                                 </div>
                               )}
                               {!feeLoading && form.pincode.length === 6 && !deliveryInfo && (
                                 <p className="text-xs italic text-brand-navy/50 pt-2">Enter 6-digit pincode</p>
                               )}
                            </div>
                        </div>
                     ) : (
                        <div className="grid md:grid-cols-2 gap-12">
                           <div className="space-y-3">
                              <label className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/70">Curator Name</label>
                              <Input
                                 value={pickupForm.fullName}
                                 onChange={(e) => setPickupForm((p) => ({ ...p, fullName: e.target.value }))}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-14 bg-white px-4 text-brand-navy font-serif text-lg shadow-sm"
                                 placeholder="Legal Signature"
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/70">Authorized Phone</label>
                              <Input
                                 value={pickupForm.phone}
                                 onChange={(e) => setPickupForm((p) => ({ ...p, phone: e.target.value }))}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-14 bg-white px-4 text-brand-navy font-serif text-lg shadow-sm"
                                 placeholder="+91..."
                              />
                           </div>
                        </div>
                     )}

                     {step === "details" && (
                        <div className="pt-6">
                           <Button
                              onClick={handleSaveAddress}
                              disabled={saving}
                              className="w-full h-16 bg-brand-navy text-white hover:bg-brand-gold rounded-sm uppercase tracking-[0.3em] text-xs font-bold transition-all duration-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              {saving ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : null}
                              {saving ? "Authorizing..." : "Authorize Identification"}
                           </Button>
                        </div>
                     )}
                  </div>
               </section>

               {/* Step 2: Acquisition Summary / Final Authorization */}
               <section className={cn(
                  "space-y-12 transition-all duration-1000 transform",
                  step === "summary" ? "opacity-100 translate-y-0" : "opacity-40 pointer-events-none translate-y-8"
               )}>
                  <div className="flex items-center justify-between border-b border-brand-brass/20 pb-8">
                     <div className="flex items-center gap-6">
                        <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold">Registry Phase II</span>
                        <div className="h-px w-20 bg-brand-gold/50" />
                        <h2 className="text-3xl font-serif text-brand-navy leading-none italic">Acquisition Authorization</h2>
                     </div>
                     {step === "summary" && (
                        <Button 
                           variant="ghost" 
                           onClick={() => setStep("details")} 
                           className="text-brand-gold hover:bg-brand-gold/10 hover:text-brand-navy uppercase tracking-[0.2em] text-xs font-bold transition-all px-4 py-2"
                        >
                           <Edit3 className="w-4 h-4 mr-2" /> Revise Phase I
                        </Button>
                     )}
                  </div>

                  <div className="space-y-12 pl-0 md:pl-12">
                     <div className="grid md:grid-cols-2 gap-8">
                        <div className="p-10 card-premium-light space-y-8 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-32 h-32 bg-brand-gold/10 blur-[60px] rounded-full" />
                           <div className="space-y-2 border-b border-brand-brass/10 pb-6 z-10 relative">
                               <p className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/60">Items</p>
                               <p className="text-3xl font-serif text-brand-navy">{items.length} Products</p>
                            </div>
                            <div className="space-y-2 border-b border-brand-brass/10 pb-6 z-10 relative">
                               <p className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/60">Delivery</p>
                               <p className="text-xl font-serif text-brand-navy">{mode === "delivery" ? "Home Delivery" : "Pickup"}</p>
                            </div>
                            <div className="space-y-2 z-10 relative">
                               <p className="text-xs uppercase tracking-[0.2em] font-bold text-brand-navy/60">Delivery Time</p>
                               <p className="text-xl font-serif text-brand-navy">3 - 7 Days</p>
                            </div>
                        </div>

                         <div className="flex flex-col justify-center space-y-10">
                            <div className="space-y-4">
                               <p className="text-sm text-brand-navy/70 leading-relaxed font-sans border-l-2 border-brand-gold/30 pl-4">
                                  By placing this order, you agree to our terms and conditions.
                               </p>
                               <div className="flex items-center gap-4 text-xs text-brand-navy/60 uppercase tracking-[0.2em] font-bold pt-2">
                                  <Zap className="w-4 h-4 text-brand-gold" />
                                  <span>Secure Payment Processing</span>
                               </div>
                            </div>

                            <Button
                               onClick={handleCheckout}
                               disabled={loading}
                               className="w-full h-20 bg-brand-gold text-brand-navy hover:text-white hover:bg-brand-navy rounded-sm uppercase tracking-[0.3em] text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                               <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                               {loading ? (
                                  <div className="flex items-center gap-3">
                                     <Loader2 className="animate-spin w-6 h-6" />
                                     <span>Processing...</span>
                                  </div>
                               ) : (
                                  <span className="flex items-center gap-6">Place Order <ArrowRight className="w-5 h-5 opacity-80" /></span>
                               )}
                            </Button>
                         </div>
                     </div>
                  </div>
               </section>
            </div>
          </div>

          {/* Right Sidebar: Curated Summary Panel */}
          <div className="lg:w-[450px] space-y-12 shrink-0">
             <div className="sticky top-40 space-y-12">
               <div className="relative group">
                  <div className="absolute -top-4 left-10 bg-white px-6 py-2 border border-brand-brass/30 shadow-md rounded-full z-20 transition-transform group-hover:-translate-y-1">
                     <span className="text-xs uppercase tracking-[0.3em] font-extrabold text-brand-gold">Your Selection</span>
                  </div>
                  
                  <div className="space-y-8 p-10 card-premium-light relative z-10 rounded-sm overflow-hidden flex flex-col min-h-[500px]">
                  
                  <div className="max-h-[350px] overflow-y-auto pr-4 custom-scrollbar-minimal mt-4">
                     <CartItems readonly={true} />
                  </div>

                  <div className="space-y-8 pt-8 border-t border-brand-brass/10">
                     {/* Authentication Code */}
                      <div className="relative">
                         <Input 
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                            placeholder="Coupon Code"
                            className="rounded-sm border border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-14 uppercase tracking-[0.3em] text-xs bg-white font-bold px-4 pr-12"
                         />
                         <Tag className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-navy/30 pointer-events-none" />
                      </div>

                      <div className="space-y-4">
                          <div className="flex justify-between items-center">
                             <span className="text-brand-navy/60 uppercase tracking-[0.2em] font-bold text-xs">Subtotal</span>
                             <span className="font-serif text-brand-navy text-xl">₹{subtotal.toLocaleString("en-IN")}</span>
                          </div>
                          <div className="flex justify-between items-center">
                             <span className="text-brand-navy/60 uppercase tracking-[0.2em] font-bold text-xs">Delivery</span>
                            <span className="font-sans text-brand-navy font-bold text-sm">
                               {mode === "pickup" ? "Exclusive (Complimentary)" : 
                                !deliveryInfo?.serviceable ? "Not Available" :
                                deliveryFee === null ? "..." : 
                                deliveryFee === 0 ? "Complimentary" : "₹" + deliveryFee.toLocaleString("en-IN")}
                            </span>
                         </div>
                         {mode === "delivery" && deliveryInfo?.serviceable && deliveryInfo.city && (
                           <div className="flex justify-between items-center">
                              <span className="text-brand-navy/40 uppercase tracking-[0.2em] font-bold text-[10px]">To</span>
                              <span className="font-sans text-brand-navy/60 text-xs">{deliveryInfo.city}, {deliveryInfo.state}</span>
                           </div>
                         )}
                      </div>
                  </div>

                   <div className="pt-8 mt-auto border-t border-brand-navy bg-brand-navy/[0.03] -mx-10 -mb-10 px-10 pb-10 space-y-6">
                      <div className="flex justify-between items-end">
                         <div className="space-y-1">
                            <span className="text-xs uppercase tracking-[0.2em] font-bold text-brand-gold">Total</span>
                         </div>
                         <span className="text-4xl font-sans font-bold text-brand-navy tracking-tight leading-none">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-xs text-center text-brand-navy/50 leading-relaxed">
                         Quality products since 1964. Thank you for shopping with us!
                      </p>
                   </div>
                  </div>
               </div>

               <div className="text-center space-y-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-brand-navy/40 font-bold">In Accordance With</p>
                  <img src="/images/brand/logo_gold_clean.png" alt="Foundry Seal" className="h-12 opacity-30 mx-auto transition-opacity hover:opacity-100" />
               </div>


      {/* Success Modal: The Achievement of Acquisition */}
      <AlertDialog open={!!successOrder} onOpenChange={(open) => {
        if (!open && successOrder) router.push(`/orders/${successOrder}`)
      }}>
        <AlertDialogContent className="max-w-xl bg-white border border-brand-brass/30 rounded-sm p-16 text-center shadow-[0_20px_100px_rgba(201,168,76,0.2)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold" />
          <AlertDialogHeader className="space-y-10">
            <div className="mx-auto w-24 h-24 flex items-center justify-center relative">
               <div className="absolute inset-0 border border-brand-gold animate-spin-slow rounded-full" />
               <CheckCircle2 className="w-10 h-10 text-brand-gold" />
            </div>
            
            <div className="space-y-4">
               <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold">Order Confirmed</span>
               <AlertDialogTitle className="text-4xl md:text-5xl font-serif text-brand-navy tracking-tight leading-none">Order Placed!</AlertDialogTitle>
            </div>

            <AlertDialogDescription className="text-base text-brand-navy/70 leading-relaxed font-sans max-w-sm mx-auto">
               Your order has been placed successfully. Order #{successOrder?.slice(-8)} is being processed. We'll keep you updated!
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="sm:justify-center mt-12 pt-8 border-t border-brand-brass/20">
            <AlertDialogAction 
              className="w-full h-14 bg-brand-navy text-white rounded-sm uppercase tracking-[0.3em] text-xs font-bold hover:bg-brand-gold transition-all duration-700 shadow-md" 
              onClick={() => router.push(`/orders/${successOrder}`)}
            >
              View Order
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  </div>
  )
}
