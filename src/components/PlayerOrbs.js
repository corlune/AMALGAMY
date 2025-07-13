// src/components/Vortex.js
import React, { useRef, useEffect, useState } from "react";

export default function Vortex({ players, evilEyeLevel, projectiles }) {
  const canvasRef    = useRef();
  const particlesRef = useRef([]);           // holds Particle instances
  const playersRef   = useRef(players);      // mutable ref to latest players
  const animRef      = useRef();
  const hoveredRef   = useRef(null);
  const [, bump]     = useState(0);          // to force tooltip re-render

  // keep playersRef up to date
  playersRef.current = players;

  // track mouse for hover
  const mouseRef = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const c = canvasRef.current;
    function onMove(e) {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    }
    c.addEventListener("mousemove", onMove);
    return () => c.removeEventListener("mousemove", onMove);
  }, []);

  useEffect(() => {
    const c   = canvasRef.current;
    const ctx = c.getContext("2d");
    let w, h, t = 0;

    // Particle for each player
    class Particle {
      constructor(player) {
        this.username  = player.username;
        this.angle     = Math.random() * Math.PI * 2;
        this.distance  = 80 + Math.random() * 120;
        this.speed     = 0.0005 + Math.random() * 0.0005;
        this.radius    = 8 + Math.random() * 4;
        this.baseAlpha = 0.3 + Math.random() * 0.3;
        this.x = 0; this.y = 0;
      }
      update() {
        this.angle += this.speed;
      }
      draw(cx, cy, pulse) {
        const x     = cx + Math.cos(this.angle) * this.distance;
        const y     = cy + Math.sin(this.angle) * this.distance * 0.6;
        const alpha = this.baseAlpha * pulse;
        ctx.beginPath();
        ctx.fillStyle   = `rgba(120,180,215,${alpha})`;
        ctx.shadowColor = `rgba(150,150,255,${alpha})`;
        ctx.shadowBlur  = 12;
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        this.x = x; this.y = y;
      }
      hitTest(mx, my) {
        const dx = mx - this.x, dy = my - this.y;
        return dx*dx + dy*dy <= this.radius * this.radius;
      }
    }

    // resize canvas
    function resize() {
      w = c.width  = window.innerWidth;
      h = c.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // initialize
    particlesRef.current = [];

    // main draw loop
    function draw() {
      ctx.clearRect(0, 0, w, h);
      const cx = w/2, cy = h/2;

      // ─── PROJECTILES ──────────────────────────────
      if (projectiles && projectiles.length) {
        const now = Date.now();
        projectiles.forEach(pr => {
          const start    = new Date(pr.startTime).getTime();
          const progress = Math.min((now - start) / pr.durationMs, 1);

          // interpolate world coords
          const wx = pr.startPos.x + (pr.endPos.x - pr.startPos.x) * progress;
          const wy = pr.startPos.y + (pr.endPos.y - pr.startPos.y) * progress;

          // map into our circular display area
          const fx = cx + (wx - 0.5) * w * 0.8;
          const fy = cy + (wy - 0.5) * h * 0.8;

          // fireball appearance
          const size  = 12 + 8 * Math.sin(progress * Math.PI);
          const alpha = 1 - progress;

          // radial glow
          const grad = ctx.createRadialGradient(fx, fy, size * 0.2, fx, fy, size);
          grad.addColorStop(0,   `rgba(255,200,50,${alpha})`);
          grad.addColorStop(0.5, `rgba(255,120,20,${alpha * 0.6})`);
          grad.addColorStop(1,   "rgba(255,20,0,0)");

          ctx.fillStyle   = grad;
          ctx.shadowColor = `rgba(255,120,20,${alpha})`;
          ctx.shadowBlur  = 20;
          ctx.beginPath();
          ctx.arc(fx, fy, size, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        });
      }
      // ───────────────────────────────────────────────

      // sync particles with players
      const currentPlayers = playersRef.current.map(p=>p.username);
      particlesRef.current = particlesRef.current.filter(pt=>currentPlayers.includes(pt.username));
      playersRef.current.forEach(p => {
        if (!particlesRef.current.find(pt=>pt.username===p.username)) {
          particlesRef.current.push(new Particle(p));
        }
      });

      // draw player orbs
      const mx = mouseRef.current.x, my = mouseRef.current.y;
      let found = null;

      particlesRef.current.forEach((pt,i) => {
        pt.update();
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.01 + i);
        pt.draw(cx, cy, pulse);
        if (pt.hitTest(mx, my)) found = pt.username;
      });

      // tooltip state
      if (found !== hoveredRef.current) {
        hoveredRef.current = found;
        bump(n=>n+1);
      }

      t++;
      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []); // run only once on mount

  // render canvas + tooltip
  return (
    <>
      <canvas
        ref={canvasRef}
        style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100vw", height: "100vh",
          zIndex: 1, pointerEvents: "auto",
          background: "transparent"
        }}
      />
      {hoveredRef.current && (
        <div style={{
          position: "fixed",
          left: particlesRef.current.find(pt=>pt.username===hoveredRef.current)?.x,
          top:  particlesRef.current.find(pt=>pt.username===hoveredRef.current)?.y - 20,
          transform: "translate(-50%, -100%)",
          background: "rgba(20,20,30,0.9)",
          color: "#aaf",
          padding: "4px 8px",
          borderRadius: 4,
          fontFamily: "monospace",
          fontSize: 13,
          pointerEvents: "none",
          zIndex: 10
        }}>
          {hoveredRef.current}
        </div>
      )}
    </>
  );
}
