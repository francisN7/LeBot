import { coverFileName, hasCover } from './covers';

describe('coverFileName', () => {
  it('usa o id do livro como nome, sempre .jpg', () => {
    expect(coverFileName('book-abc-123')).toBe('book-abc-123.jpg');
  });
});

describe('hasCover', () => {
  it('reconhece caminho válido', () => {
    expect(hasCover('file:///covers/book-1.jpg')).toBe(true);
  });

  it('trata vazio, null e undefined como sem capa', () => {
    expect(hasCover('')).toBe(false);
    expect(hasCover(null)).toBe(false);
    expect(hasCover(undefined)).toBe(false);
  });
});
