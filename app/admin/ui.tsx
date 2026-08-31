"use client";
import { useState } from "react";

const eur = (c: number) => c.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

function downloadOrderExcel(o: any) {
const rows: [string, string][] = [
["Bestellnummer", o.order_number],
["Kunde", o.customer_name],
["E-Mail", o.email],
["Telefon", o.phone],
["Firma", o.company],
["Adresse", o.address],
["PLZ", o.zip],
["Ort", o.city],
["Produkt", o.product_name],
["Menge", String(o.quantity)],
["Summe", (o.total_cents / 100).toFixed(2).replace(".", ",") + " EUR"],
["Status", o.status],
];

const escape = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const csv = "\uFEFF" + rows.map(r => r.map(escape).join(";")).join("\r\n");
const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = `Bestellung_${o.order_number}.csv`;
a.click();
URL.revokeObjectURL(url);
}

export default function Admin({ initialProducts, initialOrders }: { initialProducts: any[]; initialOrders: any[] }) {
const [products, setProducts] = useState(initialProducts);
const [orders, setOrders] = useState(initialOrders);
const [form, setForm] = useState({ name: "", sku: "", description: "", priceCents: 10400, securityLevel: 2 });

async function add() {
const r = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
if (r.ok) location.reload(); else alert((await r.json()).error);
}
async function status(id: number, status: string) {
await fetch("/api/admin/orders", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
setOrders(o => o.map(x => x.id === id ? { ...x, status } : x));
}
async function removeProduct(id: number) {
if (!confirm("Produkt wirklich löschen?")) return;
const r = await fetch("/api/admin/products?id=" + id, { method: "DELETE" });
if (r.ok) setProducts(p => p.filter(x => x.id !== id)); else alert((await r.json()).error);
}
async function removeOrder(id: number) {
if (!confirm("Bestellung wirklich löschen?")) return;
const r = await fetch("/api/admin/orders?id=" + id, { method: "DELETE" });
if (r.ok) setOrders(o => o.filter(x => x.id !== id)); else alert((await r.json()).error);
}

return (
<main>
<header><div className="nav wrap"><a className="logo" href="/">🔒 SCHLIESSANLAGEN<span>SHOP24</span></a><b>ADMIN</b></div></header>
<div className="wrap admin">
<h1>Produktverwaltung & Bestellungen</h1>

<section className="adminbox">
<h2>Produkt anlegen</h2>
<div className="form">
{["name", "sku", "description"].map(k => (
<label key={k}>{k}<input value={(form as any)[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} /></label>
))}
<label>Preis in Cent<input type="number" value={form.priceCents} onChange={e => setForm({ ...form, priceCents: +e.target.value })} /></label>
<button className="btn gold" onClick={add}>Produkt speichern</button>
</div>
</section>

<section className="adminbox">
<h2>Produkte</h2>
<div className="table">
<table>
<thead><tr><th>ID</th><th>Name</th><th>SKU</th><th>Preis</th><th>Status</th><th>Löschen</th></tr></thead>
<tbody>
{products.map(p => (
<tr key={p.id}>
<td>{p.id}</td><td>{p.name}</td><td>{p.sku}</td><td>{eur(p.price_cents)}</td>
<td>{p.active ? "Aktiv" : "Inaktiv"}</td>
<td><button className="btn light" onClick={() => removeProduct(p.id)}>Löschen</button></td>
</tr>
))}
</tbody>
</table>
</div>
</section>

<section className="adminbox">
<h2>Bestellungen</h2>
<div className="table">
<table>
<thead><tr><th>Nr.</th><th>Kunde</th><th>Summe</th><th>Status</th><th>Ändern</th><th>Löschen</th></tr></thead>
<tbody>
{orders.map(o => (
<tr key={o.id}>
<td>{o.order_number}</td>
<td><a href="#" onClick={e => { e.preventDefault(); downloadOrderExcel(o); }}>{o.customer_name}</a></td>
<td>{eur(o.total_cents)}</td>
<td>{o.status}</td>
<td>
<select value={o.status} onChange={e => status(o.id, e.target.value)}>
{["new", "confirmed", "production", "shipped", "completed", "cancelled"].map(s => <option key={s}>{s}</option>)}
</select>
</td>
<td><button className="btn light" onClick={() => removeOrder(o.id)}>Löschen</button></td>
</tr>
))}
</tbody>
</table>
</div>
</section>
</div>
</main>
);
}
