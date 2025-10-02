import { parse, isValid, getDate, getMonth, getYear } from 'date-fns'
import { de } from 'date-fns/locale'

async function getItemInfo(page) {
  // Define the timeout values
  const timeoutInSeconds = 3;
  let timeoutStart = Date.now();

  // Get the item id from the url
  const itemId = await page
    .url()
    .replace("https://photos.google.com/photo/", "")
    .trim();

  // Item ID empty, return null
  if (!itemId === "") return null;

  // Open the info panel
  const infoPanel = await page.$$(".Q77Pt.eejsDc");
  const infoPanelIsClosed = await infoPanel[0].evaluate(
    (el) => el.style.display === "none" || el.innerHTML.trim() === "",
  );
  if (infoPanelIsClosed) {
    await page.keyboard.press("KeyI");
    await new Promise((resolve) => setTimeout(resolve, 500));
  } 

  // Wait until the item info block is loaded
  let info = null;
  while (!info) {
    // Get the proper item info block
    const itemInfoBlockEl = await page.$(`.WUbige[data-p*="${itemId}"]`);

    // Check that the item info block is visible
    if (
      itemInfoBlockEl &&
      (await itemInfoBlockEl.evaluate((el) => el.style.display !== "none"))
    ) {
      // Get the filename of the item
      const itemFilenameEl =
        (await itemInfoBlockEl.$(`[aria-label^="Filename:"]`)) ||
        (await itemInfoBlockEl.$(`[aria-label^="Dateiname:"]`));
      const filename = itemFilenameEl
        ? await itemFilenameEl.evaluate((el) =>
            el.getAttribute("aria-label").replace(/^(Filename: |Dateiname: )/, ""),
          )
        : null;

      // Get the item date
      const itemDateEl =
        (await itemInfoBlockEl.$(`[aria-label^="Time taken:"]`)) ||
        (await itemInfoBlockEl.$(`[aria-label^="Datum der Aufnahme:"]`));
      const itemDate = itemDateEl
        ? await itemDateEl.evaluate((el) =>
        el.getAttribute("aria-label").replace(/^(Time taken: |Datum der Aufnahme: )/, ""),
          )
        : null;

      // Get the item date as object
      let itemDateObject = null
      if (itemDate) {
        let itemDateStr = /[0-9]{4}$/.test(itemDate) ? itemDate : itemDate + ' ' + (new Date()).getFullYear()
        itemDateStr = itemDateStr.replace(/(\d+\.\s*)([A-Za-z]{3})[A-Za-z]+(\.?)(\s*\d{4})/, '$1$2$3$4')
        let parsedDate = null
        try { 
          parsedDate = parse(itemDateStr, 'd. MMM. yyyy', new Date(), { locale: de })
        } catch {}
        try {
          if (!isValid(parsedDate)) parsedDate = parse(itemDateStr, 'd. MMM. yyyy', new Date())
        } catch {}
        if (isValid(parsedDate)) {
          itemDateObject = {
            day: getDate(parsedDate),
            month: getMonth(parsedDate) + 1,
            year: getYear(parsedDate),
          }
        }
      }

      // Get the camera name of the item
      const itemCameraNameEl =
        (await itemInfoBlockEl.$(`[aria-label^="Camera name:"]`)) ||
        (await itemInfoBlockEl.$(`[aria-label^="Kameraname:"]`));
      const cameraName = itemCameraNameEl
        ? await itemCameraNameEl.evaluate((el) =>
        el.getAttribute("aria-label").replace(/^(Camera name: |Kameraname: )/, ""),
          )
        : null;

      // Get the albums of the item
      let albums = [];
      const albumsBlockEl = await itemInfoBlockEl.$(`.KlIBpb`);
      if (albumsBlockEl) {
        const albumsTitleEls = await albumsBlockEl.$$(".AJM7gb");
        if (albumsTitleEls.length > 0) {
          for (const albumsTitleEl of albumsTitleEls) {
            albums.push({
              title: await albumsTitleEl.evaluate((el) => el.innerHTML.trim()),
            });
          }
        }
      }

      // Return the item infos as object
      info = {
        id: itemId,
        url: await page.url(),
        filename,
        itemDate,
        itemDateObject,
        cameraName,
        albums,
      };

      // Timeout reached, return null
    } else if (Date.now() > timeoutStart + timeoutInSeconds * 1000) {
      return null;

      // Sleep and try again to find the item info block
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Return item info
  return info;
}

export default getItemInfo;
