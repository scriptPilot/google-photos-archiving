import fs from "fs";
import yaml from "js-yaml";

function writeConfig(configData) {
  const configPath = "./config.yml";

  // Validate required fields before writing
  const requiredFields = ["startUrl", "endUrl"];
  for (const field of requiredFields) {
    if (typeof configData[field] !== "string") {
      throw new Error(
        `Missing or invalid config field: ${field} (must be a string)`,
      );
    }
  }

  try {
    // Convert config object to YAML string
    const yamlString = yaml.dump(configData, {
      lineWidth: -1, // Prevent line wrapping for URLs
      noRefs: true, // Don't use references
    });

    // Write to config file
    fs.writeFileSync(configPath, yamlString, "utf8");
  } catch (error) {
    throw new Error(`Failed to write config file: ${error.message}`);
  }
}

export default writeConfig;
