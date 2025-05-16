import { useRef, useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

export default function BottomSheet({ open, onClose, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(open);
  const [animate, setAnimate] = useState(false);
  const [contentReady, setContentReady] = useState(false);
  const contentRef = useRef(children);
  const previousOpenRef = useRef(open);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle opening and closing
  useEffect(() => {
    // Clear any existing timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (open) {
      // Opening flow
      setShow(true);

      // Give time for content to render
      timeoutRef.current = setTimeout(() => {
        setContentReady(true);
        // Start animation after content is ready
        requestAnimationFrame(() => {
          setAnimate(true);
        });
      }, 50);
    } else if (show) {
      // Closing flow
      setAnimate(false);

      // Wait for animation to end before hiding
      timeoutRef.current = setTimeout(() => {
        setShow(false);
        setContentReady(false);
      }, 500);
    }

    // Update refs
    contentRef.current = children;
    previousOpenRef.current = open;

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [open, children, show]);

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sheetRef.current && !sheetRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (show) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [show, onClose]);

  // Basic swipe down to close
  useEffect(() => {
    let startY = 0;
    let endY = 0;
    function onTouchStart(e: TouchEvent) {
      startY = e.touches[0].clientY;
    }
    function onTouchMove(e: TouchEvent) {
      endY = e.touches[0].clientY;
    }
    function onTouchEnd() {
      if (endY - startY > 60) onClose();
    }
    const node = sheetRef.current;
    if (node) {
      node.addEventListener("touchstart", onTouchStart);
      node.addEventListener("touchmove", onTouchMove);
      node.addEventListener("touchend", onTouchEnd);
    }
    return () => {
      if (node) {
        node.removeEventListener("touchstart", onTouchStart);
        node.removeEventListener("touchmove", onTouchMove);
        node.removeEventListener("touchend", onTouchEnd);
      }
    };
  }, [show, onClose]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      <div
        className={`absolute inset-0 bg-black/40 transition-opacity duration-500 ${
          animate ? "opacity-100" : "opacity-0"
        } pointer-events-auto`}
        onClick={onClose}
      />
      <div
        ref={sheetRef}
        className={`fixed inset-x-0 mx-auto bg-white rounded-t-2xl shadow-lg w-full max-w-md md:max-w-xl lg:max-w-2xl h-[calc(100vh-120px)] max-h-[95vh] overflow-hidden transition-transform duration-500 ease-out transform ${
          animate ? "translate-y-0" : "translate-y-full"
        } pointer-events-auto`}
        style={{
          touchAction: "pan-y",
          willChange: "transform",
          transformOrigin: "bottom",
          top: "120px",
        }}
      >
        <div className="h-full overflow-y-auto overscroll-contain">
          {contentReady ? children : null}
        </div>
      </div>
    </div>
  );
}
