import { type RenderOptions, render } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import type {
  BooksRepository,
  GenresRepository,
  ReadingSessionsRepository,
  SettingsRepository,
} from '@/db/repositories';
import { GenresRepositoryProvider } from '@/features/genres';
import {
  BooksRepositoryProvider,
  CoverServiceProvider,
} from '@/features/library';
import { ReadingSessionsRepositoryProvider } from '@/features/reading';
import { SettingsRepositoryProvider } from '@/features/settings';
import type { CoverService } from '@/lib/covers';

import { createFakeCoverService } from './covers';
import {
  createInMemoryBooksRepository,
  createInMemoryGenresRepository,
  createInMemoryReadingSessionsRepository,
  createInMemorySettingsRepository,
  testGenreRows,
} from './repositories';

const metrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, left: 0, right: 0, bottom: 34 },
};

type RenderWithProvidersOptions = Omit<RenderOptions, 'wrapper'> & {
  booksRepository?: BooksRepository;
  genresRepository?: GenresRepository;
  readingRepository?: ReadingSessionsRepository;
  settingsRepository?: SettingsRepository;
  coverService?: CoverService;
};

/**
 * Renderiza com o SafeAreaProvider e os repositórios que as telas esperam.
 * Por padrão usa repositórios em memória com os dados do seed e uma capa fake.
 */
export function renderWithProviders(
  ui: ReactElement,
  {
    booksRepository = createInMemoryBooksRepository(),
    genresRepository = createInMemoryGenresRepository(
      testGenreRows,
      (genreId) =>
        booksRepository.list().filter((book) => book.genreId === genreId)
          .length,
    ),
    readingRepository = createInMemoryReadingSessionsRepository(
      booksRepository,
    ),
    settingsRepository = createInMemorySettingsRepository(),
    coverService = createFakeCoverService(),
    ...options
  }: RenderWithProvidersOptions = {},
) {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <SafeAreaProvider initialMetrics={metrics}>
      <BooksRepositoryProvider repository={booksRepository}>
        <GenresRepositoryProvider repository={genresRepository}>
          <ReadingSessionsRepositoryProvider repository={readingRepository}>
            <SettingsRepositoryProvider repository={settingsRepository}>
              <CoverServiceProvider service={coverService}>
                {children}
              </CoverServiceProvider>
            </SettingsRepositoryProvider>
          </ReadingSessionsRepositoryProvider>
        </GenresRepositoryProvider>
      </BooksRepositoryProvider>
    </SafeAreaProvider>
  );

  return render(ui, { wrapper, ...options });
}
