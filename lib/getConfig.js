import fs from "fs";
import yaml from "js-yaml";

function getConfig() {
  const configPath = "./config.yml";

  if (!fs.existsSync(configPath)) {
    throw new Error(`Config file not found at ${configPath}`);
  }

  const config = yaml.load(fs.readFileSync(configPath, "utf8"));

  const requiredFields = ["startUrl", "endUrl"];
  for (const field of requiredFields) {
    if (typeof config[field] !== "string") {
      throw new Error(
        `Missing or invalid config field: ${field} (must be a string)`,
      );
    }
  }

  return config;
}

export default getConfig;
