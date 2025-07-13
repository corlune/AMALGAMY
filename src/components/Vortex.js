// src/components/Vortex.js
import React, { useRef, useEffect, useState } from "react";

export default function Vortex({ players, projectiles }) {
  const canvasRef      = useRef();
  const particlesRef   = useRef([]);
  const playersRef     = useRef(players);
  const projectilesRef = useRef(projectiles);
  const hoveredRef     = useRef(null);
  const animRef        = useRef();
  const mouseRef       = useRef({ x:0, y:0 });
  const [, bump]       = useState(0); // forces re-render when hover changes

  // always keep refs fresh
  playersRef.current     = players;
  projectilesRef.current = projectiles;

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    let w, h, t = 0;

    // background mist particles
    const bgParticles = Array.from({ length: 50 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.002 + Math.random() * 0.004,
      alpha: 0.05 + Math.random() * 0.1,
      speed: 0.00005 + Math.random() * 0.0001
    }));

    class Particle {
      constructor(player) {
        this.username = player.username;
        this.angle = Math.random() * Math.PI * 2;
        this.distance = 80 + Math.random() * 120;
        this.speed = 0.0005 + Math.random() * 0.0005;
        this.radius = 8 + Math.random() * 4;
        this.baseAlpha = 0.3 + Math.random() * 0.3;
        this.x = 0;
        this.y = 0;
      }
      update() {
        this.angle += this.speed;
      }
      draw(cx, cy, pulse) {
        const x = cx + Math.cos(this.angle) * this.distance;
        const y = cy + Math.sin(this.angle) * this.distance * 0.6;
        const alpha = this.baseAlpha * pulse;

        ctx.beginPath();
        ctx.fillStyle = `rgba(120,180,215,${alpha})`;
        ctx.shadowColor = `rgba(150,150,255,${alpha})`;
        ctx.shadowBlur = 12;
        ctx.arc(x, y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        this.x = x;
        this.y = y;
      }
      hitTest(mx, my) {
        const dx = mx - this.x, dy = my - this.y;
        return dx * dx + dy * dy <= this.radius * this.radius;
      }
    }

    function resize() {
      w = c.width = window.innerWidth;
      h = c.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    // track mouse
    c.addEventListener("mousemove", e => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    });

    particlesRef.current = [];

    function draw() {
      // background gradient
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, "#0a0a15");
      gradient.addColorStop(1, "#141429");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);

      // animate mist
      bgParticles.forEach(p => {
        p.y += p.speed;
        if (p.y > 1) p.y = 0;
        const x = p.x * w;
        const y = p.y * h;
        const radius = p.r * w;
        ctx.beginPath();
        ctx.fillStyle = `rgba(80,100,140,${p.alpha})`;
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      });

      const cx = w/2, cy = h/2;

      // fireballs
      projectilesRef.current.forEach(pr => {
        const startT = new Date(pr.startTime).getTime();
        const elapsed = Date.now() - startT;
        const prog = Math.min(elapsed / pr.durationMs, 1);
        if (prog < 1) {
          const caster = particlesRef.current.find(o => o.username === pr.caster);
          const target = particlesRef.current.find(o => o.username === pr.target);
          if (caster && target) {
            const fx = caster.x + (target.x - caster.x) * prog;
            const fy = caster.y + (target.y - caster.y) * prog;
            const totalDist = Math.hypot(target.x - caster.x, target.y - caster.y);
            const currDist = Math.hypot(target.x - fx, target.y - fy);
            const size = 8 + (1 - currDist / totalDist) * 12;
            const alpha = 1 - prog;

            const grad = ctx.createRadialGradient(fx, fy, size*0.2, fx, fy, size);
            grad.addColorStop(0, `rgba(255,200,50,${alpha})`);
            grad.addColorStop(0.5, `rgba(255,120,20,${alpha*0.6})`);
            grad.addColorStop(1, "rgba(255,20,0,0)");

            ctx.fillStyle = grad;
            ctx.shadowColor = `rgba(255,120,20,${alpha})`;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.arc(fx, fy, size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      });

      // sync particles ↔ players
      const names = playersRef.current.map(p => p.username);
      particlesRef.current = particlesRef.current.filter(o => names.includes(o.username));
      names.forEach(name => {
        if (!particlesRef.current.some(o => o.username === name)) {
          const player = playersRef.current.find(p => p.username === name);
          particlesRef.current.push(new Particle(player));
        }
      });

      // draw orbs + detect hover
      let found = null;
      const { x: mx, y: my } = mouseRef.current;
      particlesRef.current.forEach((pt, i) => {
        pt.update();
        const pulse = 0.5 + 0.5 * Math.sin(t * 0.01 + i);
        pt.draw(cx, cy, pulse);
        if (pt.hitTest(mx, my)) found = pt.username;
      });

      if (found !== hoveredRef.current) {
        hoveredRef.current = found;
        bump(n => n + 1); // trigger re-render
      }

      t++;
      animRef.current = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  // tooltip render block
  return (
    <>
      <canvas ref={canvasRef}
        style={{
          position: "fixed", top: 0, left: 0,
          width: "100vw", height: "100vh",
          zIndex: 1, pointerEvents: "auto",
          background: "transparent"
        }}
      />
      {hoveredRef.current && (() => {
        const particle = particlesRef.current.find(o => o.username === hoveredRef.current);
        const player = playersRef.current.find(p => p.username === hoveredRef.current);
        const isSelf = player?.isSelf;
        const mana = player?.mana ?? "?";
        const left = particle?.x ?? mouseRef.current.x;
        const top = (particle?.y ?? mouseRef.current.y) - 20;

        return (
          <div style={{
            position:"fixed", left, top,
            transform:"translate(-50%,-100%)",
            background:"rgba(20,20,30,0.9)",
            color:"#aaf", padding:"4px 8px",
            borderRadius:4, fontFamily:"monospace", fontSize:13,
            pointerEvents:"none", zIndex:1000
          }}>
            <div><strong>{hoveredRef.current}</strong></div>
            {isSelf && <div style={{ marginTop:4 }}>Mana: {mana}</div>}
          </div>
        );
      })()}
    </>
  );
}
