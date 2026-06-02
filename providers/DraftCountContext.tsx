import { createContext, useContext, useState, type ReactNode } from "react";

interface DraftCountContextValue {
  draftCount: number;
  setDraftCount: (count: number) => void;
}

const DraftCountContext = createContext<DraftCountContextValue>({
  draftCount: 0,
  setDraftCount: () => {},
});

export function DraftCountProvider({ children }: { children: ReactNode }) {
  const [draftCount, setDraftCount] = useState(0);
  return (
    <DraftCountContext.Provider value={{ draftCount, setDraftCount }}>
      {children}
    </DraftCountContext.Provider>
  );
}

export function useDraftCount() {
  return useContext(DraftCountContext);
}
