import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';

import {
  COVERS_DIRECTORY,
  type CoverService,
  coverFileName,
} from '@/lib/covers';

function coversDirectory(): Directory {
  return new Directory(Paths.document, COVERS_DIRECTORY);
}

function ensureCoversDirectory(): Directory {
  const directory = coversDirectory();

  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }

  return directory;
}

/**
 * Capas no aparelho: a galeria entrega uma URI temporária, copiamos para
 * `documentDirectory/covers/<id>.jpg` e guardamos só esse caminho no banco.
 * Nada é enviado para a rede.
 */
export function createDeviceCoverService(): CoverService {
  return {
    async pick() {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [2, 3],
        quality: 0.8,
      });

      const asset = result.canceled ? undefined : result.assets[0];

      if (!asset) {
        return { status: 'canceled' };
      }

      return { status: 'picked', uri: asset.uri };
    },

    async save(bookId, sourceUri) {
      const destination = new File(
        ensureCoversDirectory(),
        coverFileName(bookId),
      );

      if (destination.exists) {
        destination.delete();
      }

      await new File(sourceUri).copy(destination);

      return destination.uri;
    },

    async remove(uri) {
      if (!uri) {
        return;
      }

      const file = new File(uri);

      if (file.exists) {
        file.delete();
      }
    },
  };
}
