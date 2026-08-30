import { NextResponse } from "next/server";
import sql from "@/lib/db";

export async function GET() {
const orders = await sql`SELECT * FROM orders ORDER BY id DESC`;
return NextResponse.json(orders);
}

export async function PATCH(req: Request) {
const body = await req.json();
const allowed = ["new","confirmed","production","shipped","completed","cancelled"];
if (!Number.isInteger(body.id) || !allowed.includes(body.status))
return NextResponse.json({error:"Ungültige Daten."},{status:400});
await sql`UPDATE orders SET status=${body.status} WHERE id=${body.id}`;
return NextResponse.json({ok:true});
}
