"use client";

import {
  createContext,
  createElement,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";

type ThemeMode = "dark" | "light";

type ThemeContextValue = {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

const STORAGE_KEY = "bh_theme_mode";

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  setMode: () => undefined,
  toggleMode: () => undefined
});

function applyTheme(mode: ThemeMode) {
  document.documentElement.dataset.theme = mode;
  document.documentElement.style.colorScheme = mode;
}

function getPreferredTheme(): ThemeMode {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") {
    return stored;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [mode, setMode] = useState<ThemeMode>("light");

  useEffect(() => {
    const nextMode = getPreferredTheme();
    setMode(nextMode);
    applyTheme(nextMode);
  }, []);

  useEffect(() => {
    applyTheme(mode);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      setMode(nextMode) {
        setMode(nextMode);
      },
      toggleMode() {
        setMode((current) => (current === "dark" ? "light" : "dark"));
      }
    }),
    [mode]
  );

  return createElement(ThemeContext.Provider, { value }, children);
}

export function useThemeMode() {
  return useContext(ThemeContext);
}

