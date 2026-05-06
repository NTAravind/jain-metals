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
import { validateCouponAction } from "@/actions/coupons"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CartItems } from "@/components/cart-items"
import {
  Truck,
  Store,
  CheckCircle2,
  Edit3,
  Loader2,
  Zap,
  ArrowRight,
  X,
  TicketPercent,
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
  const [couponLoading, setCouponLoading] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    type: "PERCENTAGE" | "FIXED" | "FREE_DELIVERY"
    value: number
    discountAmount: number
  } | null>(null)
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
        couponCode: appliedCoupon?.code || undefined,
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

  // Calculate discount amount from applied coupon
  const discountAmount = appliedCoupon
    ? appliedCoupon.type === "PERCENTAGE"
      ? Math.round((subtotal * appliedCoupon.value) / 100 * 100) / 100
      : appliedCoupon.type === "FIXED"
      ? Math.min(appliedCoupon.value, subtotal)
      : 0 // FREE_DELIVERY: handled as deliveryFee = 0
    : 0

  const effectiveDeliveryFee = appliedCoupon?.type === "FREE_DELIVERY" ? 0 : (deliveryFee ?? 0)
  const total = subtotal - discountAmount + effectiveDeliveryFee

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return
    setCouponLoading(true)
    try {
      const result = await validateCouponAction(coupon.trim(), subtotal)
      if (!result.valid) {
        toast.error(result.reason)
        setAppliedCoupon(null)
        return
      }
      const discount = result as { valid: true; code: string | null; type: "PERCENTAGE" | "FIXED" | "FREE_DELIVERY"; value: number }
      const amt =
        discount.type === "PERCENTAGE"
          ? Math.round((subtotal * discount.value) / 100 * 100) / 100
          : discount.type === "FIXED"
          ? Math.min(discount.value, subtotal)
          : 0
      setAppliedCoupon({
        code: discount.code ?? coupon.trim().toUpperCase(),
        type: discount.type,
        value: discount.value,
        discountAmount: amt,
      })
      toast.success(
        discount.type === "FREE_DELIVERY"
          ? "Free delivery coupon applied!"
          : `Coupon applied — ₹${amt.toLocaleString("en-IN")} off!`
      )
    } catch {
      toast.error("Failed to validate coupon")
    } finally {
      setCouponLoading(false)
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    setCoupon("")
  }

  return (
    <div className={cn("bg-white min-h-screen white-pattern storefront", "pb-24 sm:pb-0")}>
      {/* Editorial Header */}
      <header className="pt-24 sm:pt-32 pb-12 sm:pb-20 px-4 sm:px-8 text-center bg-brand-cream/[0.03] border-b border-brand-brass/10">
         <div className="max-w-4xl mx-auto space-y-5 sm:space-y-6">
            <span className="text-[11px] sm:text-xs uppercase tracking-[0.24em] sm:tracking-[0.3em] font-bold text-brand-gold">Checkout</span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-brand-navy tracking-normal leading-[0.95]">Complete Your Order</h1>
            <div className="h-px w-24 bg-brand-gold/50 mx-auto" />
            <p className="text-sm sm:text-base text-brand-navy/70 font-sans max-w-lg mx-auto leading-relaxed">
               Review your order details and place your order.
            </p>
         </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-4 sm:px-8 py-10 sm:py-20 lg:py-32">
        <div className="flex flex-col lg:flex-row gap-12 sm:gap-20 xl:gap-32">
          
          {/* Main Acquisition Flow */}
          <div className="order-2 lg:order-1 flex-1 min-w-0 space-y-12 sm:space-y-20 lg:space-y-24">
            {/* Logical Steps Wrapper */}
            <div className="space-y-12 sm:space-y-20 lg:space-y-24">
               {/* Step 1: Physical Parameters / Identification */}
               <section className={cn(
                  "space-y-5 sm:space-y-10 bg-white border border-brand-brass/15 shadow-sm p-4 sm:p-8 lg:p-10 transition-opacity duration-1000",
                  step === "summary" ? "opacity-40 pointer-events-none" : "opacity-100"
               )}>
                   <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                      <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.3em] font-bold text-brand-gold">Step 01</span>
                      <div className="hidden sm:block h-px w-20 bg-brand-gold/50" />
                      <h2 className="w-full sm:w-auto text-2xl sm:text-3xl font-serif text-brand-navy leading-none">
                         {mode === "delivery" ? "Delivery Address" : "Contact Details"}
                      </h2>
                   </div>

                  <div className="space-y-8 sm:space-y-12 md:pl-12 md:border-l border-brand-brass/20 md:ml-4 pt-2 sm:pt-4">
                     {mode === "delivery" ? (
                        <div className="grid md:grid-cols-2 gap-x-12 gap-y-6 sm:gap-y-10">
                            <div className="space-y-3">
                               <label className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/70">Full Name</label>
                               <Input
                                  value={form.fullName}
                                  onChange={(e) => handleAddressChange("fullName", e.target.value)}
                                  className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-12 sm:h-14 bg-white px-4 text-brand-navy font-serif text-base sm:text-lg shadow-sm"
                                  placeholder="Your full name"
                               />
                            </div>
                            <div className="space-y-3">
                               <label className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/70">Phone Number</label>
                              <Input
                                 value={form.phone}
                                 onChange={(e) => handleAddressChange("phone", e.target.value)}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-12 sm:h-14 bg-white px-4 text-brand-navy font-serif text-base sm:text-lg shadow-sm"
                                 placeholder="+91..."
                              />
                           </div>
                           <div className="md:col-span-2 space-y-4">
                              <label className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/70">Detailed Physical Address</label>
                              <Input
                                 value={form.line1}
                                 onChange={(e) => handleAddressChange("line1", e.target.value)}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-12 sm:h-14 bg-white px-4 text-brand-navy font-serif text-base sm:text-lg shadow-sm"
                                 placeholder="Street Address, Block, etc."
                              />
                              <Input
                                 value={form.line2}
                                 onChange={(e) => handleAddressChange("line2", e.target.value)}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-12 sm:h-14 bg-white px-4 text-brand-navy font-serif text-base sm:text-lg shadow-sm"
                                 placeholder="Suite, Landmark (Optional)"
                              />
                           </div>
                           <div className="grid sm:grid-cols-2 gap-6 md:gap-12 md:col-span-2">
                              <div className="space-y-3">
                                 <label className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/70">City</label>
                                 <Input
                                    value={form.city}
                                    onChange={(e) => handleAddressChange("city", e.target.value)}
                                    className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-12 sm:h-14 bg-white px-4 text-brand-navy font-serif text-base sm:text-lg shadow-sm"
                                 />
                              </div>
                              <div className="space-y-3">
                                 <label className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/70">State / Territory</label>
                                 <Input
                                    value={form.state}
                                    onChange={(e) => handleAddressChange("state", e.target.value)}
                                    className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-12 sm:h-14 bg-white px-4 text-brand-navy font-serif text-base sm:text-lg shadow-sm"
                                 />
                              </div>
                           </div>
                            <div className="space-y-3">
                               <label className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/70">Registry Pincode</label>
                               <Input
                                  value={form.pincode}
                                  maxLength={6}
                                  onChange={(e) => handleAddressChange("pincode", e.target.value.replace(/\D/g, "").slice(0, 6))}
                                  className={cn(
                                    "rounded-sm border-x border-t border-b h-12 sm:h-14 bg-white px-4 font-serif text-base sm:text-lg shadow-sm",
                                    deliveryInfo?.serviceable === true ? "border-green-500/50 focus-visible:ring-green-500" : 
                                    deliveryInfo?.serviceable === false ? "border-red-500/50 focus-visible:ring-red-500" :
                                    "border-brand-brass/30 focus-visible:ring-brand-gold"
                                  )}
                               />
                               {feeLoading && <p className="text-[11px] sm:text-xs italic text-brand-gold font-bold uppercase tracking-[0.14em] sm:tracking-[0.2em] pt-2">Checking delivery availability...</p>}
                               {!feeLoading && form.pincode.length === 6 && deliveryInfo && (
                                 <div className={cn(
                                   "text-[11px] sm:text-xs font-bold uppercase tracking-[0.12em] sm:tracking-[0.2em] pt-2 leading-relaxed",
                                   deliveryInfo.serviceable ? "text-green-600" : "text-red-500"
                                 )}>
                                   {deliveryInfo.serviceable 
                                     ? `Delivery available${deliveryInfo.city ? ` to ${deliveryInfo.city}, ${deliveryInfo.state}` : deliveryInfo.state ? ` in ${deliveryInfo.state}` : ""}`
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
                        <div className="grid md:grid-cols-2 gap-6 sm:gap-12">
                           <div className="space-y-3">
                              <label className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/70">Curator Name</label>
                              <Input
                                 value={pickupForm.fullName}
                                 onChange={(e) => setPickupForm((p) => ({ ...p, fullName: e.target.value }))}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-12 sm:h-14 bg-white px-4 text-brand-navy font-serif text-base sm:text-lg shadow-sm"
                                 placeholder="Legal Signature"
                              />
                           </div>
                           <div className="space-y-3">
                              <label className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/70">Authorized Phone</label>
                              <Input
                                 value={pickupForm.phone}
                                 onChange={(e) => setPickupForm((p) => ({ ...p, phone: e.target.value }))}
                                 className="rounded-sm border-x border-t border-b border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-12 sm:h-14 bg-white px-4 text-brand-navy font-serif text-base sm:text-lg shadow-sm"
                                 placeholder="+91..."
                              />
                           </div>
                        </div>
                     )}

	                     {step === "details" && (
	                        <div className="hidden sm:block pt-6">
	                           <Button
                              onClick={handleSaveAddress}
                              disabled={saving}
                              className="w-full h-14 sm:h-16 bg-brand-navy text-white hover:bg-brand-gold rounded-sm uppercase tracking-[0.18em] sm:tracking-[0.3em] text-[11px] sm:text-xs font-bold transition-all duration-500 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                           >
                              {saving ? <Loader2 className="animate-spin w-5 h-5 mr-3" /> : null}
                              {saving ? "Authorizing..." : "Authorize Identification"}
                           </Button>
                        </div>
                     )}
	                  </div>
	               </section>

               {/* Mode Selection: The Choice of Path */}
               <section className="space-y-5 sm:space-y-10">
                  <div className="flex flex-wrap items-center gap-3 sm:gap-6">
                     <span className="text-[11px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.3em] font-bold text-brand-gold">Step 02</span>
                     <h3 className="text-xs sm:text-sm uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/60">Delivery Method</h3>
                  </div>
                 <div className="grid md:grid-cols-2 gap-4 sm:gap-8">
                    <button
                       onClick={() => { setMode("delivery"); setStep("details"); setAddressSaved(false) }}
                       className={cn(
                         "group flex flex-row sm:flex-col items-start gap-4 sm:gap-6 p-5 sm:p-10 border text-left rounded-sm transition-all duration-700 relative overflow-hidden bg-white",
                         mode === "delivery" ? "border-brand-gold bg-brand-cream/[0.1] shadow-lg shadow-brand-gold/5" : "border-brand-brass/20 hover:border-brand-navy/40 shadow-sm"
                       )}
                    >
                       <div className={cn(
                         "w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-full transition-all duration-700",
                         mode === "delivery" ? "bg-brand-navy text-white shadow-md" : "bg-brand-navy/5 text-brand-navy/50 group-hover:bg-brand-navy/10"
                       )}>
                          <Truck className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="font-serif text-xl sm:text-2xl text-brand-navy leading-none mb-2 sm:mb-3">Home Delivery</p>
                          <p className="text-sm text-brand-navy/70 leading-relaxed">Get your order delivered safely to your doorstep across India.</p>
                       </div>
                    </button>

                    <button
                       onClick={() => { setMode("pickup") ; setStep("details"); setAddressSaved(false); setDeliveryFee(0) }}
                       className={cn(
                         "group flex flex-row sm:flex-col items-start gap-4 sm:gap-6 p-5 sm:p-10 border text-left rounded-sm transition-all duration-700 relative overflow-hidden bg-white",
                         mode === "pickup" ? "border-brand-gold bg-brand-cream/[0.1] shadow-lg shadow-brand-gold/5" : "border-brand-brass/20 hover:border-brand-navy/40 shadow-sm"
                       )}
                    >
                       <div className={cn(
                         "w-11 h-11 sm:w-14 sm:h-14 shrink-0 flex items-center justify-center rounded-full transition-all duration-700",
                         mode === "pickup" ? "bg-brand-navy text-white shadow-md" : "bg-brand-navy/5 text-brand-navy/50 group-hover:bg-brand-navy/10"
                       )}>
                          <Store className="w-6 h-6" />
                       </div>
                       <div>
                          <p className="font-serif text-xl sm:text-2xl text-brand-navy leading-none mb-2 sm:mb-3">Pickup</p>
                          <p className="text-sm text-brand-navy/70 leading-relaxed">Collect your order directly from our shop in [City].</p>
                       </div>
                    </button>
                 </div>
               </section>

	               {/* Step 2: Acquisition Summary / Final Authorization */}
               <section className={cn(
                  "space-y-6 sm:space-y-12 transition-all duration-1000 transform",
                  step === "summary" ? "opacity-100 translate-y-0" : "opacity-40 pointer-events-none translate-y-8"
               )}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-brand-brass/20 pb-5 sm:pb-8">
                     <div className="flex flex-wrap items-center gap-3 sm:gap-6 min-w-0">
                        <span className="text-[11px] sm:text-xs uppercase tracking-[0.2em] sm:tracking-[0.3em] font-bold text-brand-gold">Registry Phase II</span>
                        <div className="hidden sm:block h-px w-20 bg-brand-gold/50" />
                        <h2 className="w-full sm:w-auto text-2xl sm:text-3xl font-serif text-brand-navy leading-none italic">Acquisition Authorization</h2>
                     </div>
                     {step === "summary" && (
                        <Button 
                           variant="ghost" 
                           onClick={() => setStep("details")} 
                           className="w-full sm:w-auto justify-center text-brand-gold hover:bg-brand-gold/10 hover:text-brand-navy uppercase tracking-[0.16em] sm:tracking-[0.2em] text-[11px] sm:text-xs font-bold transition-all px-3 sm:px-4 py-2"
                        >
                           <Edit3 className="w-4 h-4 mr-2" /> Revise Phase I
                        </Button>
                     )}
                  </div>

                  <div className="space-y-8 sm:space-y-12 md:pl-12">
                     <div className="grid md:grid-cols-2 gap-5 sm:gap-8">
                        <div className="p-5 sm:p-10 card-premium-light space-y-5 sm:space-y-8 relative overflow-hidden group">
                           <div className="absolute top-0 right-0 w-20 sm:w-32 h-20 sm:h-32 bg-brand-gold/10 blur-[60px] rounded-full" />
                           <div className="space-y-2 border-b border-brand-brass/10 pb-4 sm:pb-6 z-10 relative">
                               <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/60">Items</p>
                               <p className="text-2xl sm:text-3xl font-serif text-brand-navy">{items.length} Products</p>
                            </div>
                            <div className="space-y-2 border-b border-brand-brass/10 pb-4 sm:pb-6 z-10 relative">
                               <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/60">Delivery</p>
                               <p className="text-lg sm:text-xl font-serif text-brand-navy">{mode === "delivery" ? "Home Delivery" : "Pickup"}</p>
                            </div>
                            <div className="space-y-2 z-10 relative">
                               <p className="text-[11px] sm:text-xs uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-brand-navy/60">Delivery Time</p>
                               <p className="text-lg sm:text-xl font-serif text-brand-navy">3 - 7 Days</p>
                            </div>
                        </div>

                         <div className="flex flex-col justify-center space-y-6 sm:space-y-10">
                            <div className="space-y-4">
                               <p className="text-sm text-brand-navy/70 leading-relaxed font-sans border-l-2 border-brand-gold/30 pl-4">
                                  By placing this order, you agree to our terms and conditions.
                               </p>
                               <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-xs text-brand-navy/60 uppercase tracking-[0.14em] sm:tracking-[0.2em] font-bold pt-2">
                                  <Zap className="w-4 h-4 text-brand-gold" />
                                  <span>Secure Payment Processing</span>
                               </div>
                            </div>

                            <Button
                               onClick={handleCheckout}
                               disabled={loading}
                               className="hidden sm:flex w-full h-20 bg-brand-gold text-brand-navy hover:text-white hover:bg-brand-navy rounded-sm uppercase tracking-[0.3em] text-sm font-bold shadow-xl hover:shadow-2xl transition-all duration-500 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                               <div className="absolute inset-0 bg-white/10 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                               {loading ? (
                                  <div className="flex items-center gap-3">
                                     <Loader2 className="animate-spin w-6 h-6" />
                                     <span>Processing...</span>
                                  </div>
                               ) : (
                                  <span className="flex items-center gap-3 sm:gap-6">Place Order <ArrowRight className="w-5 h-5 opacity-80" /></span>
                               )}
                            </Button>
                         </div>
                     </div>
                  </div>
               </section>
            </div>
          </div>

          {/* Right Sidebar: Curated Summary Panel */}
          <div className="order-1 lg:order-2 w-full lg:w-[450px] space-y-8 sm:space-y-12 shrink-0">
             <div className="lg:sticky lg:top-40 space-y-8 sm:space-y-12">
               <div className="relative group">
                  <div className="absolute -top-3 sm:-top-4 left-4 sm:left-10 max-w-[calc(100%-2rem)] bg-white px-4 sm:px-6 py-1.5 sm:py-2 border border-brand-brass/30 shadow-md rounded-full z-20 transition-transform group-hover:-translate-y-1">
                     <span className="block truncate text-[10px] sm:text-xs uppercase tracking-[0.22em] sm:tracking-[0.3em] font-extrabold text-brand-gold">Your Selection</span>
                  </div>
                  
                  <div className="space-y-5 sm:space-y-8 p-4 sm:p-10 pt-8 sm:pt-10 card-premium-light relative z-10 rounded-sm overflow-hidden flex flex-col min-h-0 sm:min-h-[500px]">
                  
                  <div className="max-h-[260px] sm:max-h-[350px] overflow-y-auto pr-1 sm:pr-4 custom-scrollbar-minimal mt-2 sm:mt-4">
                     <CartItems readonly={true} />
                  </div>

                  <div className="space-y-5 sm:space-y-6 pt-5 sm:pt-8 border-t border-brand-brass/10">
                     {/* Coupon Code */}
                      {appliedCoupon ? (
                        <div className="flex items-center justify-between gap-3 p-3 rounded-sm border border-green-300 bg-green-50">
                          <div className="flex items-center gap-2 min-w-0">
                            <TicketPercent className="w-4 h-4 text-green-600 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-green-700 uppercase tracking-[0.15em]">{appliedCoupon.code}</p>
                              <p className="text-[10px] text-green-600 font-medium mt-0.5">
                                {appliedCoupon.type === "FREE_DELIVERY"
                                  ? "Free delivery applied"
                                  : `−₹${appliedCoupon.discountAmount.toLocaleString("en-IN")} discount`}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={handleRemoveCoupon}
                            className="text-green-600 hover:text-red-500 transition-colors shrink-0"
                            aria-label="Remove coupon"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            value={coupon}
                            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                            placeholder="Coupon Code"
                            className="min-w-0 flex-1 rounded-sm border border-brand-brass/30 focus-visible:ring-1 focus-visible:ring-brand-gold h-12 uppercase tracking-[0.14em] sm:tracking-[0.2em] text-xs bg-white font-bold px-4"
                            onKeyDown={(e) => e.key === "Enter" && handleApplyCoupon()}
                          />
                          <Button
                            type="button"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !coupon.trim()}
                            className="h-12 px-5 rounded-sm bg-brand-navy text-white text-xs font-bold uppercase tracking-widest hover:bg-brand-gold hover:text-brand-navy transition-all shrink-0 disabled:opacity-50"
                          >
                            {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                          </Button>
                        </div>
                      )}

                      <div className="space-y-3">
                          <div className="flex justify-between items-center gap-4">
                             <span className="text-brand-navy/60 uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-[11px] sm:text-xs">Subtotal</span>
                             <span className="font-serif text-brand-navy text-lg sm:text-xl tabular-nums">₹{subtotal.toLocaleString("en-IN")}</span>
                          </div>
                          {discountAmount > 0 && (
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-green-600 uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-[11px] sm:text-xs">Discount</span>
                              <span className="font-sans text-green-600 font-bold text-sm">−₹{discountAmount.toLocaleString("en-IN")}</span>
                            </div>
                          )}
                          {appliedCoupon?.type === "FREE_DELIVERY" && mode === "delivery" && (
                            <div className="flex justify-between items-center gap-4">
                              <span className="text-green-600 uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-[11px] sm:text-xs">Free Delivery</span>
                              <span className="font-sans text-green-600 font-bold text-sm">Coupon applied</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center gap-4">
                             <span className="text-brand-navy/60 uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-[11px] sm:text-xs">Delivery</span>
                            <span className="font-sans text-brand-navy font-bold text-sm text-right">
                               {mode === "pickup" ? "Free (Pickup)" : 
                                appliedCoupon?.type === "FREE_DELIVERY" ? <span className="text-green-600">Free (Coupon)</span> :
                                !deliveryInfo?.serviceable ? "Not Available" :
                                deliveryFee === null ? "..." : 
                                deliveryFee === 0 ? "Free" : "₹" + deliveryFee.toLocaleString("en-IN")}
                            </span>
                         </div>
                         {mode === "delivery" && deliveryInfo?.serviceable && deliveryInfo.city && (
                           <div className="flex justify-between items-center gap-4">
                              <span className="text-brand-navy/40 uppercase tracking-[0.16em] sm:tracking-[0.2em] font-bold text-[10px]">To</span>
                              <span className="font-sans text-brand-navy/60 text-xs text-right">{deliveryInfo.city}, {deliveryInfo.state}</span>
                           </div>
                         )}
                      </div>
                  </div>

                   <div className="pt-5 sm:pt-8 mt-auto border-t border-brand-navy bg-brand-navy/[0.03] -mx-4 sm:-mx-10 -mb-4 sm:-mb-10 px-4 sm:px-10 pb-5 sm:pb-10 space-y-4 sm:space-y-6">
                      <div className="flex justify-between items-end gap-4">
                         <div className="space-y-1">
                            <span className="text-[11px] sm:text-xs uppercase tracking-[0.18em] sm:tracking-[0.2em] font-bold text-brand-gold">Total</span>
                         </div>
                         <span className="text-3xl sm:text-4xl font-sans font-bold text-brand-navy tracking-tight leading-none tabular-nums text-right">₹{total.toLocaleString("en-IN")}</span>
                      </div>
                      <p className="text-xs text-center text-brand-navy/50 leading-relaxed">
                         Quality products since 1964. Thank you for shopping with us!
                      </p>
                   </div>
                  </div>
               </div>

               <div className="text-center space-y-4">
                  <p className="text-[10px] sm:text-xs uppercase tracking-[0.24em] sm:tracking-[0.3em] text-brand-navy/40 font-bold">In Accordance With</p>
                  <img src="/images/brand/logo_gold_clean.png" alt="Foundry Seal" className="h-12 opacity-30 mx-auto transition-opacity hover:opacity-100" />
               </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-brand-brass/20 bg-white/95 px-4 py-3 shadow-[0_-12px_30px_rgba(13,18,53,0.08)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-[480px] items-center gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-navy/45">
              {step === "summary" ? "Total" : "Checkout"}
            </p>
            <p className="truncate font-sans text-lg font-bold leading-none text-brand-navy">
              {step === "summary" ? `₹${total.toLocaleString("en-IN")}` : "Continue"}
            </p>
          </div>
          <Button
            onClick={(e) => {
              if (step === "details") void handleSaveAddress()
              else void handleCheckout(e)
            }}
            disabled={step === "details" ? saving : loading}
            className="ml-auto h-12 flex-1 rounded-sm bg-brand-gold px-4 text-brand-navy hover:bg-brand-navy hover:text-white text-[11px] font-bold uppercase tracking-[0.18em] shadow-lg disabled:opacity-50"
          >
            {(step === "details" ? saving : loading) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : step === "details" ? (
              "Continue"
            ) : (
              "Place Order"
            )}
          </Button>
        </div>
      </div>


      {/* Success Modal: The Achievement of Acquisition */}
      <AlertDialog open={!!successOrder} onOpenChange={(open) => {
        if (!open && successOrder) router.push(`/orders/${successOrder}`)
      }}>
        <AlertDialogContent className="w-[calc(100vw-2rem)] max-w-xl bg-white border border-brand-brass/30 rounded-sm p-6 sm:p-16 text-center shadow-[0_20px_100px_rgba(201,168,76,0.2)] overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-gold" />
          <AlertDialogHeader className="space-y-6 sm:space-y-10">
            <div className="mx-auto w-20 sm:w-24 h-20 sm:h-24 flex items-center justify-center relative">
               <div className="absolute inset-0 border border-brand-gold animate-spin-slow rounded-full" />
               <CheckCircle2 className="w-10 h-10 text-brand-gold" />
            </div>
            
            <div className="space-y-4">
               <span className="text-xs uppercase tracking-[0.3em] font-bold text-brand-gold">Order Confirmed</span>
               <AlertDialogTitle className="text-3xl sm:text-4xl md:text-5xl font-serif text-brand-navy tracking-tight leading-none">Order Placed!</AlertDialogTitle>
            </div>

            <AlertDialogDescription className="text-base text-brand-navy/70 leading-relaxed font-sans max-w-sm mx-auto">
               Your order has been placed successfully. Order #{successOrder?.slice(-8)} is being processed. We'll keep you updated!
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <AlertDialogFooter className="sm:justify-center mt-8 sm:mt-12 pt-6 sm:pt-8 border-t border-brand-brass/20">
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
