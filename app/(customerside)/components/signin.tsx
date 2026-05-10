"use client"

import { signIn } from "next-auth/react"
import { useState, ChangeEvent } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, ArrowRight, Check, Edit2 } from "lucide-react"
import OTPButton from "@/app/(customerside)/components/otpbutton"

interface SignInFormData {
    phone: string
    otp: string
}

export function SignIn() {
    const [phone, setPhone] = useState<string>("")
    const [otpSent, setOtpSent] = useState<boolean>(false)
    const [otp, setOtp] = useState<string>("")
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

    const credentialsAction = async (formData: SignInFormData): Promise<void> => {
        setIsSubmitting(true)

        try {
            const result = await signIn("credentials", {
                phone: formData.phone.replace(/\D/g, ''), // Send only digits
                otp: formData.otp,
                redirect: false, // Handle redirect manually for better UX
            })

            if (result?.ok) {
                // Redirect to checkout or dashboard
                window.location.href = "/checkout"
            } else {
                console.error("Sign in failed:", result?.error)
                // Handle error - you might want to show an error message
            }
        } catch (error) {
            console.error("Sign in error:", error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleOtpSent = (): void => {
        setOtpSent(true)
    }

    const handleEditPhone = (): void => {
        setOtpSent(false)
        setOtp("")
    }

    const formatPhoneNumber = (value: string): string => {
        // Remove all non-numeric characters
        const cleaned = value.replace(/\D/g, '')

        // Apply formatting
        if (cleaned.length <= 3) {
            return cleaned
        } else if (cleaned.length <= 6) {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`
        } else {
            return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`
        }
    }

    const handlePhoneChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const formatted = formatPhoneNumber(e.target.value)
        setPhone(formatted)
    }

    const handleOtpChange = (e: ChangeEvent<HTMLInputElement>): void => {
        const value = e.target.value.replace(/\D/g, '').slice(0, 6)
        setOtp(value)
    }

    const handleSubmit = (): void => {
        if (otp.length === 6) {
            credentialsAction({ phone, otp })
        }
    }

    const isValidPhone = (): boolean => {
        const cleaned = phone.replace(/\D/g, '')
        return cleaned.length === 10
    }

    const isValidOtp = (): boolean => {
        return otp.length === 6
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 pt-24 sm:pt-32 pb-12 bg-brand-navy blue-texture animate-in fade-in duration-700">
            <div className="w-full max-w-[420px]">

                {/* Header */}
                <div className="text-center mb-8 sm:mb-10">
                    <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 rounded-full border border-brand-gold/30 flex items-center justify-center mb-5 sm:mb-6 bg-brand-surface/40 backdrop-blur-sm relative group">
                        <div className="absolute inset-0 rounded-full bg-brand-gold/5 blur-xl group-hover:bg-brand-gold/10 transition-all duration-700" />
                        <Phone className="h-5 w-5 sm:h-6 sm:w-6 text-brand-gold relative z-10" strokeWidth={1.5} />
                    </div>
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-serif font-medium text-brand-cream tracking-tight mb-2 sm:mb-3">
                        {otpSent ? "Check your phone" : "Ancient Art, Modern Access"}
                    </h1>
                    <p className="text-xs sm:text-sm font-serif italic text-brand-gold/60 max-w-[280px] mx-auto leading-relaxed">
                        {otpSent
                            ? `Enter the 6-digit code sent to ${phone}`
                            : "Enter your phone number to continue your journey"
                        }
                    </p>
                </div>

                {/* Main Card */}
                <Card className="card-premium-dark border-brand-brass/25 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] overflow-hidden relative">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-gold/40 to-transparent" />
                    <CardContent className="p-6 sm:p-8 md:p-10">
                        <div className="space-y-6 sm:space-y-8">

                            {/* Phone Number Section */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="phone" className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold/50">
                                        Phone number
                                    </Label>
                                    {otpSent && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleEditPhone}
                                            className="h-auto p-0 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:text-brand-gold-soft hover:bg-transparent"
                                        >
                                            <Edit2 className="mr-1.5 h-3 w-3" />
                                            Edit
                                        </Button>
                                    )}
                                </div>

                                <div className="relative group">
                                    <Input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="123-456-7890"
                                        className="h-12 sm:h-14 bg-brand-white border-brand-brass/20 text-navy placeholder:text-brand-cream/20 font-medium text-base sm:text-lg tracking-widest focus:border-brand-gold/50 focus:ring-brand-gold/10 rounded-none transition-all duration-500"
                                        disabled={otpSent}
                                        required
                                        maxLength={12}
                                        suppressHydrationWarning
                                    />
                                    {otpSent && (
                                        <div className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2">
                                            <Badge variant="outline" className="h-6 sm:h-7 px-2 sm:px-2.5 text-[8px] sm:text-[9px] font-bold uppercase tracking-widest border-brand-gold/30 text-brand-gold bg-brand-gold/5">
                                                <Check className="mr-1 sm:mr-1.5 h-2.5 w-2.5 sm:h-3 sm:w-3" />
                                                Verified
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                {/* Phone validation hint */}
                                {phone && !isValidPhone() && !otpSent && (
                                    <p className="text-[9px] sm:text-[10px] font-medium tracking-widest uppercase text-red-400/70 pl-1">
                                        Please enter a valid 10-digit number
                                    </p>
                                )}
                            </div>

                            {/* OTP Section */}
                            {otpSent && (
                                <div className="space-y-4 animate-in slide-in-from-bottom-3 duration-500">
                                    <Label htmlFor="otp" className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-brand-gold/50">
                                        Verification code
                                    </Label>

                                    <Input
                                        type="text"
                                        id="otp"
                                        name="otp"
                                        value={otp}
                                        onChange={handleOtpChange}
                                        placeholder="······"
                                        className="h-14 sm:h-16 bg-brand-navy border-brand-brass/20 text-brand-gold placeholder:text-brand-gold/20 text-center text-2xl sm:text-3xl tracking-[0.4em] font-serif focus:border-brand-gold/50 focus:ring-brand-gold/10 rounded-none transition-all duration-500"
                                        maxLength={6}
                                        autoComplete="one-time-code"
                                        autoFocus
                                        required
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        suppressHydrationWarning
                                    />

                                    <div className="flex items-center justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-navy px-1">
                                        <span>Code expires in 5:00</span>
                                        <button
                                            type="button"
                                            className="text-brand-gold hover:text-brand-gold-soft transition-colors"
                                            onClick={() => setOtpSent(false)}
                                        >
                                            Resend code
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Action Button */}
                            <div className="pt-2 sm:pt-4">
                                {!otpSent ? (
                                    <OTPButton
                                        phone={phone}
                                        onOtpSent={handleOtpSent}
                                        disabled={!isValidPhone()}
                                        className="w-full h-12 sm:h-14 bg-brand-gold hover:bg-brand-gold-soft text-brand-navy rounded-none text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] shadow-lg shadow-brand-gold/10 border-none transition-all duration-500 group"
                                    />
                                ) : (
                                    <Button
                                        onClick={handleSubmit}
                                        className="w-full h-12 sm:h-14 bg-brand-gold hover:bg-brand-gold-soft text-brand-navy rounded-none text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.25em] shadow-lg shadow-brand-gold/10 border-none transition-all duration-500 group"
                                        disabled={!isValidOtp() || isSubmitting}
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="mr-2 sm:mr-3 h-4 w-4 animate-spin rounded-full border-2 border-brand-navy border-t-transparent" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                Enter the Sanctuary
                                                <ArrowRight className="ml-2 sm:ml-2.5 h-4 w-4 transition-transform group-hover:translate-x-1" />
                                            </>
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Footer */}
                <div className="mt-8 sm:mt-10 text-center">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.25em] text-brand-cream/30">
                        Secure Access by Jain Metals &copy; 1964
                    </p>
                    <div className="mt-3 sm:mt-4 flex items-center justify-center gap-4 sm:gap-6">
                        <button className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em] text-brand-gold/40 hover:text-brand-gold transition-colors">Terms</button>
                        <div className="w-1 h-1 rounded-full bg-brand-gold/20" />
                        <button className="text-[8px] sm:text-[9px] font-bold uppercase tracking-[0.3em] text-brand-gold/40 hover:text-brand-gold transition-colors">Privacy</button>
                    </div>
                </div>
            </div>
        </div>
    )
}