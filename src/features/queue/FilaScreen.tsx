import { Alert, View } from 'react-native';

import { AppText, Button, Card, Chip, Screen, Spine } from '@/components/ui';
import { colorForGenre, findBookById, genreLabel } from '@/features/library';
import { sizes } from '@/theme';
import { queue } from './__fixtures__/queue';

export function FilaScreen() {
  const [nextItem, ...rest] = queue;
  const nextBook = nextItem ? findBookById(nextItem.bookId) : undefined;

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="display">Fila</AppText>
        <AppText tone="muted">
          {queue.length} livros esperando a sua vez
        </AppText>
      </View>

      {nextItem && nextBook ? (
        <Card className="gap-md">
          <AppText variant="label" tone="accent">
            Próxima parada
          </AppText>
          <View className="flex-row gap-md">
            <Spine
              color={colorForGenre(nextBook.genre)}
              title={nextBook.title}
              width={sizes.spineCompact.width}
              height={sizes.spineCompact.height}
              showLabel={false}
            />
            <View className="flex-1 justify-center gap-xs">
              <AppText variant="subtitle">{nextBook.title}</AppText>
              <AppText variant="caption" tone="muted">
                {nextBook.author} · {genreLabel[nextBook.genre]}
              </AppText>
              <AppText variant="caption">{nextItem.note}</AppText>
            </View>
          </View>
          <View className="flex-row items-center justify-between">
            <Chip label={`${nextItem.plannedPages} páginas hoje`} />
            <Button
              label="Começar"
              size="sm"
              onPress={() =>
                Alert.alert('Em breve', 'A sessão de leitura chega na S5.')
              }
            />
          </View>
        </Card>
      ) : null}

      <View className="gap-sm">
        <AppText variant="subtitle">Depois</AppText>
        {rest.map((item, index) => {
          const book = findBookById(item.bookId);
          if (!book) {
            return null;
          }

          return (
            <Card className="flex-row items-center gap-md" key={item.bookId}>
              <AppText variant="title">{index + 2}</AppText>
              <View className="flex-1 gap-xs">
                <AppText variant="bodyStrong">{book.title}</AppText>
                <AppText variant="caption" tone="muted">
                  {item.note}
                </AppText>
              </View>
              <Chip label={`${item.plannedPages} pág.`} />
            </Card>
          );
        })}
      </View>
    </Screen>
  );
}
