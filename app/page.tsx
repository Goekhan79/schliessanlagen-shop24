import Shop from "./shop";
import db from "@/lib/db";

export default function Home() {
  const products = db.prepare("SELECT * FROM products WHERE active=1 ORDER BY id").all() as any[];
  return <Shop initialProducts={products} />;
}