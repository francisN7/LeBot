import { Pressable, StyleSheet, View } from 'react-native';
import { twMerge } from 'tailwind-merge';

import { AppText } from '@/components/ui/AppText';
import { SpineArtwork } from '@/components/ui/SpineArtwork';
import { resolveSpineArt } from '@/features/library/spine-art';
import type { ReadingStatus } from '@/features/library/types';
import { colors, opacities, radii, sizes } from '@/theme';

type SpineProps = {
  title: string;
  /** Cor de gênero vinda do banco (`genreById`), nunca uma lista fixa. */
  color: string;
  /**
   * Status de leitura. Com status a lombada é a arte 3D (rosto por status);
   * sem status fica o bloco 2D usado como fallback.
   */
  status?: ReadingStatus;
  width?: number;
  height?: number;
  onPress?: () => void;
  /** Esconde a etiqueta quando o título já aparece ao lado da lombada. */
  showLabel?: boolean;
  className?: string;
  testID?: string;
};

/**
 * Lombada do livro. A arte é vetorial e paramétrica: a cor vem do gênero e a
 * expressão do rosto do status (`resolveSpineArt`). Sem status, ou com hex
 * inválido, desenha o bloco 2D com etiqueta.
 *
 * A etiqueta de título fica sobre `cream` opaco para o texto pequeno não
 * disputar contraste com o rosto e o brilho da lombada.
 */
export function Spine({
  title,
  color,
  status,
  width = sizes.spine.width,
  height = sizes.spine.height,
  onPress,
  showLabel = true,
  className,
  testID,
}: SpineProps) {
  const art = resolveSpineArt({ color, status });

  return (
    <Pressable
      accessibilityLabel={`Lombada de ${title}`}
      accessibilityRole={onPress ? 'button' : 'image'}
      className={twMerge(
        'overflow-hidden border-2 border-navy active:opacity-80',
        className,
      )}
      disabled={!onPress}
      onPress={onPress}
      style={{
        backgroundColor: art.kind === 'art' ? art.palette.base : art.color,
        width,
        height,
        borderRadius: radii.md,
      }}
      testID={testID}
    >
      {art.kind === 'art' ? (
        <View
          pointerEvents="none"
          style={StyleSheet.absoluteFill}
          testID={testID ? `${testID}-art` : undefined}
        >
          <SpineArtwork expression={art.expression} palette={art.palette} />
        </View>
      ) : (
        <View
          className="mx-sm mt-sm h-xs rounded-pill"
          style={{ backgroundColor: colors.navy, opacity: opacities.decor }}
        />
      )}
      <View className="mt-auto p-sm">
        {showLabel ? (
          <View className="rounded-sm bg-cream/95 px-xs py-xs">
            <AppText ellipsizeMode="tail" numberOfLines={2} variant="label">
              {title}
            </AppText>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}
