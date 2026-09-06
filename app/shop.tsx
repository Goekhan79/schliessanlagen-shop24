"use client";
import { useMemo, useState } from "react";

type Product = {id:number; name:string; sku:string; description:string; price_cents:number; security_level:number};
type Config = {project:string; customerType:string; doors:number; users:number; keys:number; security:number};
type Door = {name:string; type:string; count:number; outerMM:number; innerMM:number};

const eur=(c:number)=>c.toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const cylinderTypes=["Profilzylinder","Knaufzylinder","Halbzylinder","Vorhangschlossyzlinder","Möbelzylinder"];

export default function Shop({initialProducts}:{initialProducts:Product[]}) {
  const [products] = useState(initialProducts);
  const [step,setStep]=useState(1);
  const [config,setConfig]=useState<Config>({project:"new",customerType:"business",doors:12,users:8,keys:20,security:2});
  const [selected,setSelected]=useState<Product>(products[0]);
  const [customer,setCustomer]=useState({name:"",email:"",phone:"",company:"",address:"",zip:"",city:""});
  const [message,setMessage]=useState("");
  const [gsSs,setGsSs]=useState("GS");
  const anlagenart=useMemo(()=>{
    if(config.customerType==="private") return gsSs==="SS" ? "Sperrschließung (SS)" : "Gleichschließung (GS)";
    if(config.doors<=5) return "Zentralschloss-Anlage (Z)";
    if(config.doors<=15) return "Hauptschlüssel-Anlage (HS)";
    return "Generalhauptschlüssel-Anlage (GHS)";
  },[config.customerType,config.doors,gsSs]);
  const price=useMemo(()=>selected ? selected.price_cents*config.doors/100 + config.keys*12 + config.users*18 + 180 : 0,[selected,config]);
  const roles=["Geschäftsführung","Büro","Lager","Technik"];
  const [doorList,setDoorList]=useState<Door[]>([
    {name:"Haupteingang",type:"Profilzylinder",count:1,outerMM:30,innerMM:35},
    {name:"Büro 1",type:"Profilzylinder",count:1,outerMM:30,innerMM:35},
    {name:"Lager",type:"Halbzylinder",count:1,outerMM:35,innerMM:0},
    {name:"Technikraum",type:"Vorhangschlossyzlinder",count:1,outerMM:25,innerMM:25},
  ]);
  const [matrix,setMatrix]=useState<boolean[][]>(doorList.map((_,i)=>roles.map((_,j)=>i===0||j===i)));
  const [openDoor,setOpenDoor]=useState<number|null>(0);
  function toggleMatrix(i:number,j:number){setMatrix(m=>m.map((row,ri)=>ri===i?row.map((v,rj)=>rj===j?!v:v):row))}
  function updateDoor(i:number,field:keyof Door,value:string|number){setDoorList(d=>d.map((door,di)=>di===i?{...door,[field]:value}:door))}
  function addDoor(){setDoorList(d=>[...d,{name:"Neue Tür",type:"Profilzylinder",count:1,outerMM:30,innerMM:35}]);setMatrix(m=>[...m,roles.map(()=>false)]);setOpenDoor(doorList.length)}
  function removeDoor(i:number){setDoorList(d=>d.filter((_,di)=>di!==i));setMatrix(m=>m.filter((_,mi)=>mi!==i));if(openDoor===i)setOpenDoor(null)}
  function update(k:keyof Config,v:number|string){setConfig(x=>({...x,[k]:v}))}
  async function order(){
    setMessage("Bestellung wird gespeichert ...");
    const doors=doorList.map(d=>d.name);
    const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      customer, configuration:{...config,matrix,doors,roles,anlagenart,gsSs,doorList}, totalCents:Math.round(price), productId:selected.id, quantity:1
    })});
    const data=await res.json();
    setMessage(res.ok?("Bestellung erfolgreich angelegt: "+data.orderNumber):(data.error||"Fehler"));
  }
  return <main>
   <header><div className="nav wrap"><a className="logo" href="#">SCHLIESSANLAGEN<span>SHOP24</span></a><nav><a href="#systeme">Systeme</a><a href="#konfigurator">Konfigurator</a><a href="/admin">Admin</a></nav></div></header>
    <section className="hero"><div className="wrap heroGrid"><div><small>SCHLIESSANLAGEN ONLINE PLANEN</small><h1>Sicher.<br/><span>Passgenau.</span><br/>Einfach bestellt.</h1><p>Konfigurieren Sie Ihre Schließanlage, erstellen Sie einen Schließplan und senden Sie Ihre Bestellung direkt an den Shop.</p><a className="btn gold" href="#konfigurator">Konfigurator starten</a></div><div className="visual"><div className="cyl"></div><div className="key"></div></div></div></section>
    <section id="systeme" className="section wrap"><div className="center"><small>PRODUKTAUSWAHL</small><h2>Schließsysteme</h2><p>Die Produktdaten kommen im echten Betrieb aus der Datenbank.</p></div><div className="cards">{products.map(p=><article className={"card "+(selected.id===p.id?"selected":"")} key={p.id}><div className="prod"></div><h3>{p.name}</h3><p>{p.description}</p><strong>ab {eur(p.price_cents)}</strong><button className="btn light" onClick={()=>{setSelected(p);document.querySelector("#konfigurator")?.scrollIntoView({behavior:"smooth"})}}>Auswählen</button></article>)}</div></section>
    <section id="konfigurator" className="section config"><div className="wrap"><div className="center"><small>KONFIGURATOR</small><h2>Ihre Schließanlage</h2></div>
      <div className="steps">{["Projekt","Mengen","Schließplan","Bestellung"].map((x,i)=><div className={step===i+1?"on":""} key={x}>{i+1}. {x}</div>)}</div>
      {step===1&&<Panel title="Was möchten Sie planen?"><Choices value={config.project} onChange={v=>update("project",v)} items={[["new","Neues Projekt","Neue Schließanlage"],["existing","Bestehende Anlage","Erweiterung / Nachbestellung"]]}/><h3>Art des Projekts</h3><Choices value={config.customerType} onChange={v=>update("customerType",v)} items={[["business","Gewerbe","Büro, Objekt oder Hausverwaltung"],["private","Privat","Einfamilienhaus / Wohnung"]]}/>{config.customerType==="private" ? <div><h3>Schließungsart</h3><Choices value={gsSs} onChange={v=>setGsSs(v)} items={[["GS","Gleichschließung","Ein Schlüssel öffnet alle Türen, ohne Sicherungskarte"],["SS","Sperrschließung","Mit Sicherungskarte, sichere Nachbestellung"]]}/></div> : null}<div className="anlagenart-info"><b>Ihre Anlagenart: </b>{anlagenart}</div></Panel>}
      {step===2&&<Panel title="Mengen und Sicherheitsstufe"><div className="fields">{[["doors","Türen"],["users","Nutzer"],["keys","Schlüssel"]].map(([k,l])=><label key={k}>{l}<div className="counter"><button onClick={()=>update(k as keyof Config,Math.max(1,(config as any)[k]-1))}>-</button><b>{(config as any)[k]}</b><button onClick={()=>update(k as keyof Config,(config as any)[k]+1)}>+</button></div></label>)}</div><h3>Sicherheitsstufe</h3><Choices value={String(config.security)} onChange={v=>update("security",Number(v))} items={[["1","Standard","Basis"],["2","Hoch","Empfohlen"],["3","Maximal","Premium"]]}/></Panel>}
      {step===3&&<Panel title="Schließplan"><p>Klicken Sie eine Tür an, um Zylindertyp, Maße und Berechtigungen festzulegen.</p>
        <div className="doorlist">{doorList.map((door,i)=>{
          const isOpen=openDoor===i;
          const allowedCount=matrix[i]?.filter(Boolean).length||0;
          return <div className={"doorcard "+(isOpen?"open":"")} key={i}>
            <div className="doorcard-summary" onClick={()=>setOpenDoor(isOpen?null:i)}>
              <span className="doorcard-arrow">{isOpen?"▾":"▸"}</span>
              <span className="doorcard-name">{door.name}</span>
              <span className="doorcard-meta">{door.type} · {door.count}x · {allowedCount} Nutzergruppen</span>
            </div>
            {isOpen&&<div className="doorcard-body">
              <label>Bezeichnung<input value={door.name} onChange={e=>updateDoor(i,"name",e.target.value)}/></label>
              <div className="doorcard-fields">
                <label>Zylindertyp<select value={door.type} onChange={e=>updateDoor(i,"type",e.target.value)}>{cylinderTypes.map(t=><option key={t}>{t}</option>)}</select></label>
                <label>Anzahl<input type="number" min={1} value={door.count} onChange={e=>updateDoor(i,"count",Number(e.target.value))}/></label>
                <label>Maß außen (mm)<input type="number" min={0} value={door.outerMM} onChange={e=>updateDoor(i,"outerMM",Number(e.target.value))}/></label>
                <label>Maß innen (mm)<input type="number" min={0} value={door.innerMM} onChange={e=>updateDoor(i,"innerMM",Number(e.target.value))}/></label>
              </div>
              <h4>Zugangsberechtigung</h4>
              <div className="doorcard-matrix">{roles.map((r,j)=><label key={r} className="matrix-check"><input type="checkbox" checked={matrix[i]?.[j]||false} onChange={()=>toggleMatrix(i,j)}/>{r}</label>)}</div>
              <button className="btn light small" onClick={()=>removeDoor(i)}>Tür entfernen</button>
            </div>}
          </div>
        })}</div>
        <button className="btn gold" onClick={addDoor}>+ Weitere Tür hinzufügen</button>
      </Panel>}
      {step===4&&<Panel title="Bestellung abschließen"><div className="orderGrid"><div><h3>{selected.name}</h3><p>{config.doors} Türen - {config.users} Nutzer - {config.keys} Schlüssel</p><div className="price">{eur(price)}</div><h3>Kundendaten</h3><div className="form">{Object.entries({name:"Name *",email:"E-Mail *",phone:"Telefon",company:"Firma",address:"Straße & Hausnummer *",zip:"PLZ *",city:"Ort *"}).map(([k,l])=><label key={k}>{l}<input value={(customer as any)[k]} onChange={e=>setCustomer(x=>({...x,[k]:e.target.value}))}/></label>)}</div></div><aside><h3>Zusammenfassung</h3><p>System<br/><b>{selected.name}</b></p><p>Geschätzter Preis<br/><b>{eur(price)}</b></p><button className="btn gold full" onClick={order}>Kostenpflichtig bestellen</button>{message ? <div className="message">{message}</div> : null}<small>Demo: Für einen Livegang müssen Zahlungsanbieter, E-Mail-Versand und rechtliche Checkout-Texte ergänzt werden.</small></aside></div></Panel>}
      <div className="actions">{step>1 ? <button className="btn light" onClick={()=>setStep(step-1)}>Zurück</button> : <span/>}{step<4 ? <button className="btn gold" onClick={()=>setStep(step+1)}>Weiter</button> : null}</div>
    </div></section>
    <footer><div className="wrap"><b>SCHLIESSANLAGENSHOP24</b><p>Technischer Full-Stack-Prototyp mit Postgres-Datenbank, API, Konfigurator, Bestellung und Admin-APIs.</p></div></footer>
  </main>
}

function Panel({title,children}:{title:string;children:React.ReactNode}){return <div className="panel"><h2>{title}</h2>{children}</div>}
function Choices({value,onChange,items}:{value:string;onChange:(v:string)=>void;items:string[][]}){return <div className="choices">{items.map(([v,t,s])=><button className={value===v?"choice active":"choice"} onClick={()=>onChange(v)} key={v}><b>{t}</b><span>{s}</span></button>)}</div>}
