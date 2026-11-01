import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { SettingsRepository } from '@/db/repositories';
import { getSettingsRepository } from '@/db/repositories';

const SettingsRepositoryContext = createContext<SettingsRepository | null>(
  null,
);

/**
 * Assinaturas por repositório, no mesmo padrão de `useBooks`: salvar a meta em
 * Ajustes atualiza a Hoje sem esperar a próxima navegação.
 */
const subscribers = new WeakMap<SettingsRepository, Set<() => void>>();

function subscribe(repository: SettingsRepository, listener: () => void) {
  const listeners = subscribers.get(repository) ?? new Set<() => void>();
  subscribers.set(repository, listeners);
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
}

function notify(repository: SettingsRepository): void {
  for (const listener of subscribers.get(repository) ?? []) {
    listener();
  }
}

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

  useEffect(() => subscribe(repository, refresh), [repository, refresh]);

  const setValue = useCallback(
    (key: string, value: string) => {
      repository.set(key, value);
      notify(repository);
      setValues(repository.all());
    },
    [repository],
  );

  return { values, setValue, refresh, repository };
}
