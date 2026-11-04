/**
 * Config plugin que ensina o build de release a assinar com o keystore do dono.
 *
 * O `/android` é gerado pelo `expo prebuild` e não vai para o Git (ADR 0025).
 * Sem este plugin, cada `prebuild --clean` voltaria a assinar o release com a
 * chave de debug — e o APK publicado não poderia ser atualizado.
 *
 * O keystore e as senhas ficam fora do repositório, em
 * `~/.lebot/release.properties` (formato `chave=valor`):
 *
 *   storeFile=C:/Users/<usuario>/.lebot/lebot-release.keystore
 *   storePassword=...
 *   keyAlias=lebot
 *   keyPassword=...
 *
 * O Gradle lê esse arquivo em tempo de build; nada de segredo entra em
 * `android/`, no bundle ou no Git. Caminhos com barra normal funcionam no
 * Windows e evitam escapes do `Properties` do Java.
 */

const { withAppBuildGradle } = require('expo/config-plugins');

/** Marcador para o plugin não duplicar o bloco quando roda duas vezes. */
const MARKER = 'lebotPropsFile';

/** Lê `~/.lebot/release.properties` direto no Gradle, nunca no repositório. */
const RELEASE_SIGNING_BLOCK = `    signingConfigs {
        release {
            def lebotPropsFile = new File(System.getProperty("user.home"), ".lebot/release.properties")
            def lebotProps = new Properties()
            if (lebotPropsFile.exists()) {
                lebotPropsFile.withInputStream { lebotProps.load(it) }
            }
            def lebotStoreFile = lebotProps.getProperty("storeFile")
            storeFile lebotStoreFile ? file(lebotStoreFile) : null
            storePassword lebotProps.getProperty("storePassword")
            keyAlias lebotProps.getProperty("keyAlias")
            keyPassword lebotProps.getProperty("keyPassword")
        }
    }
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (cfg) => {
    if (cfg.modResults.language !== 'groovy') {
      throw new Error(
        'with-release-signing: esperava android/app/build.gradle em Groovy',
      );
    }

    let contents = cfg.modResults.contents;

    // Troca a assinatura ANTES de inserir o bloco novo: o `release {` do
    // signingConfigs que a gente injeta seria o primeiro do arquivo e o regex
    // acabaria trocando a linha do buildType `debug` (bug pego no APK da S12:
    // o release saiu assinado com a chave de debug).
    const buildTypesAt = contents.search(/^\s*buildTypes \{/m);
    if (buildTypesAt < 0) {
      throw new Error(
        'with-release-signing: não achei o bloco buildTypes no build.gradle',
      );
    }

    const buildTypes = contents.slice(buildTypesAt);
    const alreadyRelease =
      /release\s*\{[\s\S]*?signingConfig signingConfigs\.release/.test(
        buildTypes,
      );
    const patched = alreadyRelease
      ? buildTypes
      : buildTypes.replace(
          /(release\s*\{[\s\S]*?)signingConfig signingConfigs\.debug/,
          '$1signingConfig signingConfigs.release',
        );

    if (!alreadyRelease && patched === buildTypes) {
      throw new Error(
        'with-release-signing: release não usa signingConfigs.debug; revise o template do Expo',
      );
    }

    contents = contents.slice(0, buildTypesAt) + patched;

    if (!contents.includes(MARKER)) {
      contents = contents.replace(
        /^(\s*)buildTypes \{/m,
        `${RELEASE_SIGNING_BLOCK}$1buildTypes {`,
      );
    }

    cfg.modResults.contents = contents;
    return cfg;
  });
};
