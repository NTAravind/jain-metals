import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string
      phone: string
      role: "CUSTOMER" | "ADMIN"
    }
  }

  interface User {
    id: string
    phone?: string
    role?: "CUSTOMER" | "ADMIN"
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    phone: string
    role: "CUSTOMER" | "ADMIN"
  }
}
