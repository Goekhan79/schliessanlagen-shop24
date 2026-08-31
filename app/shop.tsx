"use client";

import { useMemo, useState } from "react";

type Product = {id:number; name:string; sku:string; description:string; price_cents:number; security_level:number};
type Config = {project:string; customerType:string; doors:number; users:number; keys:number; security:number};

const eur=(c:number)=>c.toLocaleString("de-DE",{style:"currency",currency:"EUR"});

export default function Shop({initialProducts}:{initialProducts:Product[]}) {
 const [products] = useState(initialProducts);
 const [step,setStep]=useState(1);
 const [config,setConfig]=useState<Config>({project:"new",customerType:"business",doors:12,users:8,keys:20,security:2});
 const [selected,setSelected]=useState<Product>(products[0]);
 const [customer,setCustomer]=useState({name:"",email:"",phone:"",company:"",address:"",zip:"",city:""});
 const [message,setMessage]=useState("");
 const price=useMemo(()=>selected ? selected.price_cents*config.doors/100 + config.keys*12 + config.users*18 + 180 : 0,[selected,config]);
const roles=["Geschäftsführung","Büro","Lager","Technik"];
const doors=["Haupteingang","Büro 1","Lager","Technikraum"];
const [matrix,setMatrix]=useState<boolean[][]>(doors.map((_,i)=>roles.map((_,j)=>i===0||j===i)));
function toggleMatrix(i:number,j:number){setMatrix(m=>m.map((row,ri)=>ri===i?row.map((v,rj)=>rj===j?!v:v):row))}
 function update(k:keyof Config,v:number|string){setConfig(x=>({...x,[k]:v}))}
 async function order(){
   setMessage("Bestellung wird gespeichert …");
   const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
    customer, configuration:{...config,matrix,doors,roles}, totalCents:Math.round(price), productId:selected.id, quantity:1
   })});
   const data=await res.json();
   setMessage(res.ok?`Bestellung erfolgreich angelegt: ${data.orderNumber}`:(data.error||"Fehler"));
 }
 return <main>
  <header><div className="nav wrap"><a className="logo" href="#">🔒 SCHLIESSANLAGEN<span>SHOP24</span></a><nav><a href="#systeme">Systeme</a><a href="#konfigurator">Konfigurator</a><a href="/admin">Admin</a></nav></div></header>
  <section className="hero"><div className="wrap heroGrid"><div><small>SCHLIESSANLAGEN ONLINE PLANEN</small><h1>Sicher.<br/><span>Passgenau.</span><br/>Einfach bestellt.</h1><p>Konfigurieren Sie Ihre Schließanlage, erstellen Sie einen Schließplan und senden Sie Ihre Bestellung direkt an den Shop.</p><a className="btn gold" href="#konfigurator">Konfigurator starten →</a></div><div className="visual"><div className="cyl"></div><div className="key"></div></div></div></section>
  <section id="systeme" className="section wrap"><div className="center"><small>PRODUKTAUSWAHL</small><h2>Schließsysteme</h2><p>Die Produktdaten kommen im echten Betrieb aus der Datenbank.</p></div><div className="cards">{products.map(p=><article className={"card "+(selected.id===p.id?"selected":"")} key={p.id}><div className="prod"></div><h3>{p.name}</h3><p>{p.description}</p><strong>ab {eur(p.price_cents)}</strong><button className="btn light" onClick={()=>{setSelected(p);document.querySelector("#konfigurator")?.scrollIntoView({behavior:"smooth"})}}>Auswählen</button></article>)}</div></section>
  <section id="konfigurator" className="section config"><div className="wrap"><div className="center"><small>KONFIGURATOR</small><h2>Ihre Schließanlage</h2></div>
   <div className="steps">{["Projekt","Mengen","Schließplan","Bestellung"].map((x,i)=><div className={step===i+1?"on":""} key={x}>{i+1}. {x}</div>)}</div>
   {step===1&&<Panel title="Was möchten Sie planen?"><Choices value={config.project} onChange={v=>update("project",v)} items={[["new","Neues Projekt","Neue Schließanlage"],["existing","Bestehende Anlage","Erweiterung / Nachbestellung"]]}/><h3>Art des Projekts</h3><Choices value={config.customerType} onChange={v=>update("customerType",v)} items={[["business","Gewerbe","Büro, Objekt oder Hausverwaltung"],["private","Privat","Einfamilienhaus / Wohnung"]]}/></Panel>}
   {step===2&&<Panel title="Mengen und Sicherheitsstufe"><div className="fields">{[["doors","Türen"],["users","Nutzer"],["keys","Schlüssel"]].map(([k,l])=><label key={k}>{l}<div className="counter"><button onClick={()=>update(k as keyof Config,Math.max(1,(config as any)[k]-1))}>−</button><b>{(config as any)[k]}</b><button onClick={()=>update(k as keyof Config,(config as any)[k]+1)}>+</button></div></label>)}</div><h3>Sicherheitsstufe</h3><Choices value={String(config.security)} onChange={v=>update("security",Number(v))} items={[["1","Standard","Basis"],["2","Hoch","Empfohlen"],["3","Maximal","Premium"]]}/></Panel>}
   {step===3&&<Panel title="Schließplan"><p>LegenSie fest, welche Nutzergruppe Zugang zu welcher Tür erhält.</p><div className="table"><table><thead><tr><th>Tür</th>{roles.map(r⇒<th key={r}>{r}</th<)}</tr></tr>thead><tbody>{doors.map((t,i)⇒<tr key={t}><td>{t}</td>td>{roles.map((r,j)⇒<td key={j}><input type="checkbox" checked={matrix[i][j]} onChange=)⇒toggleMatrix(i,j)}/><td>)}</tr>)}<tbody></table></div></Panel>}</step===3&&<Panel title="Schließplan"><p>LegenSie fest, welche Nutzergruppe Zugang zu welcher Tür erhält.</p><div className="table"><table><thead><tr><th>Tür</th>{roles.map(r⇒<th key={r}>{r}</th<)}</tr></tr>thead><tbody>{doors.map((t,i)⇒<tr key={t}><td>{t}</td>td>{roles.map((r,j)⇒<td key={j}><input type="checkbox" checked={matrix[i][j]} onChange=)⇒toggleMatrix(i,j)}/><td>)}</tr>)}<tbody></table></div></Panel>}
   {step===4&&<Panel title="Bestellung abschließen"><div className="orderGrid"><div><h3>{selected.name}</h3><p>{config.doors} Türen · {config.users} Nutzer · {config.keys} Schlüssel</p><div className="price">{eur(price)}</div><h3>Kundendaten</h3><div className="form">{Object.entries({name:"Name *",email:"E-Mail *",phone:"Telefon",company:"Firma",address:"Straße & Hausnummer *",zip:"PLZ *",city:"Ort *"}).map(([k,l])=><label key={k}>{l}<input value={(customer as any)[k]} onChange={e=>setCustomer(x=>({...x,[k]:e.target.value}))}/></label>)}</div></div><aside><h3>Zusammenfassung</h3><p>System<br/><b>{selected.name}</b></p><p>Geschätzter Preis<br/><b>{eur(price)}</b></p><button className="btn gold full" onClick={order}>Kostenpflichtig bestellen</button>{message&&<div className="message">{message}</div>}<small>Demo: Für einen Livegang müssen Zahlungsanbieter, E-Mail-Versand und rechtliche Checkout-Texte ergänzt werden.</small></aside></div></Panel>}
   <div className="actions">{step>1?<button className="btn light" onClick={()=>setStep(step-1)}>← Zurück</button>:<span/>}{step<4?<button className="btn gold" onClick={()=>setStep(step+1)}>Weiter →</button>:null}</div>
  </div></section>
  <footer><div className="wrap"><b>🔒 SCHLIESSANLAGENSHOP24</b><p>Technischer Full-Stack-Prototyp mit SQLite-Datenbank, API, Konfigurator, Bestellung und Admin-APIs.</p></div></footer>
 </main>
}

function Panel({title,children}:{title:string;children:React.ReactNode}){return <div className="panel"><h2>{title}</h2>{children}</div>}
function Choices({value,onChange,items}:{value:string;onChange:(v:string)=>void;items:string[][]}){return <div className="choices">{items.map(([v,t,s])=><button className={value===v?"choice active":"choice"} onClick={()=>onChange(v)} key={v}><b>{t}</b><span>{s}</span></button>)}</div>}
