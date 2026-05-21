import { createContext, useContext, useState, ReactNode } from "react";
import type { VrprdlInstance, SolverJob } from "@workspace/api-client-react";

interface AppContextType {
  currentInstance: VrprdlInstance | null;
  currentJob: SolverJob | null;
  setCurrentInstance: (instance: VrprdlInstance | null) => void;
  setCurrentJob: (job: SolverJob | null) => void;
}

export const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentInstance, setCurrentInstance] = useState<VrprdlInstance | null>(null);
  const [currentJob, setCurrentJob] = useState<SolverJob | null>(null);

  return (
    <AppContext.Provider value={{ currentInstance, currentJob, setCurrentInstance, setCurrentJob }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
