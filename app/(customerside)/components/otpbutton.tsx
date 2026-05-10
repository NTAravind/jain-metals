'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Check, RotateCcw, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface OTPButtonProps {
    phone: string
    onOtpSent?: () => void
    disabled?: boolean
    className?: string
}

interface OTPResponse {
    success: boolean
    error?: string
    message?: string
}

export default function OTPButton({
    phone,
    onOtpSent,
    disabled = false,
    className
}: OTPButtonProps) {
    const [loading, setLoading] = useState<boolean>(false)
    const [success, setSuccess] = useState<boolean>(false)
    const [error, setError] = useState<string>('')

    const isValidPhone = (phoneNumber: string): boolean => {
        // Remove all non-numeric characters
        const cleaned = phoneNumber.replace(/\D/g, '')
        // Check if it's a valid 10-digit Indian phone number starting with 6-9
        return cleaned.length === 10 && /^[6-9]/.test(cleaned)
    }

    const sendOTP = async (): Promise<void> => {
        if (!phone.trim() || !isValidPhone(phone)) {
            setError('Please enter a valid Indian mobile number (starting with 6-9)')
            return
        }

        setLoading(true)
        setSuccess(false)
        setError('')

        try {
            const response = await fetch('/api/message/send-otp', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: phone.replace(/\D/g, '') }),
            })

            const data: OTPResponse = await response.json()

            if (response.ok && data.success) {
                setSuccess(true)
                onOtpSent?.()
            } else {
                setError(data.error || 'Failed to send verification code. Please try again.')
            }
        } catch (err) {
            console.error('OTP send error:', err)
            setError('Network error. Please check your connection and try again.')
        } finally {
            setLoading(false)
        }
    }

    const resetState = (): void => {
        setSuccess(false)
        setError('')
    }

    const isDisabled = loading || success || disabled || !phone.trim() || !isValidPhone(phone)

    return (
        <div className="space-y-3">
            <Button
                onClick={success ? resetState : sendOTP}
                disabled={loading || (disabled && !success)}
                className={cn(
                    "w-full h-14 transition-all duration-500 rounded-none text-[11px] font-bold uppercase tracking-[0.25em]",
                    success
                        ? "bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30"
                        : error
                            ? "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                            : "bg-brand-gold hover:bg-brand-gold-soft text-brand-navy",
                    className
                )}
            >
                {loading ? (
                    <div className="flex items-center gap-3">
                        <RotateCcw className="h-4 w-4 animate-spin text-brand-navy" />
                        <span>Sending...</span>
                    </div>
                ) : success ? (
                    <div className="flex items-center gap-3">
                        <Check className="h-4 w-4" />
                        <span>Code Sent</span>
                    </div>
                ) : error ? (
                    <div className="flex items-center gap-3">
                        <AlertCircle className="h-4 w-4" />
                        <span>Try Again</span>
                    </div>
                ) : (
                    "Send Verification Code"
                )}
            </Button>

            {/* Error Message */}
            {error && (
                <div className="flex items-start gap-3 p-4 bg-red-500/5 border border-red-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-[11px] font-medium tracking-wide text-red-400/90 leading-relaxed uppercase">{error}</p>
                </div>
            )}

            {/* Success Message */}
            {success && !error && (
                <div className="flex items-start gap-3 p-4 bg-green-500/5 border border-green-500/20 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Check className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                    <div className="text-[11px] font-medium tracking-wide text-green-400/90 uppercase leading-relaxed">
                        <p>Code dispatched safely</p>
                        <p className="opacity-60 mt-1">Check WhatsApp for your 6-digit key</p>
                    </div>
                </div>
            )}

            {/* Helper Text */}
            {!success && !error && !loading && (
                <p className="text-[9px] font-bold uppercase tracking-[0.3em] text-brand-gold/30 text-center">
                    {"Verification delivered via WhatsApp"}
                </p>
            )}
        </div>
    )
}