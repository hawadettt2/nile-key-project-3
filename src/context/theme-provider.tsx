"use client"

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react"

type Theme = "dark" | "light"

interface ThemeProviderState {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: "dark",
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  storageKey = "vite-ui-theme",
}: {
  children: ReactNode
  defaultTheme?: Theme
  storageKey?: string
}) {
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    // This runs once on the client after hydration
    let storedTheme: Theme;
    try {
      storedTheme = (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    } catch (e) {
      storedTheme = defaultTheme;
    }
    if (storedTheme && ['light', 'dark'].includes(storedTheme)) {
        setTheme(storedTheme);
    }
  }, [defaultTheme, storageKey]);

  useEffect(() => {
    // This runs whenever the theme state changes
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    try {
      localStorage.setItem(storageKey, theme);
    } catch (e) {
      console.error("Failed to save theme to localStorage", e);
    }
  }, [theme, storageKey]);

  const value = {
    theme,
    setTheme,
  }

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider")

  return context
}
