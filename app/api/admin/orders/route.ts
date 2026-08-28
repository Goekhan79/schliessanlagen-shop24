import { NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET() {
  return NextResponse.json(db.prepare("SELECT * FROM orders ORDER BY id DESC").all());
}

export async function PATCH(req: Request) {
  const body = await req.json();
  const allowed = ["new","confirmed","production","shipped","completed","cancelled"];
  if (!Number.isInteger(body.id) || !allowed.includes(body.status))
    return NextResponse.json({error:"Ungültige Daten."},{status:400});
  db.prepare("UPDATE orders SET status=? WHERE id=?").run(body.status, body.id);
  return NextResponse.json({ok:true});
}