import { strToU8, zipSync } from 'fflate';

import { packBackupArchive, unpackBackupArchive } from './archive';

describe('backup archive', () => {
  it('faz round-trip do JSON e das capas', async () => {
    const covers = new Map([
      ['book-1', new Uint8Array([1, 2, 3])],
      ['book-2', new Uint8Array([4])],
    ]);
    const bytes = await packBackupArchive('{"ok":true}', covers);
    const unpacked = await unpackBackupArchive(bytes);

    expect(unpacked.json).toBe('{"ok":true}');
    expect([...unpacked.covers.keys()]).toEqual(['book-1', 'book-2']);
    expect(unpacked.covers.get('book-1')).toEqual(new Uint8Array([1, 2, 3]));
  });

  it('recusa arquivo vazio e arquivo que não é zip', async () => {
    await expect(unpackBackupArchive(new Uint8Array())).rejects.toThrow(
      'vazio',
    );

    await expect(
      unpackBackupArchive(new Uint8Array([1, 2, 3, 4])),
    ).rejects.toThrow('não é um backup');
  });

  it('recusa zip sem backup.json na raiz', async () => {
    const bytes = zipSync({
      'covers/book-1.jpg': new Uint8Array([1]),
    });

    await expect(unpackBackupArchive(bytes)).rejects.toThrow('backup.json');
  });

  it('recusa arquivo inesperado e capa em caminho inválido', async () => {
    const extra = zipSync({
      'backup.json': strToU8('{}'),
      'evil.txt': strToU8('x'),
    });

    await expect(unpackBackupArchive(extra)).rejects.toThrow(
      'arquivo inesperado',
    );

    const traversal = zipSync({
      'backup.json': strToU8('{}'),
      'covers/../x.jpg': new Uint8Array([1]),
    });

    await expect(unpackBackupArchive(traversal)).rejects.toThrow(
      'arquivo inesperado',
    );
  });

  it('recusa id de capa inválido ao montar', async () => {
    await expect(
      packBackupArchive('{}', new Map([['../x', new Uint8Array([1])]])),
    ).rejects.toThrow('identificador inválido');
  });
});
