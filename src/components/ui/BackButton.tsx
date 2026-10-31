import { Pressable } from 'react-native';

import { AppText } from './AppText';

type BackButtonProps = {
  onPress: () => void;
  label?: string;
};

/**
 * Voltar de tela cheia, alinhado à esquerda. Ocupa a largura toda para o texto
 * não quebrar em "Volta"/"r" no Android (bug de medição com largura justa).
 */
export function BackButton({ onPress, label = 'Voltar' }: BackButtonProps) {
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      className="w-full flex-row items-center py-xs active:opacity-80"
      hitSlop={8}
      onPress={onPress}
    >
      <AppText numberOfLines={1} variant="label">
        {label}
      </AppText>
    </Pressable>
  );
}
