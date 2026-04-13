import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
    interface User {
        role?: string;
        accessToken?: string;
    }

    interface Session {
        accessToken?: string;
        user: {
            role?: string;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT {
        role?: string;
        accessToken?: string;
    }
}
