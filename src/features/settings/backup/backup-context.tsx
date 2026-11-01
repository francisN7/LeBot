import { createContext, type ReactNode, useContext } from 'react';

import type { BackupRepository } from '@/db/repositories';

import type { BackupService } from './service';

const BackupRepositoryContext = createContext<BackupRepository | null>(null);
const BackupServiceContext = createContext<BackupService | null>(null);

/** Injeta o repositório do banco (produção usa o padrão; testes, um fake). */
export function BackupRepositoryProvider({
  repository,
  children,
}: {
  repository: BackupRepository;
  children: ReactNode;
}) {
  return (
    <BackupRepositoryContext.Provider value={repository}>
      {children}
    </BackupRepositoryContext.Provider>
  );
}

/** Injeta a camada nativa (arquivos, seletor e compartilhamento). */
export function BackupServiceProvider({
  service,
  children,
}: {
  service: BackupService;
  children: ReactNode;
}) {
  return (
    <BackupServiceContext.Provider value={service}>
      {children}
    </BackupServiceContext.Provider>
  );
}

export function useBackupRepository(): BackupRepository {
  const repository = useContext(BackupRepositoryContext);

  if (!repository) {
    throw new Error('BackupRepositoryProvider ausente');
  }

  return repository;
}

export function useBackupService(): BackupService {
  const service = useContext(BackupServiceContext);

  if (!service) {
    throw new Error('BackupServiceProvider ausente');
  }

  return service;
}
