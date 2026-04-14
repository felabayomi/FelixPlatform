import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isAdmin = pathname.startsWith("/admin");
    const isGrantee = pathname.startsWith("/grantee");

    const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
    });

    const role = token?.role as string | undefined;

    const isAdminRole = role === "admin" || role === "superadmin";

    if (isAdmin && !isAdminRole) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    if (isGrantee && role !== "grantee") {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/grantee/:path*", "/admin/:path*"],
};
