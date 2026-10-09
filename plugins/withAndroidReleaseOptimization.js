const { withAppBuildGradle, withGradleProperties } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for Android Release Optimization:
 * 1. Enables ABI splits (arm64-v8a, armeabi-v7a, x86, x86_64 + universal).
 * 2. Compresses native .so libraries (expo.useLegacyPackaging=true).
 * 3. Enables R8 code shrinking and resource minification.
 */
module.exports = function withAndroidReleaseOptimization(config) {
  // 1. Update gradle.properties
  config = withGradleProperties(config, (modConfig) => {
    const propertiesToAdd = [
      { type: 'property', key: 'expo.useLegacyPackaging', value: 'true' },
      { type: 'property', key: 'android.enableMinifyInReleaseBuilds', value: 'true' },
      { type: 'property', key: 'android.enableShrinkResourcesInReleaseBuilds', value: 'true' },
      { type: 'property', key: 'android.enablePngCrunchInReleaseBuilds', value: 'true' },
    ];

    propertiesToAdd.forEach((prop) => {
      const idx = modConfig.modResults.findIndex((item) => item.type === 'property' && item.key === prop.key);
      if (idx >= 0) {
        modConfig.modResults[idx].value = prop.value;
      } else {
        modConfig.modResults.push(prop);
      }
    });

    return modConfig;
  });

  // 2. Update app/build.gradle with splits
  config = withAppBuildGradle(config, (modConfig) => {
    let contents = modConfig.modResults.contents;

    if (!contents.includes('splits {')) {
      const splitsBlock = `
    splits {
        abi {
            reset()
            enable true
            universalApk true
            include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
        }
    }
`;
      // Inject inside android { ... } right after defaultConfig
      contents = contents.replace(/(defaultConfig\s*\{[\s\S]*?\n\s*\})/, `$1\n${splitsBlock}`);
      modConfig.modResults.contents = contents;
    }

    return modConfig;
  });

  return config;
};
