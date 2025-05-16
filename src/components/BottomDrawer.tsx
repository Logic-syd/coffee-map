import React, { useEffect, useState } from "react";

interface BottomDrawerProps {
  open: boolean;
  children: React.ReactNode;
}

export default function BottomDrawer({ open, children }: BottomDrawerProps) {
  const [show, setShow] = useState(open);
  const [animate, setAnimate] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (open) {
      setShow(true);
      // Small delay to ensure DOM update before animation
      setTimeout(() => {
        setContentReady(true);
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      }, 50);
    } else if (show) {
      setAnimate(false);
      setTimeout(() => {
        setShow(false);
        setContentReady(false);
      }, 500); // Animation duration 0.5s
    }
  }, [open, show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-40 flex flex-col justify-end pointer-events-none">
      <div
        className={`relative w-full max-w-md mx-auto bg-white rounded-t-2xl shadow-lg max-h-[44vh] overflow-y-auto pointer-events-auto transition-transform duration-500 ${animate ? "translate-y-0" : "translate-y-full"}`}
        style={{ willChange: "transform" }}
      >
        {contentReady ? children : null}
      </div>
    </div>
  );
}
