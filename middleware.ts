import { withAuth } from "next-auth/middleware"
import { NextResponse, type NextRequest } from "next/server"
import { checkpass, hashedPass } from "@/lib/adminauth"

async function generateHashForPassword(password: string) {
  return await hashedPass(password);
}

async function isauthenticated(req: NextRequest) {
  const authhead = req.headers.get("authorization") || req.headers.get("Authorization");
  
  if (authhead == null) {
    return false;
  }
  
  try {
    const [username, pass] = Buffer.from(authhead.split(" ")[1], "base64").toString().split(":");
    const usernameMatch = username === process.env.ADMIN_USERNAME;
    const passwordMatch = await checkpass(pass, process.env.HASHED_ADMIN_PASSWORD as string);
    return usernameMatch && passwordMatch;
  } catch (error) {
    return false;
  }
}

export default withAuth(
  async function middleware(req) {
    const { pathname } = req.nextUrl

    // /admin and /api/admin — ADMIN role requires Basic Auth
    if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
      // Generate hash on first deployment - remove this after setting HASHED_ADMIN_PASSWORD
      if (!process.env.HASHED_ADMIN_PASSWORD && process.env.ADMIN_PASSWORD) {
        const generatedHash = await generateHashForPassword(process.env.ADMIN_PASSWORD);
        console.log("=== HASH GENERATION ===");
        console.log("Generated hash for your password:", generatedHash);
        console.log("Set this as your HASHED_ADMIN_PASSWORD environment variable");
        console.log("Then remove ADMIN_PASSWORD and this generation code");
        console.log("=======================");
      }

      const authenticated = await isauthenticated(req as NextRequest);
      if (!authenticated) {
        return new NextResponse("UnAuthorized", { 
          status: 401, 
          headers: { "WWW-Authenticate": "Basic" } 
        });
      }
      return NextResponse.next();
    }

    // /checkout and /orders — any NextAuth user
    if (pathname.startsWith("/checkout") || pathname.startsWith("/orders")) {
      if (!req.nextauth.token) {
        const cb = encodeURIComponent(pathname)
        return NextResponse.redirect(new URL(`/login?callbackUrl=${cb}`, req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: () => true, // Let the middleware body handle auth checks
    },
  }
)

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/checkout/:path*", "/orders/:path*"],
}
