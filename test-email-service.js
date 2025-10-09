// Test Email Service
const fetch = require('node-fetch');

const EMAIL_SERVICE_URL = 'https://stock-scribe-backend-601202807478.asia-southeast1.run.app';

async function testEmailService() {
  console.log('🧪 Testing Email Service...');
  
  try {
    // Test health check
    console.log('1. Testing health check...');
    const healthResponse = await fetch(`${EMAIL_SERVICE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData);
    
    // Test email sending
    console.log('2. Testing email sending...');
    const emailData = {
      to: 'test@example.com',
      subject: 'Test Email from Stock Scribe',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from Stock Scribe System.</p>
        <p>Timestamp: ${new Date().toISOString()}</p>
      `,
      text: 'Test Email from Stock Scribe System'
    };
    
    const emailResponse = await fetch(`${EMAIL_SERVICE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });
    
    const emailResult = await emailResponse.json();
    console.log('✅ Email test result:', emailResult);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run test
testEmailService();
