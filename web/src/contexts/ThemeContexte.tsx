import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'dark' | 'light';
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({
  theme: 'dark', toggleTheme: () => {}
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() =>
    (localStorage.getItem('miaina-theme') as Theme) || 'dark'
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('miaina-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);