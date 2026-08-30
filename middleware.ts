import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
const auth = req.headers.get("authorization");

const user = process.env.ADMIN_USER;
const pass = process.env.ADMIN_PASSWORD;

if (auth) {
const [, base64] = auth.split(" ");
const [u, p] = atob(base64).split(":");
if (u === user && p === pass) {
return NextResponse.next();
}
}

return new NextResponse("Auth required", {
status: 401,
headers: { "WWW-Authenticate": 'Basic realm="Admin"' },
});
}

export const config = {
matcher: ["/admin", "/api/admin/:path*"],
};
