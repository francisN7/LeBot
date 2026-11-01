import {
  Fredoka_600SemiBold,
  Fredoka_700Bold,
} from '@expo-google-fonts/fredoka';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import '../../global.css';
import { AppText } from '@/components/ui';
import { getDb } from '@/db/client';
import {
  getBackupRepository,
  getBooksRepository,
  getSettingsRepository,
} from '@/db/repositories';
import { seedIfEmpty } from '@/db/seed';
import type { DeviceDatabase } from '@/db/types';
import { CoverServiceProvider } from '@/features/library';
import { createDeviceCoverService } from '@/features/library/cover-service';
import {
  BackupRepositoryProvider,
  BackupServiceProvider,
  DataVersionProvider,
  useDataVersion,
} from '@/features/settings';
import { createDeviceBackupService } from '@/features/settings/backup/service';
import { colors } from '@/theme';
import migrations from '../../drizzle/migrations';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

type DatabaseState =
  | { db: DeviceDatabase; error: null }
  | { db: null; error: string };

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function openDatabase(): DatabaseState {
  try {
    return { db: getDb(), error: null };
  } catch (error) {
    return { db: null, error: messageOf(error) };
  }
}

function DatabaseError({ message }: { message: string }) {
  return (
    <View className="flex-1 items-center justify-center gap-sm bg-cream px-lg">
      <AppText variant="subtitle">Não foi possível abrir seus dados</AppText>
      <AppText variant="caption" tone="muted">
        {message}
      </AppText>
      <AppText variant="caption" tone="muted">
        Feche e abra o app de novo. Se continuar, os dados não foram apagados:
        anote esta mensagem.
      </AppText>
    </View>
  );
}

/** A navegação remonta quando a restauração troca o banco inteiro. */
function AppStack() {
  const { version } = useDataVersion();

  return (
    <Stack
      key={version}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.cream },
      }}
    />
  );
}

/** Roda as migrações e só então libera o app (a splash cobre a espera). */
function DatabaseBoot({
  db,
  fontsReady,
}: {
  db: DeviceDatabase;
  fontsReady: boolean;
}) {
  const { success, error } = useMigrations(db, migrations);
  const [seeded, setSeeded] = useState(false);
  const [coverService] = useState(createDeviceCoverService);
  const [backupService] = useState(createDeviceBackupService);

  useEffect(() => {
    if (!success) {
      return;
    }

    try {
      seedIfEmpty(getBooksRepository(), getSettingsRepository());
    } catch (seedError) {
      // Seed é conveniência: falhar aqui não impede o app de abrir.
      console.error('Falha ao popular o banco de exemplo', seedError);
    }
    setSeeded(true);
  }, [success]);

  const ready = success && seeded;
  const failed = Boolean(error);

  useEffect(() => {
    if (fontsReady && (ready || failed)) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsReady, ready, failed]);

  if (error) {
    return <DatabaseError message={error.message} />;
  }

  if (!ready) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <CoverServiceProvider service={coverService}>
          <BackupRepositoryProvider repository={getBackupRepository()}>
            <BackupServiceProvider service={backupService}>
              <DataVersionProvider>
                <AppStack />
              </DataVersionProvider>
            </BackupServiceProvider>
          </BackupRepositoryProvider>
        </CoverServiceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Fredoka_600SemiBold,
    Fredoka_700Bold,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [database] = useState(openDatabase);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  if (database.db === null) {
    return <DatabaseError message={database.error} />;
  }

  return (
    <DatabaseBoot
      db={database.db}
      fontsReady={fontsLoaded || Boolean(fontError)}
    />
  );
}
