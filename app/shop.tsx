"use client";
import { useMemo, useState } from "react";

type Product = {id:number; name:string; sku:string; description:string; price_cents:number; security_level:number};
type Config = {project:string; customerType:string; buildingType:string; doors:number; users:number; keys:number; security:number};
type Door = {name:string; type:string; size:string; count:number; bohrschutz:string; kernziehschutz:boolean; ng:boolean};
type CartItem = {product:Product; quantity:number};

const eur=(c:number)=>c.toLocaleString("de-DE",{style:"currency",currency:"EUR"});

const cylinderTypes=[
  {code:"DZ",name:"Doppelzylinder",desc:"Von beiden Seiten mit Schlüssel bedienbar. Die übliche Wahl für Wohnungs- und Haustüren.",sizes:["27/27 mm","30/30 mm","30/35 mm","35/35 mm","30/40 mm","40/40 mm","30/50 mm"]},
  {code:"HZ",name:"Halbzylinder",desc:"Nur von außen mit Schlüssel bedienbar, innen kein Schlüsselloch. Typisch für Keller- oder Nebentüren.",sizes:["27/10 mm","30/10 mm","35/10 mm","40/10 mm"]},
  {code:"KZ",name:"Knaufzylinder",desc:"Innenseite hat einen Drehknauf statt Schlüsselloch – praktisch, um schnell ohne Schlüssel von innen zu öffnen.",sizes:["27/27 mm","30/30 mm","30/35 mm","35/35 mm"]},
  {code:"RZ",name:"Rundzylinder",desc:"Runde statt ovale Bauform, wird bei bestimmten Türsystemen benötigt.",sizes:["29/29 mm","30/30 mm","35/35 mm"]},
  {code:"AZ",name:"Außenzylinder",desc:"Für den Einsatz mit einem zusätzlichen Kastenschloss an der Tür.",sizes:["30/35 mm"]},
  {code:"BZ",name:"Blindzylinder",desc:"Wird bei Feuerschutztüren verwendet, wo keine Durchsteckfunktion nötig ist. Maße auf Anfrage.",sizes:["auf Anfrage"]},
  {code:"HeZ",name:"Hebelzylinder",desc:"Für Briefkästen. Der Durchmesser muss zum vorhandenen Kastenloch passen.",sizes:["Standardmaß"]},
  {code:"VHS",name:"Vorhängeschloss",desc:"Die Zahl gibt die Bügelhöhe in Millimetern an.",sizes:["25 mm Bügelhöhe","30 mm Bügelhöhe","35 mm Bügelhöhe","45 mm Bügelhöhe","50 mm Bügelhöhe","55 mm Bügelhöhe"]},
];
const cylinderByCode=Object.fromEntries(cylinderTypes.map(c=>[c.code,c]));

const bohrschutzLevels=[
  {code:"none",label:"Kein Bohrschutz"},
  {code:"BS1",label:"BS1 – 2 gehärtete Stahlstifte"},
  {code:"BS2",label:"BS2 – 3 Hartmetallstifte + Schutzplatte"},
  {code:"BS3",label:"BS3 – Bohr- und Ziehschutz, Stufe A"},
  {code:"BS4",label:"BS4 – Bohr- und Ziehschutz, Stufe B (höchste Stufe)"},
];

function InfoIcon({text}:{text:string}){
  const [open,setOpen]=useState(false);
  return <span className="info-icon" onClick={()=>setOpen(o=>!o)}>
    ⓘ
    {open && <span className="info-tip">{text}<button onClick={(e)=>{e.stopPropagation();setOpen(false)}}>Schließen</button></span>}
  </span>;
}

export default function Shop({initialProducts}:{initialProducts:Product[]}) {
  const [products] = useState(initialProducts);
  const [step,setStep]=useState(1);
  const [config,setConfig]=useState<Config>({project:"new",customerType:"business",buildingType:"",doors:12,users:8,keys:20,security:2});
  const [cart,setCart]=useState<CartItem[]>([]);
  const [customer,setCustomer]=useState({name:"",email:"",phone:"",company:"",address:"",zip:"",city:""});
  const [message,setMessage]=useState("");
  const [gsSs,setGsSs]=useState("GS");
  const anlagenart=useMemo(()=>{
    if(config.customerType==="private") return gsSs==="SS" ? "Sperrschließung (SS)" : "Gleichschließung (GS)";
    if(config.doors<=5) return "Zentralschloss-Anlage (Z)";
    if(config.doors<=15) return "Hauptschlüssel-Anlage (HS)";
    return "Generalhauptschlüssel-Anlage (GHS)";
  },[config.customerType,config.doors,gsSs]);
  const itemsTotal=useMemo(()=>cart.reduce((s,i)=>s+i.product.price_cents*config.doors/100*i.quantity,0),[cart,config.doors]);
  const price=useMemo(()=>itemsTotal + config.keys*12 + config.users*18 + 180,[itemsTotal,config]);

  const [doorList,setDoorList]=useState<Door[]>([
    {name:"Haupteingang",type:"DZ",size:"30/35 mm",count:1,bohrschutz:"BS2",kernziehschutz:false,ng:false},
    {name:"Büro 1",type:"DZ",size:"30/35 mm",count:1,bohrschutz:"none",kernziehschutz:false,ng:false},
    {name:"Lager",type:"HZ",size:"35/10 mm",count:1,bohrschutz:"none",kernziehschutz:false,ng:false},
    {name:"Technikraum",type:"VHS",size:"30 mm Bügelhöhe",count:1,bohrschutz:"none",kernziehschutz:false,ng:false},
  ]);
  const [keyList,setKeyList]=useState(["Schlüssel 1","Schlüssel 2"]);
  const [matrix,setMatrix]=useState<boolean[][]>(doorList.map((_,i)=>keyList.map((_,j)=>true)));
  const [openDoor,setOpenDoor]=useState<number|null>(0);

  function updateKey(j:number,name:string){setKeyList(k=>k.map((x,i)=>i===j?name:x))}
  function addKey(){setKeyList(k=>[...k,`Schlüssel ${k.length+1}`]);setMatrix(m=>m.map(row=>[...row,false]))}
  function removeKey(j:number){setKeyList(k=>k.filter((_,i)=>i!==j));setMatrix(m=>m.map(row=>row.filter((_,i)=>i!==j)))}
  function toggleMatrix(i:number,j:number){setMatrix(m=>m.map((row,ri)=>ri===i?row.map((v,rj)=>rj===j?!v:v):row))}

  function updateDoor(i:number,field:keyof Door,value:string|number|boolean){setDoorList(d=>d.map((door,di)=>{
    if(di!==i) return door;
    const updated={...door,[field]:value} as Door;
    if(field==="type") updated.size=cylinderByCode[value as string].sizes[0];
    if(field==="type" && value!=="DZ") updated.ng=false;
    return updated;
  }))}
  function addDoor(){
    setDoorList(d=>[...d,{name:"Neue Tür",type:"DZ",size:cylinderByCode["DZ"].sizes[0],count:1,bohrschutz:"none",kernziehschutz:false,ng:false}]);
    setMatrix(m=>[...m,keyList.map(()=>false)]);
    setOpenDoor(doorList.length);
  }
  function removeDoor(i:number){setDoorList(d=>d.filter((_,di)=>di!==i));setMatrix(m=>m.filter((_,mi)=>mi!==i));if(openDoor===i)setOpenDoor(null)}
  function update(k:keyof Config,v:number|string){setConfig(x=>({...x,[k]:v}))}

  function addToCart(p:Product){
    setCart(c=>{
      const existing=c.find(i=>i.product.id===p.id);
      if(existing) return c.map(i=>i.product.id===p.id?{...i,quantity:i.quantity+1}:i);
      return [...c,{product:p,quantity:1}];
    });
  }
  function changeQty(id:number,qty:number){
    if(qty<=0){ setCart(c=>c.filter(i=>i.product.id!==id)); return; }
    setCart(c=>c.map(i=>i.product.id===id?{...i,quantity:qty}:i));
  }
  function removeFromCart(id:number){setCart(c=>c.filter(i=>i.product.id!==id))}

  async function order(){
    if(cart.length===0){ setMessage("Bitte mindestens ein Produkt in den Warenkorb legen."); return; }
    setMessage("Bestellung wird gespeichert ...");
    const doors=doorList.map(d=>d.name);
    const items=cart.map(i=>({productId:i.product.id, quantity:i.quantity}));
    const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      customer, configuration:{...config,matrix,doors,keyList,anlagenart,gsSs,doorList}, totalCents:Math.round(price), items
    })});
    const data=await res.json();
    setMessage(res.ok?("Bestellung erfolgreich angelegt: "+data.orderNumber):(data.error||"Fehler"));
  }

  return <main>
   <header><div className="nav wrap"><a className="logo" href="#">SCHLIESSANLAGEN<span>SHOP24</span></a><nav><a href="#systeme">Systeme</a><a href="#konfigurator">Konfigurator</a><a href="/admin">Admin</a></nav>
   {cart.length>0 && <div className="cart-badge">Warenkorb: {cart.reduce((s,i)=>s+i.quantity,0)} Artikel</div>}
   </div></header>
    <section className="hero"><div className="wrap heroGrid"><div><small>SCHLIESSANLAGEN ONLINE PLANEN</small><h1>Sicher.<br/><span>Passgenau.</span><br/>Einfach bestellt.</h1><p>Konfigurieren Sie Ihre Schließanlage, erstellen Sie einen Schließplan und senden Sie Ihre Bestellung direkt an den Shop.</p><a className="btn gold" href="#konfigurator">Konfigurator starten</a></div><div className="visual"><div className="cyl"></div><div className="key"></div></div></div></section>
    <section id="systeme" className="section wrap"><div className="center"><small>PRODUKTAUSWAHL</small><h2>Schließsysteme</h2><p>Wählen Sie ein oder mehrere Produkte und legen Sie diese in den Warenkorb.</p></div><div className="cards">{products.map(p=>{
      const inCart=cart.find(i=>i.product.id===p.id);
      return <article className={"card "+(inCart?"selected":"")} key={p.id}><div className="prod"></div><h3>{p.name}</h3><p>{p.description}</p><strong>ab {eur(p.price_cents)}</strong><button className="btn light" onClick={()=>addToCart(p)}>{inCart?`Im Warenkorb (${inCart.quantity})`:"In den Warenkorb"}</button></article>
    })}</div>
    {cart.length>0 && <div className="cart-summary">
      <h3>Warenkorb</h3>
      <table><tbody>{cart.map(i=><tr key={i.product.id}>
        <td>{i.product.name}</td>
        <td><input type="number" min={0} value={i.quantity} onChange={e=>changeQty(i.product.id,Number(e.target.value))} style={{width:60}}/></td>
        <td>{eur(i.product.price_cents*i.quantity)}</td>
        <td><button className="btn light small" onClick={()=>removeFromCart(i.product.id)}>Entfernen</button></td>
      </tr>)}</tbody></table>
      <button className="btn gold" onClick={()=>document.querySelector("#konfigurator")?.scrollIntoView({behavior:"smooth"})}>Weiter zum Konfigurator</button>
    </div>}
    </section>
    <section id="konfigurator" className="section config"><div className="wrap"><div className="center"><small>KONFIGURATOR</small><h2>Ihre Schließanlage</h2></div>
      <div className="steps">{["Projekt","Mengen","Schließplan","Bestellung"].map((x,i)=><div className={step===i+1?"on":""} key={x}>{i+1}. {x}</div>)}</div>
      {step===1&&<Panel title="Was möchten Sie planen?">
        <Choices value={config.project} onChange={v=>update("project",v)} items={[["new","Neues Projekt","Neue Schließanlage"],["existing","Bestehende Anlage","Erweiterung / Nachbestellung"]]}/>
        <h3>Art des Projekts</h3>
        <Choices value={config.customerType} onChange={v=>update("customerType",v)} items={[["business","Gewerbe","Büro, Objekt oder Hausverwaltung"],["private","Privat","Einfamilienhaus / Wohnung"]]}/>
        <h3>Gebäudeart</h3>
        <Choices value={config.buildingType} onChange={v=>update("buildingType",v)} items={[["efh","Einfamilienhaus","Ein Haushalt"],["mfh","Mehrfamilienhaus","Mehrere Wohneinheiten"],["office","Büro","Bürogebäude / Praxis"],["commercial","Gewerbe","Lager, Produktion, Handel"]]}/>
        {config.customerType==="private" ? <div><h3>Schließungsart</h3><Choices value={gsSs} onChange={v=>setGsSs(v)} items={[["GS","Gleichschließung","Ein Schlüssel öffnet alle Türen, ohne Sicherungskarte"],["SS","Sperrschließung","Mit Sicherungskarte, sichere Nachbestellung"]]}/></div> : null}
        <div className="anlagenart-info"><b>Ihre Anlagenart: </b>{anlagenart}</div>
      </Panel>}
      {step===2&&<Panel title="Mengen und Sicherheitsstufe"><div className="fields">{[["doors","Türen"],["users","Nutzer"],["keys","Schlüssel"]].map(([k,l])=><label key={k}>{l}<div className="counter"><button onClick={()=>update(k as keyof Config,Math.max(1,(config as any)[k]-1))}>-</button><b>{(config as any)[k]}</b><button onClick={()=>update(k as keyof Config,(config as any)[k]+1)}>+</button></div></label>)}</div><h3>Sicherheitsstufe</h3><Choices value={String(config.security)} onChange={v=>update("security",Number(v))} items={[["1","Standard","Basis"],["2","Hoch","Empfohlen"],["3","Maximal","Premium"]]}/></Panel>}
      {step===3&&<Panel title="Schließplan">
        <p>Legen Sie pro Tür Zylindertyp, Maß und Sicherheitsoptionen fest, und tragen Sie ein, welcher Schlüssel welche Tür öffnen soll.</p>

        <h3>Schlüssel <InfoIcon text="Jeder Schlüssel bekommt einen Namen. In der Tabelle weiter unten legen Sie fest, welche Tür dieser Schlüssel öffnen darf."/></h3>
        <div className="rolelist">{keyList.map((k,j)=>
          <div className="role-edit" key={j}>
            <input value={k} onChange={e=>updateKey(j,e.target.value)}/>
            <button className="btn light small" onClick={()=>removeKey(j)}>Entfernen</button>
          </div>
        )}</div>
        <button className="btn light small" onClick={addKey}>+ Schlüssel hinzufügen</button>

        <div className="doorlist">{doorList.map((door,i)=>{
          const isOpen=openDoor===i;
          const allowedCount=matrix[i]?.filter(Boolean).length||0;
          const cyl=cylinderByCode[door.type];
          return <div className={"doorcard "+(isOpen?"open":"")} key={i}>
            <div className="doorcard-summary" onClick={()=>setOpenDoor(isOpen?null:i)}>
              <span className="doorcard-arrow">{isOpen?"▾":"▸"}</span>
              <span className="doorcard-name">{door.name}</span>
              <span className="doorcard-meta">{cyl.name} · {door.size} · {allowedCount} Schlüssel</span>
            </div>
            {isOpen&&<div className="doorcard-body">
              <label>Bezeichnung<input value={door.name} onChange={e=>updateDoor(i,"name",e.target.value)}/></label>

              <label>Zylindertyp <InfoIcon text={cyl.desc}/>
                <select value={door.type} onChange={e=>updateDoor(i,"type",e.target.value)}>
                  {cylinderTypes.map(t=><option key={t.code} value={t.code}>{t.name} ({t.code})</option>)}
                </select>
              </label>
              <label>Standardmaß<select value={door.size} onChange={e=>updateDoor(i,"size",e.target.value)}>{cyl.sizes.map(s=><option key={s}>{s}</option>)}</select></label>
              <label>Anzahl<input type="number" min={1} value={door.count} onChange={e=>updateDoor(i,"count",Number(e.target.value))}/></label>

              <h4>Sicherheitsoptionen <InfoIcon text="Bohrschutz erschwert das gewaltsame Öffnen durch Aufbohren. Kernziehschutz verhindert das Herausziehen des Zylinderkerns. Die Not-/Gefahrenfunktion erlaubt das Aufschließen von außen, auch wenn innen ein Schlüssel steckt."/></h4>
              <label>Bohrschutz<select value={door.bohrschutz} onChange={e=>updateDoor(i,"bohrschutz",e.target.value)}>{bohrschutzLevels.map(b=><option key={b.code} value={b.code}>{b.label}</option>)}</select></label>
              <label className="checkbox-inline"><input type="checkbox" checked={door.kernziehschutz} onChange={e=>updateDoor(i,"kernziehschutz",e.target.checked)}/> Kernziehschutz</label>
              {door.type==="DZ" && <label className="checkbox-inline"><input type="checkbox" checked={door.ng} onChange={e=>updateDoor(i,"ng",e.target.checked)}/> Not-/Gefahrenfunktion</label>}

              <h4>Welche Schlüssel öffnen diese Tür?</h4>
              <div className="doorcard-matrix">{keyList.map((k,j)=><label key={k} className="matrix-check"><input type="checkbox" checked={matrix[i]?.[j]||false} onChange={()=>toggleMatrix(i,j)}/>{k}</label>)}</div>
              <button className="btn light small" onClick={()=>removeDoor(i)}>Tür entfernen</button>
            </div>}
          </div>
        })}</div>
        <button className="btn gold" onClick={addDoor}>+ Weitere Tür hinzufügen</button>
      </Panel>}
      {step===4&&<Panel title="Bestellung abschließen"><div className="orderGrid"><div>
        <h3>Warenkorb</h3>
        {cart.length===0 ? <p>Noch keine Produkte im Warenkorb.</p> : <table><tbody>{cart.map(i=><tr key={i.product.id}><td>{i.product.name}</td><td>{i.quantity}x</td><td>{eur(i.product.price_cents*i.quantity)}</td></tr>)}</tbody></table>}
        <p>{config.doors} Türen - {config.users} Nutzer - {config.keys} Schlüssel</p>
        <div className="price">{eur(price)}</div>
        <h3>Kundendaten</h3><div className="form">{Object.entries({name:"Name *",email:"E-Mail *",phone:"Telefon",company:"Firma",address:"Straße & Hausnummer *",zip:"PLZ *",city:"Ort *"}).map(([k,l])=><label key={k}>{l}<input value={(customer as any)[k]} onChange={e=>setCustomer(x=>({...x,[k]:e.target.value}))}/></label>)}</div></div>
        <aside><h3>Zusammenfassung</h3><p>Artikel<br/><b>{cart.reduce((s,i)=>s+i.quantity,0)} Stück</b></p><p>Geschätzter Preis<br/><b>{eur(price)}</b></p><button className="btn gold full" onClick={order}>Kostenpflichtig bestellen</button>{message ? <div className="message">{message}</div> : null}<small>Demo: Für einen Livegang müssen Zahlungsanbieter, E-Mail-Versand und rechtliche Checkout-Texte ergänzt werden.</small></aside>
      </div></Panel>}
      <div className="actions">{step>1 ? <button className="btn light" onClick={()=>setStep(step-1)}>Zurück</button> : <span/>}{step<4 ? <button className="btn gold" onClick={()=>setStep(step+1)}>Weiter</button> : null}</div>
    </div></section>
    <footer><div className="wrap"><b>SCHLIESSANLAGENSHOP24</b><p>Technischer Full-Stack-Prototyp mit Postgres-Datenbank, API, Konfigurator, Bestellung und Admin-APIs.</p></div></footer>
  </main>
}

function Panel({title,children}:{title:string;children:React.ReactNode}){return <div className="panel"><h2>{title}</h2>{children}</div>}
function Choices({value,onChange,items}:{value:string;onChange:(v:string)=>void;items:string[][]}){return <div className="choices">{items.map(([v,t,s])=><button className={value===v?"choice active":"choice"} onClick={()=>onChange(v)} key={v}><b>{t}</b><span>{s}</span></button>)}</div>}
