import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth-options"

// Force dynamic rendering to prevent static optimization
// This avoids Prisma initialization and Edge Runtime issues during build
export const dynamic = 'force-dynamic'

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
