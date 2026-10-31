import { createSettingsRepository } from '@/db/repositories/settings';
import { createTestDatabase } from '@/test-utils/sqlite';

describe('settings repository', () => {
  it('grava, sobrescreve e lê valores', async () => {
    const db = await createTestDatabase();
    const repository = createSettingsRepository(db);

    expect(repository.get('goal.pages')).toBeUndefined();

    repository.set('goal.pages', '20');
    expect(repository.get('goal.pages')).toBe('20');

    repository.set('goal.pages', '24');
    expect(repository.get('goal.pages')).toBe('24');
    expect(repository.all()).toEqual({ 'goal.pages': '24' });
  });

  it('remove uma chave existente', async () => {
    const db = await createTestDatabase();
    const repository = createSettingsRepository(db);
    repository.set('reminder.time', '20:00');

    expect(repository.remove('reminder.time')).toBe(true);
    expect(repository.remove('reminder.time')).toBe(false);
    expect(repository.get('reminder.time')).toBeUndefined();
  });

  it('rejeita chave vazia', async () => {
    const db = await createTestDatabase();
    const repository = createSettingsRepository(db);

    expect(() => repository.set('  ', 'x')).toThrow();
  });
});
