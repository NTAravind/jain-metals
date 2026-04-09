import NextAuth, { type NextAuthOptions } from "next-auth"
import { verifyOtp } from "@/lib/otpstore"
import Credentials from "next-auth/providers/credentials"
import { getServerSession } from "next-auth/next"
import { prisma } from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      credentials: {
        phone: {},
        otp: {},
      },
      authorize: async (credentials) => {
        if (!credentials || !credentials.phone || !credentials.otp) {
          throw new Error("Phone number and OTP are required.")
        }

        const verified = await verifyOtp(
          credentials.phone as string,
          credentials.otp as string,
        )

        if (!verified) {
          throw new Error("Invalid credentials.")
        }

        // Upsert the real DB user so we always get the true UUID
        const dbUser = await prisma.user.upsert({
          where: { phone: credentials.phone as string },
          update: {},
          create: {
            phone: credentials.phone as string,
            name: credentials.phone as string,
            role: "CUSTOMER",
          },
        })

        return {
          id: dbUser.id,
          name: dbUser.name ?? undefined,
          phone: dbUser.phone ?? undefined,
          role: dbUser.role,
        } as any
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 2147483647,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id ?? ""
        token.phone = (user as any).phone ?? ""
        token.role = (user as any).role ?? "CUSTOMER"
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id
        ;(session.user as any).phone = token.phone
        ;(session.user as any).role = token.role
      }
      return session
    },
  },
}

export const auth = () => getServerSession(authOptions)