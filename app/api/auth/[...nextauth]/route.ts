import NextAuth, { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { resolveCustomerByEmail } from '@/lib/customerResolver';
import { sql } from "@/lib/neon";
import { authenticateParticipant } from "@/lib/participantAuth";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    // Participants without an email sign in with a username + password issued by HR.
    CredentialsProvider({
      id: "participant",
      name: "Peserta",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          return await authenticateParticipant(credentials?.username, credentials?.password);
        } catch (err) {
          console.error("Participant authorize error:", err);
          return null;
        }
      },
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
      if (account?.provider === "participant") return true;
      if (account?.provider === "google") {
        const email = profile?.email;
        if (!email) return false;
        return true;
      }
      return false;
    },
    async jwt({ token, user, account }) {
      // Username/password participants: identity is already verified, no lookups needed.
      if (account?.provider === "participant" && user) {
        token.role = "PARTICIPANT";
        token.db_id = Number(user.id);
        token.email = user.email;
        return token;
      }
      // Fast path: skip 3 queries per request for established participant sessions.
      if (token?.role === "PARTICIPANT" && token?.db_id) {
        return token;
      }

      if (token?.email) {
        try {
          const admins = await sql`SELECT id, role FROM admins WHERE email = ${token.email} LIMIT 1`;
          if (admins.length > 0) {
            token.role = admins[0].role;
            token.db_id = admins[0].id;
            return token;
          }

          const customer = await resolveCustomerByEmail(token.email);
          if (customer) {
            token.role = customer.role;
            token.db_id = customer.id;
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
