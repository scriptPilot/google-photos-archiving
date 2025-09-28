import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import ua from "user-agents";

async function getBrowser(gui = false) {
  chromium.use(stealth());

  const userAgent = new ua({
    platform: "MacIntel",
    deviceCategory: "desktop",
  });

  const browser = await chromium.launchPersistentContext("./session", {
    headless: !gui,
    channel: "chromium",
    args: [
      "--disable-features=IsolateOrigins,site-per-process",
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox", // May help in some environments
      "--disable-infobars", // Prevent infobars
      "--disable-extensions", // Disable extensions
      "--start-maximized", // Start maximized
      "--window-size=800,600", // Set a specific window size
    ],
    userAgent: userAgent.toString(),
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
  });

  return browser;
}

export default getBrowser;
