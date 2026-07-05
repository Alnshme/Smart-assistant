import React, { createContext, useContext } from 'react';
import { useLocalStorage } from 'usehooks-ts';

interface AppContextType {
  apiKey: string;
  setApiKey: (key: string) => void;
  totalTokens: number;
  addTokens: (tokens: number) => void;
  resetTokens: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [apiKey, setApiKey] = useLocalStorage('nara_api_key', '');
  const [totalTokens, setTotalTokens] = useLocalStorage('total_tokens', 0);

  const addTokens = (tokens: number) => {
    setTotalTokens((prev) => prev + tokens);
  };

  const resetTokens = () => {
    setTotalTokens(0);
  };

  return (
    <AppContext.Provider value={{ apiKey, setApiKey, totalTokens, addTokens, resetTokens }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
