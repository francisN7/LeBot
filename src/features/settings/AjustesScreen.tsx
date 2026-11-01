import Constants from 'expo-constants';
import type { ReactNode } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Chip, Screen } from '@/components/ui';
import { useGenres } from '@/features/genres';

import { BackupCard } from './BackupCard';
import { ComingSoonCard } from './ComingSoonCard';
import { useDataVersion } from './data-version';
import { GoalCard } from './GoalCard';
import { ReviewFieldsCard } from './ReviewFieldsCard';

const appVersion = Constants.expoConfig?.version ?? '0.1.0';

type AjustesScreenProps = {
  onOpenGenres?: () => void;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-sm">
      <AppText variant="subtitle">{title}</AppText>
      {children}
    </View>
  );
}

export function AjustesScreen({ onOpenGenres }: AjustesScreenProps = {}) {
  const { genres } = useGenres();
  const { bump } = useDataVersion();

  return (
    <Screen>
      <View className="gap-xs">
        <AppText variant="display">Ajustes</AppText>
        <AppText tone="muted">Do seu jeito, sem culpa.</AppText>
      </View>

      <Section title="Leitura">
        <GoalCard />
        <ComingSoonCard
          description="Um toque no horário certo precisa de notificações do sistema. O LêBot só entra quando isso funcionar de verdade."
          title="Lembrete"
        />
        <ComingSoonCard
          description="O tema escuro e os temas extras chegam depois; por enquanto o LêBot fica no claro."
          title="Aparência"
        />
      </Section>

      <Section title="Organização">
        <Card className="gap-xs">
          <View className="flex-row items-center justify-between gap-sm">
            <AppText variant="bodyStrong">Gêneros</AppText>
            <Chip
              label={
                genres.length === 1 ? '1 gênero' : `${genres.length} gêneros`
              }
            />
          </View>
          <AppText tone="muted" variant="caption">
            Nome e cor de cada prateleira. A cor vale na lombada e na fita.
          </AppText>
          <Button
            label="Gerenciar gêneros"
            onPress={onOpenGenres}
            size="sm"
            variant="secondary"
          />
        </Card>

        <ReviewFieldsCard />
      </Section>

      <Section title="Dados">
        <BackupCard onRestored={bump} />
      </Section>

      <Section title="Sobre">
        <Card className="gap-xs">
          <AppText variant="bodyStrong">Sobre o LêBot</AppText>
          <AppText tone="muted" variant="caption">
            Versão {appVersion}. Seus dados ficam neste aparelho.
          </AppText>
          <AppText tone="muted" variant="caption">
            Feito para quem quer ler mais sem ressaca literária.
          </AppText>
        </Card>
      </Section>
    </Screen>
  );
}
