import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { sql } from "@/lib/neon";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login", // This is just a fallback, middleware will redirect based on portal
    error: "/login",
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        const email = profile?.email;
        if (!email) return false;

        try {
          // Check admins table
          const admins = await sql`SELECT id, role, status FROM admins WHERE email = ${email} LIMIT 1`;
          if (admins.length > 0) {
            if (admins[0].status !== 'ACTIVE') return false;
            (profile as any).role = admins[0].role;
            (profile as any).db_id = admins[0].id;
            return true;
          }

          // Check customers table
          const customers = await sql`SELECT id, role, status FROM customers WHERE email = ${email} LIMIT 1`;
          if (customers.length > 0) {
            if (customers[0].status !== 'ACTIVE') return false;
            (profile as any).role = customers[0].role;
            (profile as any).db_id = customers[0].id;
            return true;
          }

          // Check participants table
          const participants = await sql`SELECT id, status FROM participants WHERE email = ${email} LIMIT 1`;
          if (participants.length > 0) {
            (profile as any).role = 'PARTICIPANT';
            (profile as any).db_id = participants[0].id;
            return true;
          }

          return false;
        } catch (error) {
          console.error("Auth Error:", error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token, profile }) {
      if (profile) {
        token.role = (profile as any).role;
        token.db_id = (profile as any).db_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).role = token.role;
        (session.user as any).id = token.db_id;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
