// src/components/DrawerMenu.tsx
"use client";
import LanguagePicker from "./LanguagePicker";
import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HomeIcon,
  InformationCircleIcon,
  ShareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { tapSpring } from "@/lib/motion";
import { t } from "@/lib/i18n";
import { useLocale } from "@/hooks/useLocale";

type Props = { open: boolean; onClose: () => void };

export default function DrawerMenu({ open, onClose }: Props) {
  const pathname = usePathname();
  const locale = useLocale();

  // 简化导航菜单，使用原始路径
  const menu = [
    {
      href: "/",
      label: t("menu.home", locale),
      icon: <HomeIcon className="w-5 h-5" />,
    },
    {
      href: "/support",
      label: t("menu.support", locale),
      icon: (
        <svg
          className="w-5 h-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 18v-2a4 4 0 014-4h8a4 4 0 014 4v2m-6-9a4 4 0 100-8 4 4 0 000 8z" />
        </svg>
      ),
    },
    {
      href: "/share",
      label: t("menu.share", locale),
      icon: <ShareIcon className="w-5 h-5" />,
    },
    {
      href: "/about",
      label: t("menu.about", locale),
      icon: <InformationCircleIcon className="w-5 h-5" />,
    },
  ];

  return (
    <Transition show={open} as={Fragment}>
      <Dialog className="relative z-50" onClose={onClose}>
        <Dialog.Title className="sr-only">
          {t("action.menu", locale)}
        </Dialog.Title>
        {/* 背景遮罩 - 使用 Transition 实现淡入淡出效果 */}
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div
            className="fixed inset-0 bg-black/40"
            aria-hidden="true"
            onClick={onClose}
          />
        </Transition.Child>

        {/* 抽屉面板 - 使用 Transition 实现滑入滑出效果 */}
        <Transition.Child
          as={Fragment}
          enter="transition ease-out duration-300"
          enterFrom="-translate-x-full"
          enterTo="translate-x-0"
          leave="transition ease-in duration-200"
          leaveFrom="translate-x-0"
          leaveTo="-translate-x-full"
        >
          <div className="fixed inset-y-0 left-0 max-w-xs z-50">
            <div className="w-64 h-full bg-white shadow-xl overflow-y-auto flex flex-col rounded-r-3xl">
              {/* 顶部Logo区 */}
              <div className="flex flex-col items-start justify-center px-6 pt-8 pb-4">
                <span
                  className="text-2xl font-bold italic text-pinkaccent select-none"
                  style={{ fontFamily: "cursive, serif" }}
                >
                  Coffee Map
                </span>
                {/* 这里后续可放Logo图 */}
              </div>
              {/* 关闭按钮 */}
              <div className="absolute top-4 right-4">
                <motion.button
                  onClick={onClose}
                  className="grid min-h-11 min-w-11 place-items-center p-1 rounded-full hover:bg-pinkaccent/20 transition-colors"
                  aria-label={t("action.close", locale)}
                  whileTap={tapSpring}
                >
                  <XMarkIcon className="h-6 w-6 text-pinkaccent" />
                </motion.button>
              </div>
              {/* 菜单区域 */}
              <nav className="flex-1 flex flex-col gap-2 px-2 mt-4">
                {menu.map((item) => {
                  const isActive =
                    pathname === item.href || pathname === item.href + "/";
                  return (
                    <motion.div key={item.href} whileTap={tapSpring}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-5 py-3 font-medium transition-colors relative ${
                          isActive
                            ? "bg-pinkaccent/30 text-inkblack rounded-full"
                            : "text-inkblack hover:bg-pinkcream rounded-full"
                        }`}
                        style={isActive ? { backdropFilter: "blur(2px)" } : {}}
                      >
                        <span>{item.icon}</span>
                        {item.label}
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>
              <LanguagePicker />
              {/* 底部区域 */}
              <div className="px-6 py-4 text-sm text-graytext border-t mt-auto">
                <p>© Coffee Map</p>
              </div>
            </div>
          </div>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
