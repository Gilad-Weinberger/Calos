const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

const getPackageName = () => {
  if (IS_DEV) return "com.calos.app.dev";
  if (IS_PREVIEW) return "com.calos.app.preview";
  return "com.calos.app";
};

const getAppName = () => {
  if (IS_DEV) return "Calos Dev";
  if (IS_PREVIEW) return "Calos Preview";
  return "Calos";
};

export default {
  expo: {
    name: getAppName(),
    slug: "Calos",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/logo.png",
    scheme: "calos",
    userInterfaceStyle: "automatic",
    owner: "calos-org",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: getPackageName(),
    },
    web: {
      bundler: "metro",
      output: "static",
      favicon: "./assets/images/logo.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/logo.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-localization",
        {
          isRTL: false,
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "38f06e01-841e-4bb8-baa4-2f000fa63310",
      },
    },
    runtimeVersion: {
      policy: "appVersion",
    },
    updates: {
      url: "https://u.expo.dev/38f06e01-841e-4bb8-baa4-2f000fa63310",
    },
  },
};
