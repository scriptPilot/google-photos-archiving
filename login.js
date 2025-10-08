import { chromium } from "playwright";

console.log('🔧 Google Photos Login Setup using Existing Chrome Session');
console.log('=====================================================\n');

console.log('📋 Step 1: Start Chrome in debug mode');
console.log('Run this command in a new terminal:');
console.log('');
console.log('For macOS:');
console.log('/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome --remote-debugging-port=9222');
console.log('');
console.log('For Windows:');
console.log('"C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --remote-debugging-port=9222');
console.log('');
console.log('For Linux:');
console.log('google-chrome --remote-debugging-port=9222');
console.log('');

console.log('📋 Step 2: Verify Chrome is in debug mode');
console.log('Open a new tab in Chrome and visit: http://localhost:9222/json/version');
console.log('You should see JSON data if debug mode is working');
console.log('');

console.log('📋 Step 3: Login to Google Photos');
console.log('1. In your Chrome browser, go to https://photos.google.com/');
console.log('2. Login with your Google account');
console.log('3. Make sure you can see your photos library');
console.log('');

console.log('📋 Step 4: Run the session capture');
console.log('Press Enter when Chrome is running in debug mode and you are logged into Google Photos...');

// Wait for user confirmation
await new Promise((resolve) => {
  process.stdin.resume();
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', function(text) {
    process.stdin.pause();
    resolve();
  });
});

console.log('🔗 Connecting to existing Chrome session...');

try {
  // Connect to the existing Chrome instance
  const browser = await chromium.connectOverCDP('http://localhost:9222');
  
  console.log('✅ Successfully connected to Chrome!');
  
  // Get all contexts (browser tabs/windows)
  const contexts = browser.contexts();
  console.log(`📊 Found ${contexts.length} browser contexts`);
  
  if (contexts.length === 0) {
    throw new Error('No browser contexts found');
  }
  
  // Use the default context (first one)
  const context = contexts[0];
  const pages = context.pages();
  
  console.log(`📄 Found ${pages.length} pages in the default context`);
  
  let photosPage = null;
  
  // Look for a page that's already on Google Photos
  for (const page of pages) {
    const url = page.url();
    if (url.includes('photos.google.com')) {
      photosPage = page;
      console.log(`✅ Found Google Photos page: ${url}`);
      break;
    }
  }
  
  // If no Google Photos page found, use the first page and navigate to it
  if (!photosPage && pages.length > 0) {
    photosPage = pages[0];
    console.log('🔄 Navigating to Google Photos...');
    await photosPage.goto('https://photos.google.com/');
    await photosPage.waitForTimeout(3000);
  }
  
  if (!photosPage) {
    throw new Error('Could not find or create a page for Google Photos');
  }
  
  // Verify we're logged in
  console.log('🔍 Verifying login status...');
  const currentUrl = photosPage.url();
  const isLoggedIn = currentUrl.includes('photos.google.com') && 
                    !currentUrl.includes('signin') && 
                    !currentUrl.includes('accounts.google.com');
  
  if (isLoggedIn) {
    console.log('✅ Successfully verified: You are logged into Google Photos!');
    console.log(`📍 Current URL: ${currentUrl}`);
    
    // Save the session by creating a persistent context with the same cookies
    console.log('💾 Saving session for Playwright...');
    
    // Get all cookies from the current page
    const cookies = await context.cookies();
    console.log(`🍪 Found ${cookies.length} cookies to save`);
    
    // Create a new persistent context and add the cookies
    const userDataDir = "./session";
    const persistentBrowser = await chromium.launchPersistentContext(userDataDir, {
      headless: true,
      channel: "chromium",
    });
    
    const persistentContext = persistentBrowser;
    await persistentContext.addCookies(cookies);
    
    // Test the session by navigating to Google Photos
    const testPage = await persistentContext.newPage();
    await testPage.goto('https://photos.google.com/');
    await testPage.waitForTimeout(3000);
    
    const testUrl = testPage.url();
    const sessionWorks = testUrl.includes('photos.google.com') && 
                        !testUrl.includes('signin');
    
    if (sessionWorks) {
      console.log('✅ Session saved successfully!');
      console.log('🚀 You can now run your archiving script: node archive.js');
    } else {
      console.log('⚠️  Session may not be fully saved, but cookies were transferred');
      console.log('💡 Try running the archive script anyway: node archive.js');
    }
    
    await persistentBrowser.close();
    
  } else {
    console.log('❌ Not logged into Google Photos');
    console.log(`📍 Current URL: ${currentUrl}`);
    console.log('💡 Please login to Google Photos in your Chrome browser first');
  }
  
  // Don't close the original browser - leave it for the user
  console.log('\n✨ Setup complete! Your original Chrome browser is still open.');
  console.log('⏭️  You can now run "node archive" to start the archiving process.')

  // End the script
  process.exit(0);  
  
} catch (error) {
  console.error('❌ Failed to connect to Chrome:', error.message);
  console.log('\n💡 Troubleshooting:');
  console.log('1. Make sure Chrome is running with --remote-debugging-port=9222');
  console.log('2. Check that http://localhost:9222/json/version works in Chrome');
  console.log('3. Make sure you are logged into Google Photos');
  console.log('4. Try closing Chrome completely and restarting with the debug flag');
}