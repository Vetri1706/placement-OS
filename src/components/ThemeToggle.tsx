import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const THEME_KEY = "theme";

const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  root.classList.toggle("light", theme === "light");
};

const getSystemTheme = (): Theme =>
  window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    let saved: unknown;
    try {
      saved = window.appStore?.get?.(THEME_KEY);
    } catch {
      saved = undefined;
    }

    const initialTheme: Theme = saved === "light" || saved === "dark" ? saved : getSystemTheme();

    applyTheme(initialTheme);
    setTheme(initialTheme);

    if (saved === "light" || saved === "dark") {
      return;
    }

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemThemeChange = (event: MediaQueryListEvent) => {
      const nextTheme: Theme = event.matches ? "dark" : "light";
      applyTheme(nextTheme);
      setTheme(nextTheme);
    };

    mediaQuery.addEventListener("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener("change", handleSystemThemeChange);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(nextTheme);
    try {
      window.appStore?.set?.(THEME_KEY, nextTheme);
    } catch {
      /* ignore */
    }
    setTheme(nextTheme);
  };

  const isLight = theme === "light";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
      title={`Switch to ${isLight ? "dark" : "light"} mode`}
      className="relative inline-flex h-7 w-12 items-center rounded-full border border-border bg-muted transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="absolute left-1.5 text-foreground/60">
        <Sun className="h-3 w-3" />
      </span>
      <span className="absolute right-1.5 text-foreground/60">
        <Moon className="h-3 w-3" />
      </span>
      <span
        className={`absolute top-0.5 left-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-background text-foreground shadow transition-transform duration-300 ${
          isLight ? "translate-x-5" : "translate-x-0"
        }`}
      >
        {isLight ? <Moon className="h-3.5 w-3.5" /> : <Sun className="h-3.5 w-3.5" />}
      </span>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}