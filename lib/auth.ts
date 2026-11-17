import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "./db";
import type { UserRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: UserRole;
      schoolId: string | null;
    } & DefaultSession["user"];
  }
  interface User {
    role: UserRole;
    schoolId: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: UserRole;
    schoolId: string | null;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const { auth, handlers, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;
        const user = await db.user.findUnique({
          where: { email: email.toLowerCase() },
        });

        if (!user?.passwordHash || !user.isActive) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // Record login
        await db.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          schoolId: user.schoolId,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
        token.schoolId = user.schoolId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.schoolId = token.schoolId;
      }
      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isAuthed = !!auth?.user;

      // Public pages
      const publicPaths = ["/login", "/register", "/", "/api/auth"];
      if (publicPaths.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
        return true;
      }

      if (!isAuthed) return false;

      // Role-scoped routes
      const role = auth!.user.role;
      if (pathname.startsWith("/super-admin") && role !== "SUPER_ADMIN") return false;
      if (pathname.startsWith("/admin") && !["SCHOOL_ADMIN", "ACCOUNTANT"].includes(role)) return false;
      if (pathname.startsWith("/teacher") && role !== "TEACHER") return false;
      if (pathname.startsWith("/parent") && role !== "PARENT") return false;

      return true;
    },
  },
});
