import { createContext, useContext, useState, useEffect } from "react";

interface SimpleModeContextType {
  simpleMode: boolean;
  toggleSimpleMode: () => void;
  setSimpleMode: (v: boolean) => void;
}

const SimpleModeContext = createContext<SimpleModeContextType>({
  simpleMode: false,
  toggleSimpleMode: () => {},
  setSimpleMode: () => {},
});

export function useSimpleMode() { return useContext(SimpleModeContext); }

export function SimpleModeProvider({ children }: { children: React.ReactNode }) {
  const [simpleMode, setSimpleModeState] = useState<boolean>(() => {
    return localStorage.getItem("nf_simple_mode") === "true";
  });

  const setSimpleMode = (v: boolean) => {
    setSimpleModeState(v);
    localStorage.setItem("nf_simple_mode", String(v));
    if (v) document.documentElement.classList.add("simple-mode");
    else   document.documentElement.classList.remove("simple-mode");
  };

  const toggleSimpleMode = () => setSimpleMode(!simpleMode);

  useEffect(() => {
    if (simpleMode) document.documentElement.classList.add("simple-mode");
    else            document.documentElement.classList.remove("simple-mode");
  }, [simpleMode]);

  return (
    <SimpleModeContext.Provider value={{ simpleMode, toggleSimpleMode, setSimpleMode }}>
      {children}
    </SimpleModeContext.Provider>
  );
}
