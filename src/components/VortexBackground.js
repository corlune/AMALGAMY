import React, { useRef, useEffect } from "react";

export default function VortexBackground() {
  const canvasRef = useRef();
  const animRef   = useRef();

  useEffect(() => {
    const c = canvasRef.current;
    const ctx = c.getContext("2d");
    let w, h, t = 0;

    function resize() {
      w = c.width  = window.innerWidth;
      h = c.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0,0,w,h);
      const cx = w/2, cy = h/2;
      for (let i=0; i<30; i++) {
        const angle = t*0.001 + i*0.2;
        const rad   = 100 + i*12;
        const x     = cx + rad * Math.cos(angle);
        const y     = cy + rad * Math.sin(angle)*0.6;
        const alpha = 0.04 + 0.02*Math.sin(t*0.01 + i);
        const size  = 60 + 30*Math.sin(t*0.007 + i);

        const grad = ctx.createRadialGradient(
          x, y, size*0.3,
          x, y, size
        );
        grad.addColorStop(0, `rgba(120,180,215,${alpha})`);
        grad.addColorStop(1, "rgba(10,10,20,0)");

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2*Math.PI);
        ctx.fill();
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

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed", top:0, left:0,
        width:"100vw", height:"100vh",
        zIndex: 0, pointerEvents: "none"
      }}
    />
  );
}
