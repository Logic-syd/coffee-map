import { useRef, useEffect, useState } from "react";

type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
};

// 假设 TopBar 高度 56px，停在 28px (top-7)
const TOP_OFFSET = 28; // px

export default function BottomSheet({ open, onClose, children }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(open);
  const [animate, setAnimate] = useState(false);

  // 控制动画显示/隐藏
  useEffect(() => {
    if (open) {
      setShow(true);
      setTimeout(() => setAnimate(true), 10); // 触发动画
    } else if (show) {
      setAnimate(false);
      setTimeout(() => setShow(false), 500); // 0.5s
    }
  }, [open]);

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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        ref={sheetRef}
        className={`fixed left-1/2 -translate-x-1/2 ${animate ? `top-[${TOP_OFFSET}px]` : "top-full"} mx-auto bg-white rounded-t-2xl shadow-lg w-full max-w-md md:max-w-xl lg:max-w-2xl h-[calc(100vh-28px)] max-h-[95vh] overflow-y-auto transition-transform duration-500`}
        style={{ touchAction: "pan-y" }}
      >
        {children}
      </div>
    </div>
  );
}
