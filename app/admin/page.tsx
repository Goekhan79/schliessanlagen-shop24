export const dynamic = "force-dynamic";

import sql from "@/lib/db";
import Admin from "./ui";

export default async function Page(){
const products = await sql`SELECT * FROM products ORDER BY id DESC`;
const orders = await sql`
SELECT o.*, p.name as product_name, oi.quantity
FROM orders o
LEFT JOIN order_items oi ON oi.order_id = o.id
LEFT JOIN products p ON p.id = oi.product_id
ORDER BY o.id DESC`;
return <Admin initialProducts={products as any[]} initialOrders={orders as any[]}/>;
}
