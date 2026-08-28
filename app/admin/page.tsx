import db from "@/lib/db";
import Admin from "./ui";

export default function Page(){
 const products=db.prepare("SELECT * FROM products ORDER BY id DESC").all() as any[];
 const orders=db.prepare("SELECT * FROM orders ORDER BY id DESC").all() as any[];
 return <Admin initialProducts={products} initialOrders={orders}/>;
}