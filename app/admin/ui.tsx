"use client";
import { useState } from "react";

const eur = (c: number) => c.toLocaleString("de-DE", { style: "currency", currency: "EUR" });

function toCSV(orders: any[]) {
const headers = ["Nr.","Kunde","E-Mail","Telefon","Firma","Adresse","PLZ","Ort","Produkt","Menge","Summe","Status"];
const rows = orders.map(o => [
o.order_number, o.customer_name, o.email, o.phone, o.company,
o.address, o.zip, o.city, o.product_name, o.quantity,
(o.total_cents / 100).toFixed(2).replace(".", ","), o.status
]);
const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
return [headers, ...rows].map(r => r.map(escape).join(";")).join("\r\n");
}

export default function Admin({ initialProducts, initialOrders }: { initialProducts: any[]; initialOrders: any[] }) {
const [products, setProducts] = useState(initialProducts);
const [orders, setOrders] = useState(initialOrders);
const [form, setForm] = useState({ name: "", sku: "", description: "", priceCents: 10400, securityLevel: 2 });
const [selected, setSelected] = useState<any>(null);

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
function exportCSV() {
const csv = "\uFEFF" + toCSV(orders);
const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "bestellungen.csv";
a.click();
URL.revokeObjectURL(url);
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
<button className="btn gold" onClick={exportCSV} style={{ marginBottom: 12 }}>Als CSV exportieren</button>
<div className="table">
<table>
<thead><tr><th>Nr.</th><th>Kunde</th><th>Summe</th><th>Status</th><th>Ändern</th><th>Löschen</th></tr></thead>
<tbody>
{orders.map(o => (
<tr key={o.id}>
<td>{o.order_number}</td>
<td><a href="#" onClick={e => { e.preventDefault(); setSelected(o); }}>{o.customer_name}</a></td>
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

{selected && (
<div onClick={() => setSelected(null)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
<div onClick={e => e.stopPropagation()} style={{ background: "#fff", padding: 24, borderRadius: 8, maxWidth: 480, width: "90%" }}>
<h2>Bestellung {selected.order_number}</h2>
<table style={{ width: "100%" }}>
<tbody>
<tr><td><b>Kunde</b></td><td>{selected.customer_name}</td></tr>
<tr><td><b>E-Mail</b></td><td>{selected.email}</td></tr>
<tr><td><b>Telefon</b></td><td>{selected.phone}</td></tr>
<tr><td><b>Firma</b></td><td>{selected.company}</td></tr>
<tr><td><b>Adresse</b></td><td>{selected.address}</td></tr>
<tr><td><b>PLZ</b></td><td>{selected.zip}</td></tr>
<tr><td><b>Ort</b></td><td>{selected.city}</td></tr>
<tr><td><b>Produkt</b></td><td>{selected.product_name}</td></tr>
<tr><td><b>Menge</b></td><td>{selected.quantity}</td></tr>
<tr><td><b>Summe</b></td><td>{eur(selected.total_cents)}</td></tr>
<tr><td><b>Status</b></td><td>{selected.status}</td></tr>
</tbody>
</table>
<button className="btn light" style={{ marginTop: 16 }} onClick={() => setSelected(null)}>Schließen</button>
</div>
</div>
)}
</main>
);
}
