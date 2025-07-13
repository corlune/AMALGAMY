// src/useGameEngine.js
import { useEffect, useState, useRef } from "react";

export default function useGameEngine() {
  const [ws, setWs] = useState(null);
  const [logs, setLogs] = useState([]); // merged see/hear
  const [playerStats, setPlayerStats] = useState({});
  const [playerList, setPlayerList] = useState([]);

  const connect = () => {
    const sock = new WebSocket("ws://localhost:8765");
    setWs(sock);

    sock.onmessage = (e) => {
      const msg = e.data;
      if(msg.startsWith("@@PLAYER_STATS")){
        const parts = msg.slice(14).split("|");
        const stats = Object.fromEntries(parts.map(p=>{
          const [k,v]=p.split(":");
          return [k,v];
        }));
        setPlayerStats(stats);
      }
      else if(msg.startsWith("@@PLAYER_LIST")){
        setPlayerList(msg.slice(14).split(","));
      }
      else {
        setLogs(prev=>[...prev,msg].slice(-200));
      }
    };
    sock.onclose = () => setTimeout(connect, 3000); // auto-reconnect
  };

  useEffect(connect, []);

  const send = (txt) => {
    if(ws && ws.readyState===1) ws.send(txt);
  };

  return { logs, playerStats, playerList, send };
}
