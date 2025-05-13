// src/components/DrawerMenu.tsx
"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { open: boolean; onClose: () => void };

const menu = [
  { href: "/", label: "City guides" },
  { href: "/support", label: "Support" },
  { href: "/share", label: "Share" },
  { href: "/about", label: "About" },
];

export default function DrawerMenu({ open, onClose }: Props) {
  const pathname = usePathname();

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-30" onClose={onClose}>
        {/* 背景遮罩 */}
        <div
          className={`fixed inset-0 bg-black/40 transition-opacity duration-300 ${open ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
          onClick={onClose}
        />
        {/* 抽屉面板 */}
        <div
          className={`fixed inset-y-0 left-0 flex max-w-xs transition-transform duration-300 ${open ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="w-64 bg-white p-6 space-y-5">
            <nav className="space-y-4">
              {menu.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`block px-4 py-2 rounded-full font-semibold transition ${
                    pathname === item.href
                      ? "bg-pink-400 text-white"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
