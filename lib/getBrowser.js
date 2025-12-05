import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import ua from "user-agents";

async function getBrowser(gui = false) {
  chromium.use(stealth());

  const userAgent = new ua({
    platform: "MacIntel",
    deviceCategory: "desktop",
  });

  const sessionPath = "./chrome-session";

  const browser = await chromium.launchPersistentContext(sessionPath, {
    headless: !gui,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-infobars",
      "--window-size=800,600",
      "--window-position=100,100",
      "--disable-web-security",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
    ],
    userAgent: userAgent.toString(),
    viewport: { width: 800, height: 600 },
    deviceScaleFactor: 1,
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
  });

  return browser;
}

export default getBrowser;
