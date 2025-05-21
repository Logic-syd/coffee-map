import React, { useEffect, useState } from "react";

interface BottomDrawerProps {
  open: boolean;
  children: React.ReactNode;
  onClose?: () => void;
}

export default function BottomDrawer({
  open,
  children,
  onClose,
}: BottomDrawerProps) {
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
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-white/90 text-gray-500 hover:text-gray-700 shadow-sm"
            aria-label="关闭"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
        {contentReady ? children : null}
      </div>
    </div>
  );
}
