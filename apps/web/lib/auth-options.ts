import { NextAuthOptions } from "next-auth"

// Mock user for demo purposes - no database required
const mockUser = {
  id: "demo-user-1",
  email: "demo@videoshiksha.com",
  name: "Demo User",
  image: null,
}

export const authOptions: NextAuthOptions = {
  providers: [
    {
      id: "credentials",
      name: "Demo Account",
      type: "credentials",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "demo@videoshiksha.com" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Demo login - accept any credentials for landing page demo
        if (credentials?.email && credentials?.password) {
          return {
            id: mockUser.id,
            email: credentials.email,
            name: mockUser.name,
            image: mockUser.image,
          }
        }
        return null
      }
    }
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days for demo
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: "/(auth)/login",
    error: "/(auth)/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
      }
      return session
    }
  },
  secret: process.env.NEXTAUTH_SECRET || "demo-secret-for-landing-page-only",
}
