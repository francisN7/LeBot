import { View } from 'react-native';

import { AppText, Button, Card } from '@/components/ui';
import type { Book } from '@/features/library/types';

import { formatReadDate, type ReadingSession, readingPercent } from './types';

type ReadingProgressCardProps = {
  book: Book;
  sessions: ReadingSession[];
  onRegister: () => void;
  onUndo: (session: ReadingSession) => void;
};

/**
 * Progresso do livro + últimas leituras. Barra e botão ficam no mesmo card
 * para o registro estar sempre a um toque no detalhe.
 */
export function ReadingProgressCard({
  book,
  sessions,
  onRegister,
  onUndo,
}: ReadingProgressCardProps) {
  const remaining = Math.max(0, book.pages - book.pagesRead);
  const percent = readingPercent(book.pagesRead, book.pages);
  const atEnd = remaining === 0;
  const finished = book.status === 'finished';
  const recent = sessions.slice(0, 3);

  return (
    <Card className="gap-sm" testID="progresso-card">
      <View className="flex-row items-baseline justify-between">
        <AppText variant="label">Progresso</AppText>
        <AppText variant="caption" tone="muted">
          {percent}%
        </AppText>
      </View>

      <View
        accessibilityLabel={`Progresso: ${percent}%`}
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: book.pages, now: book.pagesRead }}
        className="h-3 overflow-hidden rounded-pill border-2 border-navy bg-cream"
        testID="progresso-barra"
      >
        <View
          className="h-full rounded-pill bg-teal"
          style={{ width: `${percent}%` }}
        />
      </View>

      <AppText variant="bodyStrong">{book.pagesRead} páginas lidas</AppText>

      {finished ? (
        <AppText variant="caption" tone="accent">
          Livro concluído.
        </AppText>
      ) : atEnd ? (
        <AppText variant="caption" tone="accent">
          No fim do livro. Reduza as páginas lidas ou desfaça uma sessão para
          continuar.
        </AppText>
      ) : (
        <AppText variant="caption" tone="muted">
          {remaining === 1
            ? 'Falta 1 página para o fim.'
            : `Faltam ${remaining} páginas para o fim.`}
        </AppText>
      )}

      {finished || atEnd ? null : (
        <Button label="Registrar leitura" onPress={onRegister} size="sm" />
      )}

      {recent.length > 0 ? (
        <View className="gap-xs">
          <AppText variant="label" tone="muted">
            Últimas leituras
          </AppText>
          {recent.map((session) => (
            <View
              className="flex-row items-center justify-between gap-sm"
              key={session.id}
            >
              <AppText variant="caption">
                {formatReadDate(session.readAt)} · {session.pages} pág.
              </AppText>
              <Button
                label="Desfazer"
                onPress={() => onUndo(session)}
                size="sm"
                variant="ghost"
              />
            </View>
          ))}
        </View>
      ) : (
        <AppText variant="caption" tone="muted">
          Nenhum registro ainda.
        </AppText>
      )}
    </Card>
  );
}
