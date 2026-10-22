import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "jinju",
  brand: {
    primaryColor: "#EADBD4",
  },
  navigationBar: {
    withBackButton: true,
    withHomeButton: true,
    withTitle: true,
    theme: "dark",
  },
  webView: {
    bounces: false,
    pullToRefreshEnabled: false,
    overScrollMode: "never",
    allowsBackForwardNavigationGestures: true,
  },
  permissions: [{ name: "microphone", access: "access" }],
  webBundleDir: "dist",
});
