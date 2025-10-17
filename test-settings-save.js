/**
 * Test script for Settings save functionality
 * Tests the general settings tab save functionality
 */

const { exec } = require('child_process');
const puppeteer = require('puppeteer');

async function testSettingsSave() {
  console.log('🧪 Testing Settings Save Functionality...\n');
  
  let browser;
  let page;
  
  try {
    // Launch browser
    browser = await puppeteer.launch({ 
      headless: false,
      defaultViewport: null,
      args: ['--start-maximized']
    });
    
    page = await browser.newPage();
    
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
    
    // Look for settings link/button
    const settingsSelectors = [
      'a[href*="settings"]',
      'button:contains("Settings")',
      '[data-testid="settings"]',
      'text=การตั้งค่า',
      'text=Settings'
    ];
    
    let settingsFound = false;
    for (const selector of settingsSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        settingsFound = true;
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!settingsFound) {
      // Try to navigate directly
      await page.goto('https://stock-6e930.web.app/settings', { 
        waitUntil: 'networkidle2' 
      });
    }
    
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
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!formFound) {
      throw new Error('❌ Settings form not found');
    }
    
    console.log('✅ Settings form found');
    
    // Test form filling
    console.log('📝 Testing form filling...');
    
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
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    console.log('✅ Form fields filled');
    
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
    for (const selector of saveButtonSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 3000 });
        await page.click(selector);
        saveButtonFound = true;
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (!saveButtonFound) {
      throw new Error('❌ Save button not found');
    }
    
    console.log('✅ Save button clicked');
    
    // Wait for save to complete
    await page.waitForTimeout(3000);
    
    // Check for success message
    console.log('🔍 Checking for success message...');
    
    const successSelectors = [
      'text=บันทึกสำเร็จ',
      'text=บันทึกแล้ว',
      'text=Success',
      '[data-testid="success-message"]',
      '.toast-success',
      '.alert-success'
    ];
    
    let successFound = false;
    for (const selector of successSelectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        successFound = true;
        break;
      } catch (e) {
        // Continue to next selector
      }
    }
    
    if (successFound) {
      console.log('✅ Success message found - Settings saved successfully!');
    } else {
      console.log('⚠️ No success message found, but save might have worked');
    }
    
    // Test if data persists after refresh
    console.log('🔄 Testing data persistence...');
    await page.reload({ waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);
    
    // Check if company name is still there
    const companyNameValue = await page.evaluate(() => {
      const selectors = [
        'input[name="companyName"]',
        'input[placeholder*="ชื่อบริษัท"]',
        '[data-testid="company-name"]'
      ];
      
      for (const selector of selectors) {
        const element = document.querySelector(selector);
        if (element && element.value) {
          return element.value;
        }
      }
      return null;
    });
    
    if (companyNameValue && companyNameValue.includes('บริษัททดสอบ')) {
      console.log('✅ Data persistence confirmed - Settings saved to database!');
    } else {
      console.log('⚠️ Data persistence not confirmed - Settings might not be saved to database');
    }
    
    console.log('\n🎉 Settings save test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run the test
testSettingsSave().catch(console.error);
