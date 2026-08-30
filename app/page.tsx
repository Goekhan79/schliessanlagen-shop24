import Shop from "./shop";
import sql from "@/lib/db";

export default async function Home() {
  const products = await sql`SELECT * FROM products WHERE active=true ORDER BY id`;
  return <Shop initialProducts={products as any[]} />;
}
