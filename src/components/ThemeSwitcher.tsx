import clsx from "clsx";
import { useTheme } from "next-themes";

import { MoonIcon } from "@heroicons/react/20/solid";
import { SunIcon } from "@heroicons/react/24/outline";

export default function ThemeSwitcher() {
  const { setTheme, resolvedTheme } = useTheme();

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
        aria-label="Toggle theme"
        className={clsx(
          "relative flex h-8 w-8 cursor-default items-center justify-center rounded-lg border border-neutral-200 transition duration-500 group-hover:border-neutral-400 dark:border-neutral-800 dark:group-hover:border-neutral-600",
        )}
      >
        {/* Both icons render from the server; the `dark` class that
            next-themes puts on <html> before first paint picks which one
            shows, so the icon doesn't wait for hydration */}
        <SunIcon className={clsx(iconClassName, "hidden dark:block")} />
        <MoonIcon className={clsx(iconClassName, "dark:hidden")} />
      </button>
    </div>
  );
}
