import { NextResponse } from "next/server";
import sql from "@/lib/db";

function orderNumber() {
  const d = new Date();
  const stamp = d.toISOString().replace(/\D/g, "").slice(0, 14);
  return `SA-${stamp}-${Math.floor(Math.random() * 900 + 100)}`;
}

export async function POST(req: Request) {
  const body = await req.json();
  const { customer, configuration, totalCents, items } = body;

  if (!customer?.name || !customer?.email || !customer?.address || !customer?.zip || !customer?.city) {
    return NextResponse.json({ error: "Bitte alle Pflichtfelder ausfüllen." }, { status: 400 });
  }
  if (!Number.isInteger(totalCents) || totalCents < 0 || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Ungültige Bestelldaten." }, { status: 400 });
  }

  const productIds = items.map((i: any) => i.productId);
  const foundProducts = await sql`SELECT id, price_cents FROM products WHERE id = ANY(${productIds}) AND active=true`;
  if (foundProducts.length !== items.length) {
    return NextResponse.json({ error: "Ein oder mehrere Produkte wurden nicht gefunden." }, { status: 404 });
  }

  const number = orderNumber();

  const result = await sql.begin(async (tx) => {
    const inserted = await tx`INSERT INTO orders
      (order_number, customer_name, email, phone, company, address, zip, city, configuration_json, total_cents)
      VALUES (${number}, ${customer.name}, ${customer.email}, ${customer.phone || ""}, ${customer.company || ""},
      ${customer.address}, ${customer.zip}, ${customer.city}, ${JSON.stringify(configuration)}, ${totalCents})
      RETURNING id`;
    const orderId = inserted[0].id;

    for (const item of items) {
      const product = foundProducts.find((p: any) => p.id === item.productId);
      await tx`INSERT INTO order_items (order_id, product_id, quantity, unit_price_cents)
        VALUES (${orderId}, ${item.productId}, ${item.quantity}, ${product.price_cents})`;
    }

    return orderId;
  });

  return NextResponse.json({ id: result, orderNumber: number }, { status: 201 });
}
