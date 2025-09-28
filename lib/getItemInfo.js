async function getItemInfo(page) {
  // Define the timeout values
  const timeoutInSeconds = 3;
  let timeoutStart = Date.now();

  // Get the item id from the url
  const itemId = await page
    .url()
    .replace("https://photos.google.com/photo/", "")
    .trim();

  // Open the info panel
  const infoPanel = await page.$$(".Q77Pt.eejsDc");
  const infoPanelIsClosed = await infoPanel[0].evaluate(
    (el) => el.style.display === "none" || el.innerHTML.trim() === "",
  );
  if (infoPanelIsClosed) await page.keyboard.press("KeyI");

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
      const itemFilenameEl = await itemInfoBlockEl.$(
        `[aria-label^="Dateiname:"]`,
      );
      const filename = itemFilenameEl
        ? await itemFilenameEl.evaluate((el) =>
            el.getAttribute("aria-label").replace("Dateiname: ", ""),
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
        albums,
      };

      // Timeout reached, reload the url
    } else if (Date.now() > timeoutStart + timeoutInSeconds * 1000) {
      timeoutStart = Date.now();
      await page.reload();

      // Sleep and try again to find the item info block
    } else {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  // Return item info
  return info;
}

export default getItemInfo;
