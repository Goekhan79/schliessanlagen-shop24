import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
const products = await sql`SELECT * FROM products ORDER BY id DESC`;
return NextResponse.json(products);
}

export async function PATCH(req: Request) {
const body = await req.json();
if (!Number.isInteger(body.id)) return NextResponse.json({error:"ID fehlt."},{status:400});
await sql`UPDATE products SET name=${body.name}, description=${body.description}, price_cents=${body.priceCents}, security_level=${body.securityLevel}, active=${body.active} WHERE id=${body.id}`;
return NextResponse.json({ok:true});
}
export async function DELETE(req: Request) {
const { searchParams } = new URL(req.url);
const id = Number(searchParams.get("id"));
if (!Number.isInteger(id)) return NextResponse.json({error:"ID fehlt."},{status:400});
await sql`DELETE FROM products WHERE id=${id}`;
return NextResponse.json({ok:true});
}
