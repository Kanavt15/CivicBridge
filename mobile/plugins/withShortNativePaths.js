const { withProjectBuildGradle } = require("expo/config-plugins");
module.exports = function withShortNativePaths(config) {
  return withProjectBuildGradle(config, (config) => {
    const marker = "// CivicBridge: short Windows C++ paths";
    if (!config.modResults.contents.includes(marker)) {
      const additions = `
${marker}
subprojects { nativeProject ->
  nativeProject.tasks.configureEach { nativeTask ->
    if (nativeTask.name.startsWith("createBundle") && nativeTask.name.endsWith("JsAndAssets")) {
      nativeTask.inputs.property("civicbridgeApiUrl", System.getenv("EXPO_PUBLIC_API_URL") ?: "")
      nativeTask.inputs.property("civicbridgeLocalPreview", System.getenv("EXPO_PUBLIC_LOCAL_PREVIEW") ?: "false")
    }
  }
}
if (System.getProperty("os.name").toLowerCase().contains("windows")) {
  subprojects { nativeProject ->
    ["com.android.library", "com.android.application"].each { pluginName ->
      nativeProject.plugins.withId(pluginName) {
        def nativeAndroid = nativeProject.extensions.getByName("android")
        nativeAndroid.externalNativeBuild.cmake.buildStagingDirectory = new File(rootProject.projectDir, "../../.data/cxx/" + nativeProject.name).canonicalFile
        nativeAndroid.defaultConfig.externalNativeBuild.cmake.arguments.add("-DCMAKE_OBJECT_PATH_MAX=" + (nativeProject.name == "app" ? "250" : "128"))
        def modernNinja = new File(rootProject.projectDir, "../../.data/tools/ninja/ninja.exe").canonicalFile
        if (modernNinja.exists()) nativeAndroid.defaultConfig.externalNativeBuild.cmake.arguments.add("-DCMAKE_MAKE_PROGRAM=" + modernNinja.absolutePath.replace(File.separator, "/"))
      }
    }
  }
}
`;
      const anchor = config.modResults.contents.search(/apply plugin: ['"]expo-root-project['"]/);
      if (anchor < 0)
        throw new Error("Could not find the Expo root plugin in generated Gradle configuration.");
      config.modResults.contents =
        config.modResults.contents.slice(0, anchor) +
        additions +
        "\n" +
        config.modResults.contents.slice(anchor);
    }
    return config;
  });
};
