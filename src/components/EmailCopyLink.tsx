"use client";

import { useEffect, useRef, useState } from "react";

const EMAIL = "pexie@uwaterloo.ca";

// Shows the address by default; pass label/className to render it as a plain link
export default function EmailCopyLink({
  label = EMAIL,
  className = "cursor-pointer border-b-[2px] border-neutral-600 bg-transparent p-0 transition duration-500 hover:border-neutral-800 dark:hover:border-neutral-500",
}: {
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(resetTimer.current);
  }, []);

  const copyEmail = async () => {
    const copyWithFallback = () => {
      const textarea = document.createElement("textarea");
      textarea.value = EMAIL;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      const didCopy = document.execCommand("copy");
      textarea.remove();
      return didCopy;
    };

    let didCopy = false;

    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(EMAIL);
        didCopy = true;
      } else {
        didCopy = copyWithFallback();
      }
    } catch {
      didCopy = copyWithFallback();
    }

    setCopied(didCopy);
    clearTimeout(resetTimer.current);
    if (didCopy) resetTimer.current = setTimeout(() => setCopied(false), 2000);
  };

  return (
    <span className="relative inline-block">
      <button
        type="button"
        onClick={copyEmail}
        className={className}
        aria-label={`Copy ${EMAIL} to clipboard`}
        title="Copy email address"
      >
        {label}
      </button>
      <span
        role="status"
        className={`pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-md bg-neutral-900 px-2 py-1 text-xs text-white shadow-sm transition-all duration-150 dark:bg-neutral-100 dark:text-neutral-900 ${
          copied ? "translate-y-0 opacity-100" : "translate-y-1 opacity-0"
        }`}
      >
        Copied
      </span>
    </span>
  );
}
