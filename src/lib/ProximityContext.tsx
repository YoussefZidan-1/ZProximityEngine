import React, { createContext, useContext, ReactNode } from "react";

export interface GlobalProximityConfig {
  defaultFont?: string;
}

const ProximityContext = createContext<GlobalProximityConfig>({
  defaultFont: "'Georama', sans-serif",
});

interface ProximityProviderProps {
  children: ReactNode;
  config?: GlobalProximityConfig;
}

export const ProximityProvider: React.FC<ProximityProviderProps> = ({ children, config }) => {
  return (
    <ProximityContext.Provider value={{ ...config }}>
      {children}
    </ProximityContext.Provider>
  );
};

export const useProximityConfig = () => useContext(ProximityContext);