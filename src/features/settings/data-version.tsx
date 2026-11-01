import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

type DataVersion = {
  version: number;
  bump: () => void;
};

const DataVersionContext = createContext<DataVersion | null>(null);

/**
 * Versão da árvore de dados. Restaurar um backup troca o banco inteiro; mudar
 * essa chave remonta a navegação e todos os hooks releem o banco.
 */
export function DataVersionProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const bump = useCallback(() => setVersion((current) => current + 1), []);
  const value = useMemo(() => ({ version, bump }), [version, bump]);

  return (
    <DataVersionContext.Provider value={value}>
      {children}
    </DataVersionContext.Provider>
  );
}

export function useDataVersion(): DataVersion {
  const value = useContext(DataVersionContext);

  if (!value) {
    throw new Error('DataVersionProvider ausente');
  }

  return value;
}
