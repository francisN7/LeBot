import { createNavigationGuard } from './navigation';

describe('createNavigationGuard', () => {
  it('libera o primeiro toque e ignora o repetido', () => {
    let clock = 1_000;
    const allow = createNavigationGuard(500, () => clock);

    expect(allow()).toBe(true);

    clock += 100;
    expect(allow()).toBe(false);

    clock += 100;
    expect(allow()).toBe(false);
  });

  it('libera de novo depois da janela', () => {
    let clock = 1_000;
    const allow = createNavigationGuard(500, () => clock);

    expect(allow()).toBe(true);

    clock += 500;
    expect(allow()).toBe(true);
  });
});
