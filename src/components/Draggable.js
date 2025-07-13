// src/components/Draggable.js
import React, { useRef, useEffect } from "react";

export default function Draggable({ children, defaultPos = { left: 100, top: 100 } }) {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    el.style.position = "fixed";
    el.style.left = defaultPos.left + "px";
    el.style.top = defaultPos.top + "px";

    let isDragging = false, startX, startY, startLeft, startTop;

    const onMouseDown = (e) => {
      if (e.target.closest("input, textarea, select, button")) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    const onMouseMove = (e) => {
      if (!isDragging) return;
      el.style.left = startLeft + (e.clientX - startX) + "px";
      el.style.top  = startTop + (e.clientY - startY) + "px";
    };

    const onMouseUp = () => {
      isDragging = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    el.addEventListener("mousedown", onMouseDown);
    return () => el.removeEventListener("mousedown", onMouseDown);
  }, [defaultPos]);

  return <div ref={ref} style={{ cursor: "move", userSelect: "none" }}>{children}</div>;
}
