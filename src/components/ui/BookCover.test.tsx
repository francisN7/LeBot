import { fireEvent, render, screen } from '@testing-library/react-native';
import { BookCover } from './BookCover';
import { Bookmark } from './Bookmark';

describe('BookCover', () => {
  it('mostra a capa com rótulo e a fita do gênero', async () => {
    await render(
      <BookCover
        genreColor="#123456"
        testID="capa-hobbit"
        title="O Hobbit"
        uri="file:///covers/1.jpg"
      />,
    );

    expect(screen.getByLabelText('Capa de O Hobbit')).toBeOnTheScreen();
    expect(screen.getByTestId('capa-hobbit-bookmark')).toBeOnTheScreen();
  });

  it('vira botão quando tem onPress', async () => {
    const onPress = jest.fn();

    await render(
      <BookCover
        genreColor="#123456"
        onPress={onPress}
        title="O Hobbit"
        uri="file:///covers/1.jpg"
      />,
    );

    const cover = screen.getByLabelText('Capa de O Hobbit');

    expect(cover.props.accessibilityRole).toBe('button');

    await fireEvent.press(cover);

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('aceita rótulo próprio no preview do formulário', async () => {
    await render(
      <BookCover
        accessibilityLabel="Capa escolhida"
        genreColor="#123456"
        title="Sem título"
        uri="file:///tmp/capa.jpg"
      />,
    );

    expect(screen.getByLabelText('Capa escolhida')).toBeOnTheScreen();
  });

  it('mostra o selo do status quando o livro tem status', async () => {
    await render(
      <BookCover
        genreColor="#123456"
        status="finished"
        testID="capa-selo"
        title="O Hobbit"
        uri="file:///covers/1.jpg"
      />,
    );

    expect(screen.getByTestId('capa-selo-stamp')).toBeOnTheScreen();
  });

  it('não mostra selo no preview sem status', async () => {
    await render(
      <BookCover
        genreColor="#123456"
        testID="capa-selo"
        title="O Hobbit"
        uri="file:///covers/1.jpg"
      />,
    );

    expect(screen.queryByTestId('capa-selo-stamp')).not.toBeOnTheScreen();
  });
});

describe('Bookmark', () => {
  it('desenha a fita na cor do gênero', async () => {
    await render(<Bookmark color="#7B69EE" />);

    // O react-native-svg serializa a cor como ARGB inteiro (0xFF7B69EE).
    expect(JSON.stringify(screen.toJSON())).toContain(
      String(0xff000000 + 0x7b69ee),
    );
  });
});
