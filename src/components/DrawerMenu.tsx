// src/components/DrawerMenu.tsx
"use client";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";

type Props = { open: boolean; onClose: () => void };

export default function DrawerMenu({ open, onClose }: Props) {
  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-30" onClose={onClose}>
        {/* 背景遮罩 */}
        <Transition.Child
          as={Fragment}
          enter="transition-opacity duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        {/* 抽屉面板 */}
        <div className="fixed inset-y-0 left-0 flex max-w-xs">
          <Transition.Child
            as={Fragment}
            enter="transition-transform duration-300"
            enterFrom="-translate-x-full"
            enterTo="translate-x-0"
            leave="transition-transform duration-200"
            leaveFrom="translate-x-0"
            leaveTo="-translate-x-full"
          >
            <div className="w-64 bg-white p-6 space-y-5">
              <nav className="space-y-4">
                {/* City guides 用粉色背景 */}
                <Link
                  href="/"
                  onClick={onClose}
                  className="inline-block px-4 py-2 rounded-full bg-pastelPink text-white font-semibold"
                >
                  City guides
                </Link>
                <Link href="/support" className="block">
                  Support
                </Link>
                <Link href="/share" className="block">
                  Share
                </Link>
                <Link href="/about" className="block">
                  About
                </Link>
              </nav>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition>
  );
}
