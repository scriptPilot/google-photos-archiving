import path from "path";
import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import ua from "user-agents";
import fs from "fs";

const userAgent = new ua({
  platform: "MacIntel", // 'Win32', 'Linux ...'
  deviceCategory: "desktop", // 'mobile', 'tablet'
});

chromium.use(stealth());

const userDataDir = "./session";
if (!fs.existsSync(userDataDir)) {
  fs.mkdirSync(userDataDir, { recursive: true });
}

(async () => {
  const browser = await chromium.launchPersistentContext(
    path.resolve(userDataDir),
    {
      headless: false,
      channel: "chromium",
      args: [
        "--disable-blink-features=AutomationControlled",
        "--no-sandbox", // May help in some environments
        "--disable-web-security", // Not recommended for production use
        "--disable-infobars", // Prevent infobars
        "--disable-extensions", // Disable extensions
        "--start-maximized", // Start maximized
        "--window-size=1280,720", // Set a specific window size
      ],
      userAgent: userAgent.toString(),
      viewport: { width: 1280, height: 720 },
      deviceScaleFactor: 1,
    },
  );

  const page = await browser.newPage();
  await page.goto("https://photos.google.com/");

  console.log("Close browser once you are logged inside Google Photos");
})();
