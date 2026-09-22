"use client";
import { useMemo, useState } from "react";

type Product = {id:number; name:string; sku:string; description:string; price_cents:number; security_level:number};
type Config = {project:string; customerType:string; buildingType:string; doors:number; users:number; keys:number; security:number};
type Door = {
  name:string; type:string; outerMM:number; innerMM:number; count:number;
  bohrschutz:string; kernziehschutz:boolean; ng:boolean;
  freilauf:boolean; zahnrad:string; farbkappe:boolean; farbe:string;
};
type CartItem = {
  id:number; product:Product; quantity:number; config:Config; gsSs:string; anlagenart:string;
  doorList:Door[]; keyList:string[]; matrix:boolean[][];
};

const eur=(c:number)=>c.toLocaleString("de-DE",{style:"currency",currency:"EUR"});

const cylinderTypes=[
  {code:"DZ",name:"Doppelzylinder",desc:"Von beiden Seiten mit Schlüssel bedienbar. Die übliche Wahl für Wohnungs- und Haustüren."},
  {code:"HZ",name:"Halbzylinder",desc:"Nur von außen mit Schlüssel bedienbar, innen kein Schlüsselloch. Typisch für Keller- oder Nebentüren."},
  {code:"KZ",name:"Knaufzylinder",desc:"Innenseite hat einen Drehknauf statt Schlüsselloch – praktisch, um schnell ohne Schlüssel von innen zu öffnen."},
  {code:"RZ",name:"Rundzylinder",desc:"Runde statt ovale Bauform, wird bei bestimmten Türsystemen benötigt."},
  {code:"AZ",name:"Außenzylinder",desc:"Für den Einsatz mit einem zusätzlichen Kastenschloss an der Tür."},
  {code:"BZ",name:"Blindzylinder",desc:"Wird bei Feuerschutztüren verwendet, wo keine Durchsteckfunktion nötig ist. Maße auf Anfrage."},
  {code:"HeZ",name:"Hebelzylinder",desc:"Für Briefkästen. Der Durchmesser muss zum vorhandenen Kastenloch passen."},
  {code:"VHS",name:"Vorhängeschloss",desc:"Statt Außen-/Innenmaß geben Sie hier die Bügelhöhe in mm im Feld \"Außen\" ein."},
];
const cylinderByCode=Object.fromEntries(cylinderTypes.map(c=>[c.code,c]));

const bohrschutzLevels=[
  {code:"none",label:"Kein Bohrschutz"},
  {code:"BS1",label:"BS1 – 2 gehärtete Stahlstifte"},
  {code:"BS2",label:"BS2 – 3 Hartmetallstifte + Schutzplatte"},
  {code:"BS3",label:"BS3 – Bohr- und Ziehschutz, Stufe A"},
  {code:"BS4",label:"BS4 – Bohr- und Ziehschutz, Stufe B (höchste Stufe)"},
];
const zahnradLevels=[
  {code:"none",label:"Ohne Zahnrad-Schließbart"},
  {code:"ZR10",label:"ZR10 – 10 Zähne (Multi-Lock)"},
  {code:"ZR14",label:"ZR14 – 14 Zähne"},
  {code:"ZR18",label:"ZR18 – 18 Zähne (Multi-Lock)"},
];
const zylinderfarben=["Silber (Standard)","Messing","Schwarz","Vernickelt","Edelstahloptik"];

const defaultDoors=():Door[]=>[
  {name:"Haupteingang",type:"DZ",outerMM:40,innerMM:45,count:1,bohrschutz:"BS2",kernziehschutz:false,ng:false,freilauf:false,zahnrad:"none",farbkappe:false,farbe:zylinderfarben[0]},
];
const defaultKeys=()=>["Schlüssel 1"];

function InfoIcon({text}:{text:React.ReactNode}){
  const [open,setOpen]=useState(false);
  return <span className="info-icon" onClick={()=>setOpen(o=>!o)}>
    ⓘ
    {open && <span className="info-tip">{text}<button onClick={(e)=>{e.stopPropagation();setOpen(false)}}>Schließen</button></span>}
  </span>;
}

function MeasureDiagram(){
  return <svg width="220" height="110" viewBox="0 0 220 110" style={{marginBottom:8}}>
    <rect x="0" y="0" width="220" height="110" fill="#f5f5f5"/>
    <rect x="98" y="10" width="24" height="80" fill="#b0b6bd" stroke="#6b7280"/>
    <line x1="20" y1="50" x2="98" y2="50" stroke="#c0392b" strokeWidth="2"/>
    <line x1="20" y1="45" x2="20" y2="55" stroke="#c0392b" strokeWidth="2"/>
    <line x1="98" y1="45" x2="98" y2="55" stroke="#c0392b" strokeWidth="2"/>
    <text x="35" y="42" fontSize="11" fill="#c0392b">A (außen)</text>
    <line x1="122" y1="50" x2="200" y2="50" stroke="#2980b9" strokeWidth="2"/>
    <line x1="122" y1="45" x2="122" y2="55" stroke="#2980b9" strokeWidth="2"/>
    <line x1="200" y1="45" x2="200" y2="55" stroke="#2980b9" strokeWidth="2"/>
    <text x="140" y="42" fontSize="11" fill="#2980b9">B (innen)</text>
    <text x="20" y="98" fontSize="11" fill="#555">Außenseite (Angriffsseite)</text>
    <text x="115" y="98" fontSize="11" fill="#555">Innenseite</text>
  </svg>;
}

function CylinderDiagram({code}:{code:string}){
  if(code==="RZ") return <svg width="140" height="80" style={{marginBottom:8}}><circle cx="70" cy="40" r="28" fill="#b0b6bd" stroke="#6b7280"/><circle cx="70" cy="40" r="6" fill="#4b5563"/></svg>;
  if(code==="HeZ") return <svg width="140" height="80" style={{marginBottom:8}}><rect x="30" y="26" width="40" height="24" rx="4" fill="#b0b6bd" stroke="#6b7280"/><rect x="70" y="32" width="16" height="12" fill="#9ca3af"/></svg>;
  if(code==="VHS") return <svg width="140" height="90" style={{marginBottom:8}}><path d="M45 40 v-15 a15 15 0 0 1 30 0 v15" fill="none" stroke="#6b7280" strokeWidth="6"/><rect x="35" y="40" width="50" height="40" rx="6" fill="#b0b6bd" stroke="#6b7280"/></svg>;
  const rightEnd = code==="KZ" ? <circle cx="152" cy="40" r="10" fill="#d1d5db" stroke="#6b7280"/>
    : code==="HZ" ? <rect x="144" y="34" width="10" height="12" fill="#9ca3af"/>
    : code==="AZ" ? <rect x="146" y="28" width="20" height="6" fill="#9ca3af"/>
    : code==="BZ" ? null
    : <circle cx="150" cy="40" r="6" fill="#4b5563"/>;
  return <svg width="170" height="80" style={{marginBottom:8}}>
    <rect x="10" y="28" width="140" height="24" rx="4" fill="#b0b6bd" stroke="#6b7280"/>
    {code!=="BZ" && <circle cx="10" cy="40" r="6" fill="#4b5563"/>}
    {rightEnd}
  </svg>;
}
function InfoIcon({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return <span className="info-icon" onClick={() => setOpen(o => !o)}>
    ⓘ
    {open && <span className="info-tip">{text}<button onClick={(e) => { e.stopPropagation(); setOpen(false) }}>Schließen</button></span>}
  </span>;
}

export default function Shop({initialProducts}:{initialProducts:Product[]}) {
  const [products] = useState(initialProducts);
  const [step,setStep]=useState(1);
  const [config,setConfig]=useState<Config>({project:"new",customerType:"business",buildingType:"",doors:12,users:8,keys:20,security:2});
  const [selected,setSelected]=useState<Product>(products[0]);
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

  const [doorList,setDoorList]=useState<Door[]>(defaultDoors());
  const [keyList,setKeyList]=useState(defaultKeys());
  const [matrix,setMatrix]=useState<boolean[][]>(doorList.map((_,i)=>keyList.map((_,j)=>true)));
  const [openDoor,setOpenDoor]=useState<number|null>(0);

  const cartTotal=useMemo(()=>cart.reduce((sum,item)=>{
    const itemsTotal=item.product.price_cents*item.config.doors/100;
    return sum + (itemsTotal + item.config.keys*12 + item.config.users*18 + 180) * item.quantity;
  },0),[cart]);
  const workingPrice=useMemo(()=>selected ? (selected.price_cents*config.doors/100 + config.keys*12 + config.users*18 + 180) : 0,[selected,config]);

  function updateKey(j:number,name:string){setKeyList(k=>k.map((x,i)=>i===j?name:x))}
  function addKey(){setKeyList(k=>[...k,`Schlüssel ${k.length+1}`]);setMatrix(m=>m.map(row=>[...row,false]))}
  function removeKey(j:number){setKeyList(k=>k.filter((_,i)=>i!==j));setMatrix(m=>m.map(row=>row.filter((_,i)=>i!==j)))}
  function toggleMatrix(i:number,j:number){setMatrix(m=>m.map((row,ri)=>ri===i?row.map((v,rj)=>rj===j?!v:v):row))}

  function updateDoor(i:number,field:keyof Door,value:string|number|boolean){setDoorList(d=>d.map((door,di)=>{
    if(di!==i) return door;
    const updated={...door,[field]:value} as Door;
    if(field==="type" && value!=="DZ"){ updated.ng=false; updated.freilauf=false; }
    return updated;
  }))}
  function addDoor(){
    setDoorList(d=>[...d,{name:"Neue Tür",type:"DZ",outerMM:30,innerMM:35,count:1,bohrschutz:"none",kernziehschutz:false,ng:false,freilauf:false,zahnrad:"none",farbkappe:false,farbe:zylinderfarben[0]}]);
    setMatrix(m=>[...m,keyList.map(()=>false)]);
    setOpenDoor(doorList.length);
  }
  function removeDoor(i:number){setDoorList(d=>d.filter((_,di)=>di!==i));setMatrix(m=>m.filter((_,mi)=>mi!==i));if(openDoor===i)setOpenDoor(null)}
  function update(k:keyof Config,v:number|string){setConfig(x=>({...x,[k]:v}))}

  function addConfigToCart(){
    if(!selected){ setMessage("Bitte zuerst ein Produkt auswählen."); return; }
    const item:CartItem={
      id:Date.now(), product:selected, quantity:1, config:{...config}, gsSs, anlagenart,
      doorList:doorList.map(d=>({...d})), keyList:[...keyList], matrix:matrix.map(r=>[...r]),
    };
    setCart(c=>[...c,item]);
    setDoorList(defaultDoors());
    setKeyList(defaultKeys());
    setMatrix(defaultDoors().map(()=>defaultKeys().map(()=>true)));
    setOpenDoor(0);
    setMessage("Konfiguration wurde dem Warenkorb hinzugefügt. Sie können jetzt eine weitere Anlage konfigurieren.");
  }
  function removeCartItem(id:number){setCart(c=>c.filter(i=>i.id!==id))}
  function changeCartQty(id:number,qty:number){
    if(qty<=0){ removeCartItem(id); return; }
    setCart(c=>c.map(i=>i.id===id?{...i,quantity:qty}:i));
  }

  async function order(){
    if(cart.length===0){ setMessage("Bitte mindestens eine Konfiguration in den Warenkorb legen."); return; }
    setMessage("Bestellung wird gespeichert ...");
    const items=cart.map(i=>({productId:i.product.id, quantity:i.quantity}));
    const configuration={
      items: cart.map(i=>({
        productName:i.product.name, quantity:i.quantity, project:i.config.project, customerType:i.config.customerType,
        buildingType:i.config.buildingType, anlagenart:i.anlagenart, gsSs:i.gsSs,
        doorsCount:i.config.doors, users:i.config.users, keysCount:i.config.keys, security:i.config.security,
        doors:i.doorList.map(d=>d.name), keyList:i.keyList, matrix:i.matrix, doorList:i.doorList,
      })),
    };
    const totalCents=Math.round(cartTotal);
    const res=await fetch("/api/orders",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
      customer, configuration, totalCents, items
    })});
    const data=await res.json();
    setMessage(res.ok?("Bestellung erfolgreich angelegt: "+data.orderNumber):(data.error||"Fehler"));
  }

  return <main>
   <header><div className="nav wrap"><a className="logo" href="#">SCHLIESSANLAGEN<span>SHOP24</span></a><nav><a href="#systeme">Systeme</a><a href="#konfigurator">Konfigurator</a><a href="/admin">Admin</a></nav>
   {cart.length>0 && <div className="cart-badge" onClick={()=>{setStep(4);document.querySelector("#konfigurator")?.scrollIntoView({behavior:"smooth"})}} style={{cursor:"pointer"}}>🛒 Warenkorb: {cart.length} Konfiguration{cart.length>1?"en":""}</div>}
   </div></header>
    <section className="hero"><div className="wrap heroGrid"><div><small>SCHLIESSANLAGEN ONLINE PLANEN</small><h1>Sicher.<br/><span>Passgenau.</span><br/>Einfach bestellt.</h1><p>Konfigurieren Sie Ihre Schließanlage, erstellen Sie einen Schließplan und senden Sie Ihre Bestellung direkt an den Shop.</p><a className="btn gold" href="#konfigurator">Konfigurator starten</a></div><div className="visual"><div className="cyl"></div><div className="key"></div></div></div></section>
    <section id="systeme" className="section wrap"><div className="center"><small>PRODUKTAUSWAHL</small><h2>Schließsysteme</h2><p>Wählen Sie das Produkt für Ihre aktuelle Konfiguration.</p></div><div className="cards">{products.map(p=>
      <article className={"card "+(selected.id===p.id?"selected":"")} key={p.id}><div className="prod"></div><h3>{p.name}</h3><p>{p.description}</p><strong>ab {eur(p.price_cents)}</strong><button className="btn light" onClick={()=>{setSelected(p);document.querySelector("#konfigurator")?.scrollIntoView({behavior:"smooth"})}}>{selected.id===p.id?"Ausgewählt":"Für Konfiguration auswählen"}</button></article>
    )}</div>
    </section>
    <section id="konfigurator" className="section config"><div className="wrap"><div className="center"><small>KONFIGURATOR</small><h2>Ihre Schließanlage</h2></div>
      <div className="steps">{["Projekt","Mengen","Schließplan","Bestellung"].map((x,i)=><div className={step===i+1?"on":""} key={x}>{i+1}. {x}</div>)}</div>
      {step===1&&<Panel title="Was möchten Sie planen?">
        <p>Aktuell gewähltes Produkt: <b>{selected.name}</b></p>
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
        <p>Legen Sie pro Tür Zylindertyp, Maße und Sicherheitsoptionen fest, und tragen Sie ein, welcher Schlüssel welche Tür öffnen soll.</p>

        <h3>Schlüssel <InfoIcon text="Jeder Schlüssel bekommt einen Namen. Bei jeder Tür können Sie unten festlegen, welche Schlüssel sie öffnen dürfen."/></h3>
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
          const isVHS=door.type==="VHS";
          return <div className={"doorcard "+(isOpen?"open":"")} key={i}>
            <div className="doorcard-summary" onClick={()=>setOpenDoor(isOpen?null:i)}>
              <span className="doorcard-arrow">{isOpen?"▾":"▸"}</span>
              <span className="doorcard-name">{door.name}</span>
              <span className="doorcard-meta">{cyl.name} · {isVHS?`${door.outerMM}mm Bügelhöhe`:`${door.outerMM}/${door.innerMM} mm`} · {allowedCount} Schlüssel</span>
            </div>
            {isOpen&&<div className="doorcard-body">
              <label>Bezeichnung<input value={door.name} onChange={e=>updateDoor(i,"name",e.target.value)}/></label>

              <label>Zylindertyp <InfoIcon text={<><CylinderDiagram code={door.type}/><p>{cyl.desc}</p></>}/>
                <select value={door.type} onChange={e=>updateDoor(i,"type",e.target.value)}>
                  {cylinderTypes.map(t=><option key={t.code} value={t.code}>{t.name} ({t.code})</option>)}
                </select>
              </label>

              <div className="doorcard-fields">
                {isVHS ? (
                  <label>Bügelhöhe (mm)<input type="number" min={0} value={door.outerMM} onChange={e=>updateDoor(i,"outerMM",Number(e.target.value))}/></label>
                ) : (
                  <>
                    <label>Außenmaß (mm) <InfoIcon text={<><MeasureDiagram/><p>Maß von der Außenseite der Tür (Angriffsseite) bis zur Zylindermitte. So wird gemessen: von der äußeren Zylinderkante bis zur Mitte des Schließriegels bzw. der Befestigungsschraube.</p></>}/><input type="number" min={0} value={door.outerMM} onChange={e=>updateDoor(i,"outerMM",Number(e.target.value))}/></label>
                    <label>Innenmaß (mm) <InfoIcon text={<><MeasureDiagram/><p>Maß von der Innenseite der Tür bis zur Zylindermitte. So wird gemessen: von der inneren Zylinderkante bis zur Mitte des Schließriegels bzw. der Befestigungsschraube.</p></>}/><input type="number" min={0} value={door.innerMM} onChange={e=>updateDoor(i,"innerMM",Number(e.target.value))}/></label>
                  </>
                )}
                <label>Anzahl<input type="number" min={1} value={door.count} onChange={e=>updateDoor(i,"count",Number(e.target.value))}/></label>
              </div>

              <h4>Sicherheitsoptionen <InfoIcon text="Bohrschutz erschwert das gewaltsame Öffnen durch Aufbohren. Kernziehschutz verhindert das Herausziehen des Zylinderkerns. Not-/Gefahrenfunktion erlaubt das Aufschließen von außen, auch wenn innen ein Schlüssel steckt. Freilauffunktion trennt Schließbart und Kern bei abgezogenem Schlüssel und wird für bestimmte Panikschlösser benötigt."/></h4>
              <label>Bohrschutz<select value={door.bohrschutz} onChange={e=>updateDoor(i,"bohrschutz",e.target.value)}>{bohrschutzLevels.map(b=><option key={b.code} value={b.code}>{b.label}</option>)}</select></label>
              <label className="checkbox-inline"><input type="checkbox" checked={door.kernziehschutz} onChange={e=>updateDoor(i,"kernziehschutz",e.target.checked)}/> Kernziehschutz</label>
              {door.type==="DZ" && <label className="checkbox-inline"><input type="checkbox" checked={door.ng} onChange={e=>updateDoor(i,"ng",e.target.checked)}/> Not-/Gefahrenfunktion</label>}
              {door.type==="DZ" && <label className="checkbox-inline"><input type="checkbox" checked={door.freilauf} onChange={e=>updateDoor(i,"freilauf",e.target.checked)}/> Freilauffunktion</label>}
              <label>Zahnrad-Schließbart <InfoIcon text="Wird für bestimmte Mehrfachverriegelungssysteme benötigt. Die Zahl gibt die Anzahl der Zähne an."/><select value={door.zahnrad} onChange={e=>updateDoor(i,"zahnrad",e.target.value)}>{zahnradLevels.map(z=><option key={z.code} value={z.code}>{z.label}</option>)}</select></label>
              <label className="checkbox-inline"><input type="checkbox" checked={door.farbkappe} onChange={e=>updateDoor(i,"farbkappe",e.target.checked)}/> Farbkappenschlüssel (leichtere Unterscheidung mehrerer Schlüssel)</label>
              <label>Zylinderfarbe<select value={door.farbe} onChange={e=>updateDoor(i,"farbe",e.target.value)}>{zylinderfarben.map(f=><option key={f}>{f}</option>)}</select></label>

              <h4>Welche Schlüssel öffnen diese Tür?</h4>
              <div className="doorcard-matrix">{keyList.map((k,j)=><label key={k} className="matrix-check"><input type="checkbox" checked={matrix[i]?.[j]||false} onChange={()=>toggleMatrix(i,j)}/>{k}</label>)}</div>
              <button className="btn light small" onClick={()=>removeDoor(i)}>Tür entfernen</button>
            </div>}
          </div>
        })}</div>
        <button className="btn gold" onClick={addDoor}>+ Weitere Tür hinzufügen</button>

        <div className="addtocart-box">
          <p>Aktuelle Konfiguration: <b>{selected.name}</b> · geschätzt {eur(workingPrice)}</p>
          <button className="btn gold" onClick={addConfigToCart}>Diese Konfiguration in den Warenkorb legen</button>
          {message && <div className="message">{message}</div>}
        </div>
      </Panel>}
      {step===4&&<Panel title="Bestellung abschließen"><div className="orderGrid"><div>
        <h3>Warenkorb</h3>
        {cart.length===0 ? <p>Noch keine Konfiguration im Warenkorb. Gehen Sie zurück zu Schritt 3, um eine hinzuzufügen.</p> : (
          <table><tbody>{cart.map(item=>{
            const itemPrice=(item.product.price_cents*item.config.doors/100 + item.config.keys*12 + item.config.users*18 + 180) * item.quantity;
            return <tr key={item.id}>
              <td>{item.product.name}<br/><small>{item.doorList.length} Türen · {item.keyList.length} Schlüssel · {item.anlagenart}</small></td>
              <td><input type="number" min={0} value={item.quantity} onChange={e=>changeCartQty(item.id,Number(e.target.value))} style={{width:60}}/></td>
              <td>{eur(itemPrice)}</td>
              <td><button className="btn light small" onClick={()=>removeCartItem(item.id)}>Entfernen</button></td>
            </tr>;
          })}</tbody></table>
        )}
        <div className="price">{eur(cartTotal)}</div>
        <h3>Kundendaten</h3><div className="form">{Object.entries({name:"Name *",email:"E-Mail *",phone:"Telefon",company:"Firma",address:"Straße & Hausnummer *",zip:"PLZ *",city:"Ort *"}).map(([k,l])=><label key={k}>{l}<input value={(customer as any)[k]} onChange={e=>setCustomer(x=>({...x,[k]:e.target.value}))}/></label>)}</div></div>
        <aside><h3>Zusammenfassung</h3><p>Konfigurationen<br/><b>{cart.length} Stück</b></p><p>Geschätzter Preis<br/><b>{eur(cartTotal)}</b></p><button className="btn gold full" onClick={order}>Kostenpflichtig bestellen</button>{message ? <div className="message">{message}</div> : null}<small>Demo: Für einen Livegang müssen Zahlungsanbieter, E-Mail-Versand und rechtliche Checkout-Texte ergänzt werden.</small></aside>
      </div></Panel>}
      <div className="actions">{step>1 ? <button className="btn light" onClick={()=>setStep(step-1)}>Zurück</button> : <span/>}{step<4 ? <button className="btn gold" onClick={()=>setStep(step+1)}>Weiter</button> : null}</div>
    </div></section>
    <footer><div className="wrap"><b>SCHLIESSANLAGENSHOP24</b><p>Technischer Full-Stack-Prototyp mit Postgres-Datenbank, API, Konfigurator, Bestellung und Admin-APIs.</p></div></footer>
  </main>
}

function Panel({title,children}:{title:string;children:React.ReactNode}){return <div className="panel"><h2>{title}</h2>{children}</div>}
function Choices({value,onChange,items}:{value:string;onChange:(v:string)=>void;items:string[][]}){return <div className="choices">{items.map(([v,t,s])=><button className={value===v?"choice active":"choice"} onClick={()=>onChange(v)} key={v}><b>{t}</b><span>{s}</span></button>)}</div>}
