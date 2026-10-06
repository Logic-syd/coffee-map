import { useRef, useEffect } from "react";
import { useLocale } from "@/hooks/useLocale";
import { t } from "@/lib/i18n";
type Props = {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  label?: string;
};
export default function BottomSheet({ open, onClose, children, label }: Props) {
  const locale = useLocale();
  const sheetRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const touchY = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sheetRef.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab" && sheetRef.current) {
        const controls = Array.from(
          sheetRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]',
          ),
        ).filter((node) => node.getClientRects().length > 0);
        const first = controls[0],
          last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          return;
        }
        if (
          event.shiftKey &&
          (document.activeElement === first ||
            document.activeElement === sheetRef.current)
        ) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected)
        previousFocus.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal="true"
        aria-label={label || t("venue.unnamed", locale)}
        tabIndex={-1}
        className="relative flex h-[calc(100dvh-72px)] max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl bg-white shadow-lg outline-none"
      >
        <button
          className="flex min-h-11 shrink-0 items-center justify-center"
          aria-label={t("action.close", locale)}
          onClick={onClose}
          onTouchStart={(event) => {
            touchY.current = event.touches[0]?.clientY;
          }}
          onTouchEnd={(event) => {
            if (
              touchY.current !== undefined &&
              (event.changedTouches[0]?.clientY ?? touchY.current) -
                touchY.current >
                60
            )
              onClose();
            touchY.current = undefined;
          }}
          onTouchCancel={() => {
            touchY.current = undefined;
          }}
        >
          <span className="h-1 w-12 rounded-full bg-gray-300" />
        </button>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
