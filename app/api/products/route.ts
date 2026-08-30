import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
const products = await sql`SELECT * FROM products WHERE active=true ORDER BY id DESC`;
return NextResponse.json(products);
}

export async function POST(req: Request) {
const body = await req.json();
if (!body.name || !body.sku || !Number.isInteger(body.priceCents)) {
return NextResponse.json({ error: "Bitte alle Pflichtfelder ausfüllen." }, { status: 400 });
}
const result = await sql`INSERT INTO products (name, sku, description, price_cents, security_level)
VALUES (${body.name}, ${body.sku}, ${body.description || ""}, ${body.priceCents}, ${body.securityLevel || 1})
RETURNING id`;
return NextResponse.json({ ok: true, id: result[0].id }, { status: 201 });
}
