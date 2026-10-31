import { matchesQuery, normalizeText } from './book-search';

describe('normalizeText', () => {
  it('ignora caixa, acento e espaço nas pontas', () => {
    expect(normalizeText('  Príncipe ')).toBe('principe');
    expect(normalizeText('J. R. R. TOLKIEN')).toBe('j. r. r. tolkien');
  });
});

describe('matchesQuery', () => {
  const fields = ['O Pequeno Príncipe', 'Antoine de Saint-Exupéry', null];

  it('encontra por título sem acento e em outra caixa', () => {
    expect(matchesQuery(fields, 'principe')).toBe(true);
    expect(matchesQuery(fields, 'PEQUENO')).toBe(true);
  });

  it('encontra por autor e por ISBN', () => {
    expect(matchesQuery(fields, 'exupery')).toBe(true);
    expect(matchesQuery(['9780306406157'], '40615')).toBe(true);
  });

  it('devolve true para busca vazia', () => {
    expect(matchesQuery(fields, '')).toBe(true);
    expect(matchesQuery(fields, '   ')).toBe(true);
  });

  it('devolve false quando nada casa', () => {
    expect(matchesQuery(fields, 'coraline')).toBe(false);
  });
});
