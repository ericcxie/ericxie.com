import clsx from "clsx";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

import { MoonIcon } from "@heroicons/react/20/solid";
import { SunIcon } from "@heroicons/react/24/outline";

export default function ThemeSwitcher() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    // Reserve the button's footprint so it doesn't pop in on hydration.
    return (
      <div className="border-text-text-light-body dark:border-text-dark-headerDark h-8 w-8 rounded-lg border" />
    );
  }

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const iconClassName = clsx(
    "w-5 h-5 text-text-light-body group-hover:text-text-light-headerLight dark:text-text-dark-headerDark dark:group-hover:text-text-dark-header cursor-pointer transition duration-500",
  );

  return (
    <div className="group relative">
      <button
        onClick={toggleTheme}
        className={clsx(
          "border-text-text-light-body group-hover:border-text-light-headerLight dark:border-text-dark-headerDark relative flex h-8 w-8 cursor-default items-center justify-center rounded-lg border transition duration-500 dark:group-hover:border-text-dark-header",
        )}
      >
        {resolvedTheme === "dark" ? (
          <SunIcon className={iconClassName} />
        ) : (
          <MoonIcon className={iconClassName} />
        )}
      </button>
    </div>
  );
}
