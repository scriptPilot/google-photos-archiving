import { chromium } from "playwright";
import { existsSync, copyFileSync, mkdirSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";
import { homedir } from "os";

console.log('🔧 Chrome Session Setup');
console.log('=======================\n');

const chromeBasePath = join(homedir(), "Library/Application Support/Google/Chrome");
const chromeDefaultProfile = join(chromeBasePath, "Default");

if (!existsSync(chromeDefaultProfile)) {
  console.log('❌ Chrome Default profile not found at:', chromeDefaultProfile);
  process.exit(1);
}

const sessionPath = "./chrome-session";

console.log('📋 Step 1: Closing all Chrome windows...\n');

try {
  // Kill all Chrome processes
  execSync('pkill -9 "Google Chrome" 2>/dev/null || true');
  console.log('✅ Chrome processes closed\n');
  
  // Wait a moment for processes to fully terminate
  await new Promise(resolve => setTimeout(resolve, 1000));
} catch (err) {
  console.log('⚠️  No Chrome processes found (already closed)\n');
}

console.log('📋 Step 2: Copying Chrome session files...');

try {
  mkdirSync(sessionPath, { recursive: true });
  
  // Files to copy for session persistence
  const filesToCopy = [
    "Cookies",
    "Cookies-journal",
    "Web Data",
    "Web Data-journal",
    "Network Persistent State",
  ];
  
  let copiedCount = 0;
  
  for (const file of filesToCopy) {
    const sourcePath = join(chromeDefaultProfile, file);
    const destPath = join(sessionPath, file);
    
    if (existsSync(sourcePath)) {
      try {
        copyFileSync(sourcePath, destPath);
        copiedCount++;
        console.log(`   ✓ ${file}`);
      } catch (err) {
        console.log(`   ⚠ ${file} (locked or in use)`);
      }
    }
  }
  
  // Copy Local Storage directory
  const localStorageSource = join(chromeDefaultProfile, "Local Storage");
  const localStorageDest = join(sessionPath, "Local Storage");
  
  if (existsSync(localStorageSource)) {
    try {
      mkdirSync(localStorageDest, { recursive: true });
      const lsFiles = readdirSync(localStorageSource);
      for (const file of lsFiles) {
        const src = join(localStorageSource, file);
        const dst = join(localStorageDest, file);
        if (statSync(src).isFile()) {
          try {
            copyFileSync(src, dst);
          } catch (err) {
            // Skip locked files
          }
        }
      }
      console.log(`   ✓ Local Storage`);
    } catch (err) {
      console.log(`   ⚠ Local Storage (could not copy)`);
    }
  }
  
  console.log(`\n✅ Copied ${copiedCount} session files!\n`);
  
  console.log('📋 Step 3: Opening browser for login...');
  console.log('   Please login to Google Photos manually');
  console.log('   Google may show security warnings - this is normal\n');
  
  // Launch browser with the copied session
  const browser = await chromium.launchPersistentContext(sessionPath, {
    headless: false,
    args: [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
      "--disable-infobars",
      "--start-maximized",
      "--window-size=1920,1080",
      "--disable-web-security",
      "--disable-features=IsolateOrigins",
      "--disable-site-isolation-trials",
    ],
    locale: 'de-DE',
    timezoneId: 'Europe/Berlin',
  });
  
  const page = await browser.newPage();
  
  // Navigate to Google Photos
  console.log('   Navigating to Google Photos...');
  await page.goto('https://photos.google.com/', { waitUntil: 'domcontentloaded' });
  
  console.log('\n✅ Browser opened.');
  console.log('\n💡 If Google blocks the login:');
  console.log('   1. Try opening https://myaccount.google.com/ first');
  console.log('   2. Or manually navigate to https://photos.google.com/');
  console.log('   3. Complete any security checks');
  console.log('\n   Once logged in, close this terminal (Ctrl+C) - the session is saved automatically.\n');
  
  // Keep running
  await new Promise(() => {});
  
} catch (err) {
  console.log('❌ Error:', err.message);
  console.log('\n💡 Troubleshooting:');
  console.log('   - Try running the script again');
  console.log('   - Some files may be locked, but the script will continue with available files');
  process.exit(1);
}
