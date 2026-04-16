import NextAuth, { type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const API_BASE = (
    process.env.NEXT_PUBLIC_API_URL || "https://felix-platform-backend.onrender.com"
).replace(/\/$/, "");

export const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                const res = await fetch(`${API_BASE}/auth/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: credentials.email,
                        password: credentials.password,
                    }),
                });

                if (!res.ok) return null;

                const data = await res.json();
                if (!data?.user) return null;

                return {
                    id: String(data.user.id),
                    name: data.user.name,
                    email: data.user.email,
                    role: data.user.role,
                    accessToken: data.token,
                };
            },
        }),
    ],

    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = (user as { role?: string }).role;
                token.accessToken = (user as { accessToken?: string }).accessToken;
            }
            return token;
        },

        async session({ session, token }) {
            if (session.user) {
                (session.user as { role?: string }).role = token.role as string;
                (session as { accessToken?: string }).accessToken = token.accessToken as string;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",
    },

    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
