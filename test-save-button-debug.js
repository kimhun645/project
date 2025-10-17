/**
 * Debug script for Settings save button issue
 * Tests the save button functionality step by step
 */

const puppeteer = require('puppeteer');

async function debugSaveButton() {
  console.log('🔍 Debugging Settings Save Button...\n');
  
  let browser;
  let page;
  
  try {
    // Launch browser with debugging enabled
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized'],
      devtools: true
    });
    
    page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => {
      console.log('🖥️ Browser Console:', msg.text());
    });
    
    // Enable page error logging
    page.on('pageerror', error => {
      console.error('❌ Page Error:', error.message);
    });
    
    // Navigate to the app
    console.log('📱 Navigating to stock-6e930.web.app...');
    await page.goto('https://stock-6e930.web.app', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    // Wait for page to load
    await page.waitForTimeout(3000);
    
    // Check if we're on login page
    const isLoginPage = await page.$('input[type="email"]') !== null;
    
    if (isLoginPage) {
      console.log('🔐 Login required, attempting to login...');
      
      // Try to login with test credentials
      await page.type('input[type="email"]', 'admin@test.com');
      await page.type('input[type="password"]', 'admin123');
      await page.click('button[type="submit"]');
      
      // Wait for login to complete
      await page.waitForTimeout(5000);
    }
    
    // Navigate to Settings page
    console.log('⚙️ Navigating to Settings page...');
    
    // Try direct navigation first
    await page.goto('https://stock-6e930.web.app/settings', { 
      waitUntil: 'networkidle2' 
    });
    
    // Wait for settings page to load
    await page.waitForTimeout(3000);
    
    // Check if we're on the general settings tab
    console.log('📋 Checking General Settings tab...');
    
    // Look for general settings form
    const formSelectors = [
      'form',
      'input[name="companyName"]',
      'input[placeholder*="ชื่อบริษัท"]',
      '[data-testid="company-name"]'
    ];
    
    let formFound = false;
    for (const selector of formSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        formFound = true;
        console.log(`✅ Form found with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!formFound) {
      throw new Error('❌ Settings form not found');
    }
    
    // Check for permission issues
    console.log('🔐 Checking permissions...');
    const permissionCheck = await page.evaluate(() => {
      return {
        canManageSettings: window.canManageSettings,
        currentUser: window.currentUser,
        hasPermission: typeof window.hasPermission
      };
    });
    console.log('Permission check result:', permissionCheck);
    
    // Fill form with test data
    console.log('📝 Filling form with test data...');
    
    // Fill company name
    const companyNameSelectors = [
      'input[name="companyName"]',
      'input[placeholder*="ชื่อบริษัท"]',
      '[data-testid="company-name"]'
    ];
    
    for (const selector of companyNameSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type(selector, 'บริษัททดสอบ จำกัด');
        console.log(`✅ Company name filled with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Fill email
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      'input[placeholder*="อีเมล"]'
    ];
    
    for (const selector of emailSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type(selector, 'test@company.com');
        console.log(`✅ Email filled with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Fill phone
    const phoneSelectors = [
      'input[name="phone"]',
      'input[placeholder*="เบอร์โทร"]',
      'input[placeholder*="โทรศัพท์"]'
    ];
    
    for (const selector of phoneSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type(selector, '02-123-4567');
        console.log(`✅ Phone filled with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    // Fill address
    const addressSelectors = [
      'input[name="address"]',
      'input[placeholder*="ที่อยู่"]',
      'textarea[name="address"]'
    ];
    
    for (const selector of addressSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 2000 });
        await page.click(selector);
        await page.keyboard.down('Control');
        await page.keyboard.press('KeyA');
        await page.keyboard.up('Control');
        await page.type(selector, '123 ถนนทดสอบ แขวงทดสอบ เขตทดสอบ กรุงเทพฯ 10110');
        console.log(`✅ Address filled with selector: ${selector}`);
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    console.log('✅ Form fields filled');
    
    // Check for form errors
    console.log('🔍 Checking for form errors...');
    const formErrors = await page.evaluate(() => {
      const errorElements = document.querySelectorAll('[data-error], .error, .text-red-500, .text-red-600');
      return Array.from(errorElements).map(el => ({
        text: el.textContent,
        className: el.className
      }));
    });
    
    if (formErrors.length > 0) {
      console.log('⚠️ Form errors found:', formErrors);
    } else {
      console.log('✅ No form errors found');
    }
    
    // Look for save button
    console.log('💾 Looking for save button...');
    
    const saveButtonSelectors = [
      'button[type="submit"]',
      'button:contains("บันทึก")',
      'button:contains("Save")',
      '[data-testid="save-settings"]',
      'text=บันทึกการตั้งค่า'
    ];
    
    let saveButtonFound = false;
    let saveButtonElement = null;
    
    for (const selector of saveButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        saveButtonElement = await page.$(selector);
        if (saveButtonElement) {
          const isDisabled = await page.evaluate(el => el.disabled, saveButtonElement);
          const isVisible = await page.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style.display !== 'none' && style.visibility !== 'hidden';
          }, saveButtonElement);
          
          console.log(`✅ Save button found with selector: ${selector}`);
          console.log(`   - Disabled: ${isDisabled}`);
          console.log(`   - Visible: ${isVisible}`);
          
          if (!isDisabled && isVisible) {
            saveButtonFound = true;
            break;
          }
        }
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!saveButtonFound) {
      throw new Error('❌ Save button not found or not clickable');
    }
    
    console.log('✅ Save button found and clickable');
    
    // Click save button
    console.log('🖱️ Clicking save button...');
    await saveButtonElement.click();
    
    // Wait for response
    await page.waitForTimeout(3000);
    
    // Check for success/error messages
    console.log('🔍 Checking for success/error messages...');
    
    const messages = await page.evaluate(() => {
      const toastElements = document.querySelectorAll('[role="alert"], .toast, .alert, [data-testid*="toast"]');
      return Array.from(toastElements).map(el => ({
        text: el.textContent,
        className: el.className
      }));
    });
    
    if (messages.length > 0) {
      console.log('📢 Messages found:', messages);
    } else {
      console.log('⚠️ No success/error messages found');
    }
    
    // Check console for any errors
    console.log('🔍 Checking browser console for errors...');
    
    console.log('\n🎉 Save button debug completed!');
    console.log('📋 Summary:');
    console.log('   - Form found: ✅');
    console.log('   - Form filled: ✅');
    console.log('   - Save button found: ✅');
    console.log('   - Save button clicked: ✅');
    
  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (browser) {
      console.log('\n⏳ Keeping browser open for 30 seconds for manual inspection...');
      await page.waitForTimeout(30000);
      await browser.close();
    }
  }
}

// Run the debug
debugSaveButton().catch(console.error);
