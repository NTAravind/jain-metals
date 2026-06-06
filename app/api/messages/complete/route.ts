import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { orderNumber, phone } = await request.json()
    console.log('Received request to complete order:', { orderNumber, phone })

    if (!orderNumber) {
      return NextResponse.json(
        { error: 'Order number is required' },
        { status: 400 }
      )
    }

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      )
    }

  
    const updatedOrder = await prisma.order.update({
      where: { orderNumber },
      data: {
        status: "SHIPPED"
      }
    })

    // Send WhatsApp notification
    const whatsappResult = await SendWhatsappmsg(phone, updatedOrder.id)

    if (!whatsappResult.success) {
      console.error('WhatsApp notification failed:', whatsappResult.error)
      return NextResponse.json({
        ...updatedOrder,
        warning: 'Order completed but notification failed to send'
      })
    }

    return NextResponse.json({
      ...updatedOrder,
      notificationSent: true
    })

  } catch (error: any) {
    console.error('Error updating order:', error)

    if (error?.code === 'P2025') {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'Failed to update order',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

async function SendWhatsappmsg(phone: string, orderid: string): Promise<{ success: boolean; error?: string; data?: any }> {
  try {
    if (!process.env.WHATSAPPPHONE) {
      throw new Error('WHATSAPPPHONE environment variable is not set')
    }

    if (!process.env.WHATSAPPENV) {
      throw new Error('WHATSAPPENV environment variable is not set')
    }

    if (!phone || phone.trim() === '') {
      throw new Error('Phone number is required')
    }

    const cleanPhone = phone.replace(/\D/g, '')

    if (cleanPhone.length !== 10) {
      throw new Error(`Invalid phone number format: ${phone}. Expected 10 digits, got ${cleanPhone.length}`)
    }

    console.log('Sending WhatsApp message to phone:', cleanPhone)

    const whatsappResponse = await fetch(
      `https://graph.facebook.com/v22.0/${process.env.WHATSAPPPHONE}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPPENV}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: `+91${cleanPhone}`,
          type: 'template',
          template: {
            name: 'tracking',
            language: { code: 'en' },
            components: [
              {
                type: 'body',
                parameters: [{ type: 'text', text: orderid }],
              },
            ],
          },
        }),
      }
    )

    if (!whatsappResponse.ok) {
      const errorData = await whatsappResponse.text()
      console.error('WhatsApp API Error:', {
        status: whatsappResponse.status,
        statusText: whatsappResponse.statusText,
        body: errorData,
        phone: cleanPhone
      })

      return {
        success: false,
        error: `WhatsApp API returned ${whatsappResponse.status}: ${whatsappResponse.statusText}`
      }
    }

    const responseData = await whatsappResponse.json()

    if (responseData.error) {
      console.error('WhatsApp API Error Response:', responseData.error)
      return {
        success: false,
        error: responseData.error.message || 'WhatsApp API error'
      }
    }

    console.log('WhatsApp message sent successfully:', {
      to: `+91${cleanPhone}`,
      orderId: orderid,
      messageId: responseData.messages?.[0]?.id
    })

    return {
      success: true,
      data: responseData
    }

  } catch (error: any) {
    console.error('Error sending WhatsApp message:', {
      phone,
      orderid,
      error: error.message,
      stack: error.stack
    })

    return {
      success: false,
      error: error.message || 'Unknown error occurred while sending WhatsApp message'
    }
  }
}