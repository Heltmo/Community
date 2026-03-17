const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(45000);

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  try {
    console.log('Navigating to signup page...');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });

    // Fill signup form
    await page.type('#fullName', 'Test Member');
    await page.type('#phoneNumber', '+4712345678');
    await page.type('#email', 'testmember@example.com');
    await page.type('#birthdate', '2000-01-01');
    await page.type('#kommune', 'Oslo');
    await page.click('#bekreft');

    console.log('Submitting signup form...');
    await Promise.all([
      page.click('#regBtn'),
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 45000 }).catch(() => null),
    ]);

    console.log('After submit, url:', page.url());

    if (page.url().includes('verify.html')) {
      console.log('Reached verify page.');
    } else {
      console.warn('Did not navigate to verify.html; still on', page.url());
    }

    const hasUsernameOnVerify = await page.$('#username') !== null;
    console.log('Username field on verify page exists?', hasUsernameOnVerify);

    if (page.url().includes('verify.html')) {
      const otpInputs = await page.$$('.otp-input');
      for (const input of otpInputs) await input.type('1');
      await page.click('#verifyBtn');
      await page.waitForTimeout(2500);
      console.log('After OTP submit, url:', page.url());
    }

    // Navigate directly to create-password page and ensure only password fields exist.
    console.log('Navigating directly to create-password.html...');
    await page.goto('http://localhost:3000/create-password.html', { waitUntil: 'domcontentloaded' });
    const hasUsernameOnPassword = await page.$('#username') !== null;
    console.log('Username field on create-password page exists?', hasUsernameOnPassword);

    await page.type('#password', 'TestPass123!');
    await page.type('#passwordConfirm', 'TestPass123!');
    await page.click('#passwordBtn');
    await page.waitForTimeout(2500);
    console.log('After password submit, current page:', page.url());

    // Test login form behavior
    console.log('Navigating to login page...');
    await page.goto('http://localhost:3000/index.html', { waitUntil: 'domcontentloaded' });
    await page.click('.login-btn');
    await page.waitForSelector('#loginForm', { visible: true, timeout: 10000 });
    await page.type('#loginPhone', '+4712345678');
    await page.type('#loginPassword', 'TestPass123!');
    await page.click('#loginBtn');

    await page.waitForTimeout(2500);
    console.log('After login attempt, current page:', page.url());

  } catch (err) {
    console.error('Test script error:', err);
  } finally {
    await browser.close();
    console.log('Puppeteer test complete.');
  }
})();