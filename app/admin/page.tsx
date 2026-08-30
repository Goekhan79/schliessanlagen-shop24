import sql from "@/lib/db";
import Admin from "./ui";

export default async function Page(){
 const products = await sql `SELECT * FROM products ORDER BY id DESC` ;
 const orders = await sql `SELECT * FROM orders ORDER BY id DESC` ;
 return <Admin initialProducts={products as any[]} initialOrders={orders as any[]}/>;
}
