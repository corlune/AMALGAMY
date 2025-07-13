import React, { useState, useRef, useEffect } from "react";
import LoginRegister from "./LoginRegister";
import Vortex from "./components/Vortex";
import Draggable from "react-draggable";

const SPELLBOOK = [
  { name: "Ethereal Body" },
  { name: "Astral Projection" },
  { name: "Deactivate Ethereal Body" },
  { name: "Deactivate Astral Projection" },
  { name: "Fireball" },
];

export default function App() {
  const [players, setPlayers] = useState([]);
  const [projectiles, setProjectiles] = useState([]);
  const [messages, setMessages] = useState(["✨ Welcome to Amalgamy!"]);
  const [input, setInput] = useState("");
  const [evilEyeLvl, setEvilEyeLvl] = useState(1);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(localStorage.getItem("username") || "");
  const [selSpell, setSelSpell] = useState(SPELLBOOK[0].name);
  const [manaSpend, setManaSpend] = useState(10);
  const [fireTarget, setFireTarget] = useState("");
  const logRef = useRef();

  useEffect(() => {
    if (!token) return;

    const fetchAll = async () => {
      try {
        const [playersRes, projRes, histRes] = await Promise.all([
          fetch("/players", { headers:{ Authorization:`Bearer ${token}` }}),
          fetch("/projectiles", { headers:{ Authorization:`Bearer ${token}` }}),
          fetch("/history", { headers:{ Authorization:`Bearer ${token}` }}),
        ]);
        setPlayers(await playersRes.json());
        setProjectiles(await projRes.json());

        const history = await histRes.json();
        const formatted = history.map(entry => {
          const time = new Date(entry.timestamp).toLocaleTimeString();
          if (entry.type === "public")
            return `${time} 💬 ${entry.from}: ${entry.text}`;
          else if (entry.type === "private")
            return `${time} 🤫 ${entry.from} -> ${entry.to}: ${entry.text}`;
          else
            return `${time} ❓ Unknown entry`;
        });
        setMessages(m => [...m, ...formatted]);
      } catch (e) {
        console.error(e);
      }
    };
    fetchAll();

    const i1 = setInterval(async ()=> {
      const res = await fetch("/players", { headers:{ Authorization:`Bearer ${token}` }});
      setPlayers(await res.json());
    }, 1000);

    const i2 = setInterval(async ()=> {
      const res = await fetch("/projectiles", { headers:{ Authorization:`Bearer ${token}` }});
      setProjectiles(await res.json());
    }, 10000);

    return () => { clearInterval(i1); clearInterval(i2); };
  }, [token]);

  useEffect(() => {
    logRef.current?.scrollTo(0, logRef.current.scrollHeight);
  }, [messages]);

  const handleCast = async () => {
    if (selSpell === "Fireball") {
      if (!fireTarget.trim()) return setMessages(m=>[...m,"❌ Enter target for Fireball"]);
      const res = await fetch("/castFireball", {
        method: "POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ casterUsername: username, targetUsername: fireTarget })
      });
      const j = await res.json();
      setMessages(m=>[...m, res.ok ? `🔥 Fireball launched at ${fireTarget}` : `❌ ${j.message}` ]);
      setFireTarget(""); return;
    }
    const res = await fetch("/castSpell", {
      method: "POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
      body: JSON.stringify({ username, spellName: selSpell, manaSpent: manaSpend })
    });
    const j = await res.json();
    setMessages(m=>[...m, res.ok ? `✨ Cast ${selSpell} for ${manaSpend} mana` : `❌ ${j.message}` ]);
  };

  const logout = async () => {
    await fetch("/logout", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ username }) });
    setToken(null); setUsername(""); localStorage.removeItem("username");
    setPlayers([]); setProjectiles([]); setMessages(["✨ Welcome to Amalgamy!"]);
  };

  const sendChat = async () => {
    if (!input.trim()) return;
    const parts = input.trim().split(/\s+/);
    const cmd = parts[0].toLowerCase();

    if (cmd === "/help") {
      setMessages(m => [...m,
        "🧙 Commands:",
        "/help – Show help", "/say msg – Say to all", "/whisper user msg – Private msg"]);
    }
    else if (cmd === "/say") {
      const text = parts.slice(1).join(" ");
      if (!text) return setMessages(m=>[...m,"❌ Usage: /say message"]);
      const res = await fetch("/say", {
        method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ username, message: text })
      });
      if (res.ok) setMessages(m=>[...m, `💬 ${username}: ${text}`]);
      else setMessages(m=>[...m, "❌ Failed to say"]);
    }
    else if (cmd === "/whisper") {
      const to = parts[1]; const text = parts.slice(2).join(" ");
      if (!to || !text) return setMessages(m=>[...m,"❌ Usage: /whisper user msg"]);
      const res = await fetch("/whisper", {
        method:"POST", headers:{ "Content-Type":"application/json", Authorization:`Bearer ${token}` },
        body: JSON.stringify({ fromUsername: username, toUsername: to, message: text })
      });
      if (res.ok) setMessages(m=>[...m, `🤫 To ${to}: ${text}`]);
      else setMessages(m=>[...m, "❌ Failed to whisper"]);
    }
    else {
      setMessages(m=>[...m, `❓ Unknown command: ${input}`]);
    }
    setInput("");
  };

  const toggleEvilEye = () => {
    setEvilEyeLvl(e=>(e%3)+1);
    setMessages(m=>[...m, `🧿 Evil Eye Lv${(evilEyeLvl%3)+1}`]);
  };

  if (!token) return <LoginRegister onLogin={(tok,u)=>{ setToken(tok); setUsername(u); localStorage.setItem("username", u); }} />;

  return <>
    <Vortex players={players} projectiles={projectiles} />
    <Draggable defaultPosition={{ x:20,y:100 }}>
      <div ref={logRef} style={{
        width:320,maxHeight:"40vh",overflowY:"auto",background:"rgba(10,10,20,0.85)",
        color:"#aaf",padding:10,borderRadius:8,fontFamily:"monospace",fontSize:13,
        position:"absolute",cursor:"move",userSelect:"none",zIndex:9999
      }}>
        {messages.map((m,i)=><div key={i}>{m}</div>)}
      </div>
    </Draggable>
    <Draggable defaultPosition={{ x:400,y:100 }}>
      <div style={{
        width:240,background:"rgba(10,10,20,0.85)",color:"#aaf",padding:10,
        borderRadius:8,fontFamily:"monospace",fontSize:13,position:"absolute",
        cursor:"move",userSelect:"none",zIndex:9999
      }}>
        <div><strong>{username}</strong></div>
        <button onClick={logout} style={{width:"100%",margin:"6px 0"}}>Logout</button>
        <hr style={{borderColor:"#444"}}/>
        <div><strong>Spellbook</strong></div>
        <select value={selSpell} onChange={e=>setSelSpell(e.target.value)} style={{width:"100%"}}>
          {SPELLBOOK.map(s=><option key={s.name}>{s.name}</option>)}
        </select>
        {selSpell!=="Fireball"
          ?<input type="number" min={1} value={manaSpend} onChange={e=>setManaSpend(+e.target.value)}
            style={{width:"100%",margin:"4px 0"}}/>
          :<input type="text" placeholder="Target user" value={fireTarget}
            onChange={e=>setFireTarget(e.target.value)} style={{width:"100%",margin:"4px 0"}}/>
        }
        <button onClick={handleCast} style={{width:"100%"}}>Cast {selSpell}</button>
        <hr style={{borderColor:"#444"}}/>
        <button onClick={toggleEvilEye} style={{width:"100%"}}>Evil Eye Lv{evilEyeLvl}</button>
      </div>
    </Draggable>
    <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",width:"60%",
      background:"rgba(10,10,20,0.9)",display:"flex",padding:5,borderTop:"1px solid #333",zIndex:10}}>
      <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()}
        placeholder="Type a command…" style={{
          flex:1,background:"transparent",border:"none",color:"#aaf",outline:"none",fontFamily:"monospace",fontSize:14}}/>
    </div>
  </>;
}
