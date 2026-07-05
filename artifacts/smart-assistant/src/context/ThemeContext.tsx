import React, { useEffect } from 'react';

// Force dark mode
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement;
    root.classList.add('dark');
  }, []);

  return <>{children}</>;
}
