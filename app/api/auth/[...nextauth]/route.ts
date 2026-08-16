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
    signIn: "/clients/login",
    error: "/clients/login",
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
            return true;
          }

          // Check customers table
          const customers = await sql`SELECT id, role, status FROM customers WHERE email = ${email} LIMIT 1`;
          if (customers.length > 0) {
            if (customers[0].status !== 'ACTIVE') return false;
            return true;
          }

          // Check participants table
          const participants = await sql`SELECT id, status FROM participants WHERE email = ${email} LIMIT 1`;
          if (participants.length > 0) {
            return true;
          }

          // If email is not found in any table, redirect to registration OTP wizard
          return `/clients/login?error=NotRegistered&email=${encodeURIComponent(email)}`;
        } catch (error) {
          console.error("Auth Error:", error);
          return false;
        }
      }
      return false;
    },
    async jwt({ token }) {
      if (token?.email) {
        try {
          const admins = await sql`SELECT id, role FROM admins WHERE email = ${token.email} LIMIT 1`;
          if (admins.length > 0) {
            token.role = admins[0].role;
            token.db_id = admins[0].id;
            return token;
          }

          const customers = await sql`SELECT id, role FROM customers WHERE email = ${token.email} LIMIT 1`;
          if (customers.length > 0) {
            token.role = customers[0].role;
            token.db_id = customers[0].id;
            return token;
          }

          const participants = await sql`SELECT id FROM participants WHERE email = ${token.email} LIMIT 1`;
          if (participants.length > 0) {
            token.role = 'PARTICIPANT';
            token.db_id = participants[0].id;
            return token;
          }
        } catch (err) {
          console.error("JWT Error:", err);
        }
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

