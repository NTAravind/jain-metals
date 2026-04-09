import { auth } from "@/app/auth"
import { headers } from "next/headers"
import { checkpass } from "./adminauth"

export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode = 401,
  ) {
    super(message)
    this.name = "AuthError"
  }
}

/**
 * Returns the session user. Throws 401 if not signed in.
 */
export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) throw new AuthError("Sign in required.", 401)
  return session.user as {
    id: string
    phone: string
    role: "CUSTOMER" | "ADMIN"
    name?: string | null
    email?: string | null
  }
}

/**
 * Returns the session user. Throws 403 if role is not ADMIN.
 */
export async function requireAdmin() {
  const headersList = await headers()
  const authhead = headersList.get("authorization") || headersList.get("Authorization")

  if (!authhead) {
    throw new AuthError("Admin access required.", 403)
  }

  try {
    const [username, pass] = Buffer.from(authhead.split(" ")[1], "base64").toString().split(":")
    const usernameMatch = username === process.env.ADMIN_USERNAME
    const passwordMatch = await checkpass(pass, process.env.HASHED_ADMIN_PASSWORD as string)

    if (usernameMatch && passwordMatch) {
      return { id: "admin", phone: "admin", role: "ADMIN" } as const
    } else {
      throw new AuthError("Admin access required.", 403)
    }
  } catch(e) {
    throw new AuthError("Admin access required.", 403)
  }
}

/**
 * Returns the session user. Throws 403 if not CUSTOMER or ADMIN.
 */
export async function requireCustomer() {
  const user = await requireAuth()
  if (user.role !== "CUSTOMER" && user.role !== "ADMIN")
    throw new AuthError("Access denied.", 403)
  return user
}

/**
 * Verifies the current user owns a resource.
 * Admins bypass ownership — they can access any resource.
 */
export async function requireOwnership(resourceUserId: string) {
  const user = await requireAuth()
  if (user.role === "ADMIN") return user
  if (user.id !== resourceUserId)
    throw new AuthError("You do not have access to this resource.", 403)
  return user
}
