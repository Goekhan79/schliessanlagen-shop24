import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  return NextResponse.json(db.prepare("SELECT * FROM products ORDER BY id DESC").all());
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (!Number.isInteger(body.id)) return NextResponse.json({error:"ID fehlt."},{status:400});
  db.prepare("UPDATE products SET name=?, description=?, price_cents=?, security_level=?, active=? WHERE id=?")
    .run(body.name, body.description, body.priceCents, body.securityLevel, body.active ? 1 : 0, body.id);
  return NextResponse.json({ok:true});
}