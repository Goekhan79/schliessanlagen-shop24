import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  const products = db.prepare("SELECT * FROM products WHERE active=1 ORDER BY id").all();
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { name, sku, description, priceCents, securityLevel = 2 } = body;
  if (!name || !sku || !description || !Number.isInteger(priceCents)) {
    return NextResponse.json({ error: "Ungültige Produktdaten." }, { status: 400 });
  }
  try {
    const result = db.prepare(
      "INSERT INTO products (name, sku, description, price_cents, security_level) VALUES (?, ?, ?, ?, ?)"
    ).run(name, sku, description, priceCents, securityLevel);
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: "SKU existiert bereits oder Daten sind ungültig." }, { status: 409 });
  }
}