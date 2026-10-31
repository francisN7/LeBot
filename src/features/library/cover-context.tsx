import { createContext, type ReactNode, useContext } from 'react';

import type { CoverService } from '@/lib/covers';

const CoverServiceContext = createContext<CoverService | null>(null);

/** Injeta a implementação de capa (aparelho no app, fake nos testes). */
export function CoverServiceProvider({
  service,
  children,
}: {
  service: CoverService;
  children: ReactNode;
}) {
  return (
    <CoverServiceContext.Provider value={service}>
      {children}
    </CoverServiceContext.Provider>
  );
}

export function useCoverService(): CoverService {
  const service = useContext(CoverServiceContext);

  if (!service) {
    throw new Error('CoverServiceProvider ausente');
  }

  return service;
}
