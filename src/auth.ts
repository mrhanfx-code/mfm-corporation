import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;

        if (!username || !password) return null;
        if (username !== "admin") return null;

        const hashB64 = process.env.ADMIN_PASSWORD_HASH_B64;
        if (!hashB64) return null;
        const hash = Buffer.from(hashB64, "base64").toString("utf8");

        const valid = await bcrypt.compare(password, hash);
        if (!valid) return null;

        return { id: "1", name: "Admin", email: "admin@mfm-corp.local" };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  callbacks: {
    authorized({ auth }) {
      return !!auth?.user;
    },
  },
});
