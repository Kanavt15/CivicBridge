import type { ExpoConfig, ConfigContext } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  const profile = process.env.EAS_BUILD_PROFILE;
  const api = process.env.EXPO_PUBLIC_API_URL;
  if (profile && profile !== "development") {
    const url = api ? new URL(api) : null;
    if (
      !url ||
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.pathname !== "/" ||
      url.search ||
      url.hash
    )
      throw new Error(
        "Set EXPO_PUBLIC_API_URL to the deployed HTTPS origin before building a distributable app.",
      );
  }
  return {
    ...config,
    name: "CivicBridge",
    slug: "civicbridge-mobile",
    version: "1.0.0",
    orientation: "portrait",
    scheme: "civicbridge",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "in.civicbridge.community",
      infoPlist: { ITSAppUsesNonExemptEncryption: false },
    },
    android: {
      package: "in.civicbridge.community",
      adaptiveIcon: {
        foregroundImage: "./assets/icon.png",
        backgroundColor: "#171717",
        monochromeImage: "./assets/monochrome.png",
      },
      predictiveBackGestureEnabled: true,
    },
    plugins: [
      "expo-router",
      "expo-secure-store",
      "expo-localization",
      [
        "expo-image-picker",
        {
          photosPermission: "Choose photos to document a community problem or solution.",
          cameraPermission: "Take a photo to document a community problem or solution.",
          microphonePermission: false,
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Use your location only when you choose to add it to a community report.",
        },
      ],
    ],
  };
};
