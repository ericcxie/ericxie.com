"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

import { MoonIcon } from "@heroicons/react/20/solid";
import {
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  SunIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { Calculator, CalendarClock } from "lucide-react";
import moment from "moment";
import { useTheme } from "next-themes";
import { FaXTwitter } from "react-icons/fa6";
import { IoLogoGithub, IoLogoLinkedin } from "react-icons/io5";

import { cn } from "@/utils/cn";
import type { PostItem } from "@/types";

/**
 * Safely evaluate a basic arithmetic expression (+, -, *, /, %, ^, parens)
 * with a small recursive-descent parser — no eval / Function.
 * Returns null when the input isn't a valid, operator-containing expression.
 */
function evalMath(input: string): number | null {
  const s = input.trim();
  if (!/^[0-9+\-*/%.()\s^]+$/.test(s)) return null;
  if (!/[0-9]/.test(s)) return null;
  if (!/[+\-*/%^]/.test(s)) return null; // require an operator, so "5" alone isn't a result

  let pos = 0;
  const skipWs = () => {
    while (pos < s.length && /\s/.test(s[pos])) pos++;
  };

  const parseExpression = (): number => {
    let value = parseTerm();
    skipWs();
    while (s[pos] === "+" || s[pos] === "-") {
      const op = s[pos++];
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
      skipWs();
    }
    return value;
  };

  const parseTerm = (): number => {
    let value = parseFactor();
    skipWs();
    while (s[pos] === "*" || s[pos] === "/" || s[pos] === "%") {
      const op = s[pos++];
      const rhs = parseFactor();
      value = op === "*" ? value * rhs : op === "/" ? value / rhs : value % rhs;
      skipWs();
    }
    return value;
  };

  const parseFactor = (): number => {
    const base = parseUnary();
    skipWs();
    if (s[pos] === "^") {
      pos++;
      return Math.pow(base, parseFactor()); // right-associative
    }
    return base;
  };

  const parseUnary = (): number => {
    skipWs();
    if (s[pos] === "-") {
      pos++;
      return -parseUnary();
    }
    if (s[pos] === "+") {
      pos++;
      return parseUnary();
    }
    return parsePrimary();
  };

  const parsePrimary = (): number => {
    skipWs();
    if (s[pos] === "(") {
      pos++;
      const value = parseExpression();
      skipWs();
      if (s[pos] !== ")") throw new Error("unbalanced");
      pos++;
      return value;
    }
    const start = pos;
    while (pos < s.length && /[0-9.]/.test(s[pos])) pos++;
    if (pos === start) throw new Error("expected number");
    return parseFloat(s.slice(start, pos));
  };

  try {
    const result = parseExpression();
    skipWs();
    if (pos !== s.length) return null; // trailing garbage
    return isFinite(result) ? result : null;
  } catch {
    return null;
  }
}

// Trim floating-point noise and add thousands separators.
function formatNumber(n: number): string {
  const rounded = Math.round((n + Number.EPSILON) * 1e10) / 1e10;
  return rounded.toLocaleString("en-US", { maximumFractionDigits: 10 });
}

type CommandItem = {
  id: string;
  label: string;
  section: string;
  keywords?: string[];
  icon: React.ReactNode;
  perform: () => void;
  subtitle?: string;
  closeOnSelect?: boolean;
};

export default function CommandPalette({
  posts = [],
}: {
  posts?: PostItem[];
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();

  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  const copy = useCallback((text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(null), 1200);
  }, []);

  const items = useMemo<CommandItem[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      close();
    };

    const openExternal = (url: string) => () => {
      window.open(url, "_blank", "noopener,noreferrer");
      close();
    };

    return [
      {
        id: "nav-about",
        label: "About",
        section: "Navigation",
        keywords: ["home", "index"],
        icon: <UserIcon className="h-5 w-5" />,
        perform: go("/"),
      },
      {
        id: "nav-blog",
        label: "Blog",
        section: "Navigation",
        keywords: ["posts", "writing", "articles"],
        icon: <DocumentTextIcon className="h-5 w-5" />,
        perform: go("/blog"),
      },
      {
        id: "nav-photos",
        label: "Photos",
        section: "Navigation",
        keywords: ["gallery", "pictures"],
        icon: <PhotoIcon className="h-5 w-5" />,
        perform: go("/photos"),
      },
      ...posts.map<CommandItem>((post) => ({
        id: `post-${post.id}`,
        label: post.title,
        section: "Blog Posts",
        keywords: [post.category],
        icon: <DocumentTextIcon className="h-5 w-5" />,
        subtitle: moment(post.date, "MM-DD-YYYY").format("MMM D, YYYY"),
        perform: go(`/blog/${post.id}`),
      })),
      {
        id: "social-linkedin",
        label: "LinkedIn",
        section: "Socials",
        keywords: ["connect", "profile"],
        icon: <IoLogoLinkedin className="h-5 w-5" />,
        perform: openExternal("https://www.linkedin.com/in/ericcxie"),
      },
      {
        id: "social-github",
        label: "GitHub",
        section: "Socials",
        keywords: ["code", "repos"],
        icon: <IoLogoGithub className="h-5 w-5" />,
        perform: openExternal("https://github.com/ericcxie"),
      },
      {
        id: "social-x",
        label: "X / Twitter",
        section: "Socials",
        keywords: ["tweet", "twitter"],
        icon: <FaXTwitter className="h-5 w-5" />,
        perform: openExternal("https://x.com/ericxxie"),
      },
      {
        id: "toggle-theme",
        label:
          resolvedTheme === "dark"
            ? "Switch to light mode"
            : "Switch to dark mode",
        section: "General",
        keywords: ["dark", "light", "theme", "appearance"],
        icon:
          resolvedTheme === "dark" ? (
            <SunIcon className="h-5 w-5" />
          ) : (
            <MoonIcon className="h-5 w-5" />
          ),
        perform: () => {
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
          close();
        },
      },
    ];
  }, [router, resolvedTheme, setTheme, close, posts]);

  // Computed, query-driven results (calculator, date) — Raycast style.
  const dynamicItems = useMemo<CommandItem[]>(() => {
    const q = query.trim();
    if (!q) return [];
    const results: CommandItem[] = [];

    const math = evalMath(q);
    if (math !== null) {
      const formatted = formatNumber(math);
      results.push({
        id: "calc",
        label: formatted,
        section: "Calculator",
        subtitle: "Copy answer",
        icon: <Calculator className="h-5 w-5" />,
        perform: () => copy(formatted),
      });
    }

    if (/^(date|time|now|today)$/i.test(q)) {
      const value = moment().format("dddd, MMMM D, YYYY · h:mm A");
      results.push({
        id: "date",
        label: value,
        section: "Date & Time",
        subtitle: "Copy",
        icon: <CalendarClock className="h-5 w-5" />,
        perform: () => copy(value),
      });
    }

    return results;
  }, [query, copy]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    const matches = items.filter((item) => {
      const haystack = [item.label, item.section, ...(item.keywords ?? [])]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
    return [...dynamicItems, ...matches];
  }, [items, query, dynamicItems]);

  // Group filtered results by section while preserving order.
  const sections = useMemo(() => {
    const order: string[] = [];
    const map = new Map<string, CommandItem[]>();
    filtered.forEach((item) => {
      if (!map.has(item.section)) {
        map.set(item.section, []);
        order.push(item.section);
      }
      map.get(item.section)!.push(item);
    });
    return order.map((section) => ({
      section,
      items: map.get(section)!,
    }));
  }, [filtered]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Global ⌘K / Ctrl+K listener.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    const onToggle = () => setOpen((prev) => !prev);
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("command-palette:toggle", onToggle);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("command-palette:toggle", onToggle);
    };
  }, []);

  // Focus input and lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 10);
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = overflow;
    };
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      close();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) =>
        filtered.length ? (i - 1 + filtered.length) % filtered.length : 0,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[activeIndex]?.perform();
    }
  };

  // Keep the active item scrolled into view.
  useEffect(() => {
    if (!open) return;
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${activeIndex}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-start justify-center px-4 pt-[18vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={close}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/30 backdrop-blur-md dark:bg-black/50" />

          {/* Panel */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Command menu"
            className="relative w-full max-w-[560px] overflow-hidden rounded-2xl border border-black/10 bg-background-light/90 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-background-dark/85"
            initial={{ opacity: 0, scale: 0.96, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -6 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            onMouseDown={(e) => e.stopPropagation()}
            onKeyDown={onKeyDown}
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-black/10 px-4 dark:border-white/10">
              <MagnifyingGlassIcon className="h-5 w-5 shrink-0 text-text-light-body dark:text-text-dark-headerDark" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="w-full bg-transparent py-4 text-base text-text-light-header outline-none placeholder:text-text-light-body dark:text-text-dark-header dark:placeholder:text-text-dark-headerDark"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden h-5 shrink-0 items-center justify-center rounded bg-stone-200 px-1.5 text-xs font-medium text-text-light-body dark:bg-stone-800/80 dark:text-text-dark-headerDark sm:flex">
                Esc
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={listRef}
              className="max-h-[min(60vh,380px)] overflow-y-auto p-2"
            >
              {sections.length === 0 ? (
                <div className="px-3 py-8 text-center text-sm text-text-light-body dark:text-text-dark-headerDark">
                  No results found.
                </div>
              ) : (
                sections.map(({ section, items: sectionItems }) => (
                  <div key={section} className="mb-1 last:mb-0">
                    <div className="px-3 pb-1 pt-2 text-xs font-medium uppercase tracking-wide text-text-light-body dark:text-text-dark-headerDark">
                      {section}
                    </div>
                    {sectionItems.map((item) => {
                      const index = filtered.indexOf(item);
                      const isActive = index === activeIndex;
                      return (
                        <button
                          key={item.id}
                          data-index={index}
                          onMouseMove={() => setActiveIndex(index)}
                          onClick={() => item.perform()}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors",
                            isActive
                              ? "bg-stone-200 text-text-light-header dark:bg-stone-800/80 dark:text-text-dark-header"
                              : "text-text-light-headerLight dark:text-text-dark-body",
                          )}
                        >
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center">
                            {item.icon}
                          </span>
                          <span className="flex-grow truncate">
                            {item.label}
                          </span>
                          {item.subtitle && (
                            <span className="shrink-0 text-xs text-text-light-body dark:text-text-dark-headerDark">
                              {copied === item.label ? "Copied!" : item.subtitle}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
