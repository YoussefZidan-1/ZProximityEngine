import { createContext, useContext } from "react";

const ProximityContext = createContext({
  defaultFont: "'Georama', sans-serif",
});

export const ProximityProvider = ({ children, config }) => {
  return (
    <ProximityContext.Provider value={{ ...config }}>
      {children}
    </ProximityContext.Provider>
  );
};

export const useProximityConfig = () => useContext(ProximityContext);