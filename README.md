# Google Photos Archiving

Script to archive all items which are not added to any album to cleanup the photos overview.

[Archived items](https://photos.google.com/archive) can be unarchived or deleted in Google Fotos.

## Setup

1. Clone this repository:

   ```
   git clone https://github.com/scriptPilot/google-photos-archiving
   ```

3. Install all dependencies:

   ```
   npm install
   npx playwright install --with-deps chromium
   ```

4. Login to Google Photos:

   ```
   node login
   ```

## Usage

1. Create a `config.yml` file with two items which have at least on album assignment:

   ```yml
   startUrl: https://photos.google.com/photo/{first_item_to_process}
   endUrl: https://photos.google.com/photo/{last_item_to_process}
   ```

   The start url will be updated automatically in the config file by the script, so the script can be stopped and restartet at any time from the last processed item with an album assignment.

2. Start the archiving process:

   ```
   node archive
   ```
