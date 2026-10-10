"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState } from "react";

import { Popover, Transition } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import { Command } from "lucide-react";

import ThemeSwitcher from "@/components/ThemeSwitcher";

import local from "next/font/local";

const links = [
  { label: "Projects", href: "/projects" },
  { label: "Writing", href: "/writing" },
  { label: "Photos", href: "/photos" },
];

const autograf = local({
  src: [{ path: "../../../public/fonts/Autograf.ttf", weight: "400" }],
  variable: "--font-autograf",
});

const menuLine =
  "absolute left-[calc(50%-11px)] top-[calc(50%-1px)] h-[2px] w-[22px] rounded-full bg-current transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]";

// While the mobile menu is open, close it on any press outside it, or as soon
// as the page scrolls
function CloseOnOutside({
  rootRef,
  close,
}: {
  rootRef: React.RefObject<HTMLElement>;
  close: () => void;
}) {
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onScroll = () => close();
    document.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("scroll", onScroll);
    };
  }, [rootRef, close]);

  return null;
}

export default function Header() {
  const pathname = `/${usePathname().split("/")[1]}`;
  const [hoveredPath, setHoveredPath] = useState(pathname);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [disableAnimation, setDisableAnimation] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setHoveredPath(pathname);

    // Disable animation briefly when pathname changes
    setDisableAnimation(true);
    const timer = setTimeout(() => {
      setDisableAnimation(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <header
      className={`duration-400 sticky top-0 z-50 transition-all md:mt-6 ${
        isScrolled
          ? "bg-background-light/80 backdrop-blur-lg dark:bg-background-dark/80"
          : ""
      }`}
    >
      <nav className="mx-auto flex max-w-[700px] items-center justify-between gap-3 px-4 py-3 md:px-6">
        <Link
          href="/"
          className="ml-2 shrink-0 text-text-light-body dark:text-text-dark-headerDark md:ml-0"
          onClick={() => setDisableAnimation(true)}
        >
          <h1 className={`${autograf.className} text-3xl`}>Eric</h1>
        </Link>
        <div className="hidden gap-2 md:flex">
          {links.map((item) => {
            const isActive = item.href === pathname;

            return (
              <Link
                key={item.href}
                className={`relative rounded-md px-4 py-1 text-sm no-underline duration-300 ease-in lg:text-base ${
                  isActive
                    ? "text-text-light-headerLight dark:text-text-dark-header"
                    : "text-text-light-body dark:text-text-dark-headerDark"
                }`}
                data-active={isActive}
                href={item.href}
                onClick={() => setDisableAnimation(true)}
                onMouseOver={() =>
                  !disableAnimation && setHoveredPath(item.href)
                }
                onMouseLeave={() =>
                  !disableAnimation && setHoveredPath(pathname)
                }
              >
                <span>{item.label}</span>
                {item.href === hoveredPath && !disableAnimation && (
                  <motion.div
                    className="absolute bottom-0 left-0 -z-10 h-full rounded-md bg-stone-200 dark:bg-stone-800/80"
                    layoutId="navbar"
                    // Only re-measure when the hovered link changes. The header
                    // is sticky, so a re-render after navigating (which scrolls
                    // to the top) would otherwise read as the highlight moving
                    // and make it spring back into place.
                    layoutDependency={hoveredPath}
                    aria-hidden="true"
                    style={{
                      width: "100%",
                    }}
                    transition={{
                      type: "spring",
                      bounce: 0.25,
                      stiffness: 130,
                      damping: 15,
                      duration: 0.05,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>

        <div className="ml-auto flex items-center gap-2 md:ml-0">
          <button
            type="button"
            aria-label="Open command menu"
            onClick={() =>
              window.dispatchEvent(new Event("command-palette:toggle"))
            }
            className="group flex h-8 w-8 items-center justify-center gap-1 rounded-lg border border-neutral-200 text-text-light-body transition duration-500 hover:border-neutral-400 hover:text-text-light-headerLight dark:border-neutral-800 dark:text-text-dark-headerDark dark:hover:border-neutral-600 dark:hover:text-text-dark-header md:w-auto md:px-2"
          >
            <MagnifyingGlassIcon className="h-5 w-5 md:hidden" />
            <kbd className="hidden h-5 w-5 items-center justify-center rounded bg-stone-200 dark:bg-stone-800/80 md:flex">
              <Command className="h-3 w-3" strokeWidth={2.5} />
            </kbd>
            <kbd className="hidden h-5 w-5 items-center justify-center rounded bg-stone-200 text-xs font-medium dark:bg-stone-800/80 md:flex">
              K
            </kbd>
          </button>
          <div className="flex h-8 w-8 items-center justify-center">
            <ThemeSwitcher />
          </div>
        </div>

        {/* Mobile menu bar */}
        <Popover ref={menuRef} className="relative md:hidden">
          {({ open, close }) => (
            <>
              {open && <CloseOnOutside rootRef={menuRef} close={close} />}
              <Popover.Button
                aria-label={open ? "Close menu" : "Open menu"}
                className="relative flex h-8 w-8 items-center justify-center rounded-lg text-text-light-body dark:text-text-dark-headerDark"
              >
                {/* Three bars that fold into an ✕ */}
                <span
                  aria-hidden
                  className={clsx(
                    menuLine,
                    open ? "rotate-45" : "-translate-y-[7px]",
                  )}
                />
                <span
                  aria-hidden
                  className={clsx(menuLine, open && "scale-x-0 opacity-0")}
                />
                <span
                  aria-hidden
                  className={clsx(
                    menuLine,
                    open ? "-rotate-45" : "translate-y-[7px]",
                  )}
                />
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition duration-200 ease-[cubic-bezier(0.16,1,0.3,1)]"
                enterFrom="opacity-0 scale-95 -translate-y-1"
                enterTo="opacity-100 scale-100 translate-y-0"
                leave="transition duration-150 ease-in"
                leaveFrom="opacity-100 scale-100 translate-y-0"
                leaveTo="opacity-0 scale-95 -translate-y-1"
              >
                <Popover.Panel className="bg-primary absolute right-0 z-10 mt-2 w-40 origin-top-right overflow-auto rounded-xl border border-neutral-400 bg-background-light p-2 text-base shadow-lg focus:outline-none dark:bg-background-dark sm:text-sm">
                  <div className="grid">
                    {links.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className={clsx(
                          "hover:text-primary rounded-md px-4 py-2 transition-colors",
                          pathname === link.href
                            ? "bg-gray-200 font-medium dark:bg-stone-800/80"
                            : "font-normal",
                        )}
                        onClick={() => {
                          close();
                          setDisableAnimation(true);
                        }}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </Popover.Panel>
              </Transition>
            </>
          )}
        </Popover>
      </nav>
    </header>
  );
}
