"use client";

import { useEffect } from "react";
import { useEyeTurnStore } from "@/lib/store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const darkMode = useEyeTurnStore((s) => s.settings.darkMode);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  return <>{children}</>;
}
