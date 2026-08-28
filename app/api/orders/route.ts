import { NextResponse } from "next/server";
import db from "@/lib/db";

function orderNumber() {
  const d = new Date();
  const stamp = d.toISOString().replace(/\D/g, "").slice(0, 14);
  return `SA-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { customer, configuration, totalCents, productId, quantity = 1 } = body;

  if (!customer?.name || !customer?.email || !customer?.address || !customer?.zip || !customer?.city) {
    return NextResponse.json({ error: "Bitte alle Pflichtfelder ausfüllen." }, { status: 400 });
  }
  if (!Number.isInteger(totalCents) || totalCents < 0 || !Number.isInteger(productId)) {
    return NextResponse.json({ error: "Ungültige Bestelldaten." }, { status: 400 });
  }

  const product = db.prepare("SELECT id, price_cents FROM products WHERE id=? AND active=1").get(productId) as {id:number, price_cents:number}|undefined;
  if (!product) return NextResponse.json({ error: "Produkt nicht gefunden." }, { status: 404 });

  const number = orderNumber();
  const insert = db.prepare(`INSERT INTO orders
    (order_number, customer_name, email, phone, company, address, zip, city, configuration_json, total_cents)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  const itemInsert = db.prepare(`INSERT INTO order_items
    (order_id, product_id, quantity, unit_price_cents) VALUES (?, ?, ?, ?)`);

  const tx = db.transaction(() => {
    const r = insert.run(number, customer.name, customer.email, customer.phone || "", customer.company || "",
      customer.address, customer.zip, customer.city, JSON.stringify(configuration), totalCents);
    itemInsert.run(r.lastInsertRowid, productId, quantity, product.price_cents);
    return Number(r.lastInsertRowid);
  });
  const id = tx();
  return NextResponse.json({ id, orderNumber: number }, { status: 201 });
}