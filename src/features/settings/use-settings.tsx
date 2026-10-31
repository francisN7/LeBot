import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useState,
} from 'react';
import type { SettingsRepository } from '@/db/repositories';
import { getSettingsRepository } from '@/db/repositories';

const SettingsRepositoryContext = createContext<SettingsRepository | null>(
  null,
);

/** Injeta um repositório (produção usa o padrão; testes usam um fake). */
export function SettingsRepositoryProvider({
  repository,
  children,
}: {
  repository: SettingsRepository;
  children: ReactNode;
}) {
  return (
    <SettingsRepositoryContext.Provider value={repository}>
      {children}
    </SettingsRepositoryContext.Provider>
  );
}

export function useSettingsRepository(): SettingsRepository {
  const injected = useContext(SettingsRepositoryContext);
  return injected ?? getSettingsRepository();
}

/** Valores persistidos em `settings`, com recarga após cada escrita. */
export function useSettings() {
  const repository = useSettingsRepository();
  const [values, setValues] = useState<Record<string, string>>(() =>
    repository.all(),
  );

  const refresh = useCallback(() => {
    setValues(repository.all());
  }, [repository]);

  const setValue = useCallback(
    (key: string, value: string) => {
      repository.set(key, value);
      setValues(repository.all());
    },
    [repository],
  );

  return { values, setValue, refresh, repository };
}
