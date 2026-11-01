import { fireEvent, screen } from '@testing-library/react-native';
import { View } from 'react-native';

import { AppText, Button } from '@/components/ui';
import { renderWithProviders } from '@/test-utils/render';

import { useSettings } from './use-settings';

function Consumer({ label }: { label: string }) {
  const { values, setValue } = useSettings();

  return (
    <View>
      <AppText>{`${label}:${values['goal.pages'] ?? 'sem meta'}`}</AppText>
      <Button
        label={`definir-${label}`}
        onPress={() => setValue('goal.pages', '42')}
      />
    </View>
  );
}

describe('useSettings', () => {
  it('avisa todos os consumidores quando a meta muda', async () => {
    await renderWithProviders(
      <View>
        <Consumer label="a" />
        <Consumer label="b" />
      </View>,
    );

    expect(screen.getByText('a:18')).toBeOnTheScreen();
    expect(screen.getByText('b:18')).toBeOnTheScreen();

    await fireEvent.press(screen.getByText('definir-a'));

    expect(screen.getByText('a:42')).toBeOnTheScreen();
    expect(screen.getByText('b:42')).toBeOnTheScreen();
  });
});
