import getConfig from "./lib/getConfig.js";
import writeConfig from "./lib/writeConfig.js";
import getBrowser from "./lib/getBrowser.js";
import getItemInfo from "./lib/getItemInfo.js";

const config = getConfig();

let processedItemsCount = 0;
let archivedItemsCount = 0;
let skippedItemsCount = 0;

let logMessages = [];
const startTime = Date.now();

async function log(message) {
  const messageLimit = 10;
  const dateStr = new Date().toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  logMessages.push(`${dateStr} ${message}`);
  logMessages = logMessages.slice(-messageLimit);
  console.clear();
  console.log(`Processed Items: ${processedItemsCount}`);
  if (archivedItemsCount + skippedItemsCount > 0) {
    const itemsPerMinute =
      ((Date.now() - startTime) / processedItemsCount / 1000) * 60;
    console.log(
      `Archived Items: ${archivedItemsCount} (${Math.round((archivedItemsCount / processedItemsCount) * 100)}%)`,
    );
    console.log(
      `Skipped Items: ${skippedItemsCount} (${Math.round((skippedItemsCount / processedItemsCount) * 100)}%)`,
    );
    console.log(`Items per Minute: ${Math.round(itemsPerMinute)}`);
  }
  console.log("");
  if (logMessages.length > messageLimit) console.log("...");
  logMessages.forEach((message) => console.log(message));
}

async function main() {
  // Start the browser
  const browser = await getBrowser(config.showBrowser === true);
  log("Archving process started");

  // Open a new tab
  const page = await browser.newPage();

  // Process the items
  let lastProcessedUrl = "";
  while (lastProcessedUrl !== config.endUrl) {
    // For the first item, open the start url
    if (lastProcessedUrl === "") await page.goto(config.startUrl);

    // If forwarded to the url https://photos.google.com/, restart the archiving process
    if ((await page.url()) === "https://photos.google.com/") {
      log("Archiving interrupted");
      lastProcessedUrl = "";
      await browser.close();
      main();
      return;
    }

    // Wait until the url has been updated
    while ((await page.url()) === lastProcessedUrl)
      await new Promise((resolve) => setTimeout(resolve, 100));

    // Get the item information
    const itemInfo = await getItemInfo(page);

    // Item information is null, restart the archiving process
    if (!itemInfo) {
      log("Archiving interrupted");
      lastProcessedUrl = "";
      await browser.close();
      main();
      return;
    }

    // Update the process status
    // Must be done before any key press
    // because that will change the url.
    lastProcessedUrl = await page.url();
    processedItemsCount++;

    // Archive the item if it is not linked to any album
    // The navigation to the following item is done automatically
    if (itemInfo.albums.length < 1) {
      await page.keyboard.down("Shift");
      await page.keyboard.press("KeyA");
      await page.keyboard.up("Shift");
      archivedItemsCount++;
      log(`Archived item "${itemInfo.filename}" (${itemInfo.url})`);

      // Skip the item if it is linked to one or more albums
      // The navigation to the following item must be done manually
    } else {
      await page.keyboard.press("ArrowRight");
      skippedItemsCount++;
      log(`Skipped item "${itemInfo.filename}" (${itemInfo.url})`);

      // Replace the start url to improve the restart process
      // Also update the config file accordingly
      config.startUrl = lastProcessedUrl;
      writeConfig(config);
    }
  }

  // Close the browser
  browser.close();
  log("Archiving process completed");
}

main();
