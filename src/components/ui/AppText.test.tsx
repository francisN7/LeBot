import { render, screen } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { AppText } from './AppText';

describe('AppText', () => {
  it('não aplica letterSpacing no label', async () => {
    await render(<AppText variant="label">Terror</AppText>);

    const style = StyleSheet.flatten(screen.getByText('Terror').props.style);

    // O Android mede a linha sem o espaçamento final e quebra a última letra.
    expect(style.letterSpacing).toBeUndefined();
  });

  it('respeita numberOfLines em container de largura justa', async () => {
    await render(
      <AppText numberOfLines={1} variant="label">
        Voltar
      </AppText>,
    );

    expect(screen.getByText('Voltar').props.numberOfLines).toBe(1);
  });
});
