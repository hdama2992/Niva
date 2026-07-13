const { existsSync } = require("node:fs");
const path = require("node:path");

const app = require("./app.json");

module.exports = () => {
  const config = app.expo;
  const googleServicesPath = path.join(__dirname, "google-services.json");

  return {
    ...config,
    android: {
      ...config.android,
      ...(existsSync(googleServicesPath)
        ? { googleServicesFile: "./google-services.json" }
        : {}),
    },
  };
};
