const http = require('http');

const PORT = 5000;
const HOST = 'localhost';

const runRequest = (path, method, payload = null, token = null) => {
  return new Promise((resolve, reject) => {
    const data = payload ? JSON.stringify(payload) : '';
    const options = {
      hostname: HOST,
      port: PORT,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (payload) {
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            body: body ? JSON.parse(body) : null
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            body: body
          });
        }
      });
    });

    req.on('error', (e) => reject(e));
    if (payload) {
      req.write(data);
    }
    req.end();
  });
};

const runTests = async () => {
  console.log('===================================================');
  console.log('Veritas AI API Security Integration Test Suite');
  console.log('===================================================');
  
  try {
    // -----------------------------------------------------------------
    // TEST 1: Password Strength Policy Enforcements
    // -----------------------------------------------------------------
    console.log('\n[Test 1] Registering user with WEAK password...');
    const weakUser = {
      name: 'Weak User',
      email: `weak_${Date.now()}@example.com`,
      password: 'short'
    };
    const weakReg = await runRequest('/api/auth/register', 'POST', weakUser);
    console.log(`Status: ${weakReg.statusCode} (Expected: 400)`);
    console.log('Response Message:', weakReg.body.message);
    if (weakReg.statusCode !== 400) throw new Error('Password complexity checker failed');

    // -----------------------------------------------------------------
    // TEST 2: Registration & Email Verification Flow
    // -----------------------------------------------------------------
    console.log('\n[Test 2] Registering user with SECURE password...');
    const secureUser = {
      name: 'Secure User',
      email: `secure_${Date.now()}@example.com`,
      password: 'SecurePassword123!@#'
    };
    const reg = await runRequest('/api/auth/register', 'POST', secureUser);
    console.log(`Status: ${reg.statusCode} (Expected: 200)`);
    if (reg.statusCode !== 200 || !reg.body.verifyToken) throw new Error('Registration failed');
    const verifyToken = reg.body.verifyToken;

    console.log('Verifying email using token...');
    const verifyRes = await runRequest('/api/auth/verify-email', 'POST', { token: verifyToken });
    console.log(`Status: ${verifyRes.statusCode} (Expected: 200)`);
    console.log('Message:', verifyRes.body.message);
    if (verifyRes.statusCode !== 200) throw new Error('Email verification failed');

    // -----------------------------------------------------------------
    // TEST 3: Login Account Lockout (5 failed attempts)
    // -----------------------------------------------------------------
    console.log('\n[Test 3] Attempting 5 failed logins to test lockout...');
    for (let i = 1; i <= 5; i++) {
      const loginFail = await runRequest('/api/auth/login', 'POST', {
        email: secureUser.email,
        password: 'WrongPassword999!'
      });
      console.log(`Attempt ${i} status: ${loginFail.statusCode} | Message: ${loginFail.body.message}`);
      if (i === 5) {
        if (loginFail.statusCode !== 400 || !loginFail.body.message.includes('locked')) {
          throw new Error('Lockout mechanism failed to trigger after 5 attempts');
        }
      }
    }

    // Try valid password on locked account
    console.log('Testing valid login during lockout period...');
    const lockedLogin = await runRequest('/api/auth/login', 'POST', {
      email: secureUser.email,
      password: secureUser.password
    });
    console.log(`Status: ${lockedLogin.statusCode} (Expected: 400)`);
    console.log('Message:', lockedLogin.body.message);
    if (lockedLogin.statusCode !== 400) throw new Error('Allowed login to a locked account');

    // Create another user to test successful sign-in & rotation
    console.log('\nCreating second user for token rotation checks...');
    const userB = {
      name: 'User Rotation',
      email: `rotation_${Date.now()}@example.com`,
      password: 'RotationPassword999!@#'
    };
    const regB = await runRequest('/api/auth/register', 'POST', userB);
    await runRequest('/api/auth/verify-email', 'POST', { token: regB.body.verifyToken });

    // -----------------------------------------------------------------
    // TEST 4: Login & Refresh Token Rotation (RTR)
    // -----------------------------------------------------------------
    console.log('\n[Test 4] Logging in and initiating Token Rotation...');
    const loginB = await runRequest('/api/auth/login', 'POST', {
      email: userB.email,
      password: userB.password
    });
    let token = loginB.body.token;
    let refreshToken = loginB.body.refreshToken;
    console.log('Tokens issued successfully.');

    console.log('Requesting new token family (Rotation 1)...');
    const rot1 = await runRequest('/api/auth/refresh', 'POST', { refreshToken });
    console.log(`Status: ${rot1.statusCode} (Expected: 200)`);
    if (rot1.statusCode !== 200) throw new Error('Token rotation 1 failed');
    const nextToken = rot1.body.token;
    const nextRefreshToken = rot1.body.refreshToken;

    // -----------------------------------------------------------------
    // TEST 5: Replay Attack Revocation
    // -----------------------------------------------------------------
    console.log('\n[Test 5] Simulating replay attack (re-submitting old refresh token)...');
    const rotReplay = await runRequest('/api/auth/refresh', 'POST', { refreshToken });
    console.log(`Status: ${rotReplay.statusCode} (Expected: 401)`);
    console.log('Message:', rotReplay.body.message);
    if (rotReplay.statusCode !== 401) throw new Error('Allowed reuse of refresh token');

    console.log('Verifying that new refresh token is also revoked due to family compromise...');
    const rotRevoked = await runRequest('/api/auth/refresh', 'POST', { refreshToken: nextRefreshToken });
    console.log(`Status: ${rotRevoked.statusCode} (Expected: 401)`);
    if (rotRevoked.statusCode !== 401) throw new Error('Rotation family remained active after compromise');

    // -----------------------------------------------------------------
    // TEST 6: Speakeasy MFA Setup Configurations
    // -----------------------------------------------------------------
    console.log('\n[Test 6] Testing MFA setup for authenticated user...');
    // Login again to get a fresh valid token
    const loginFresh = await runRequest('/api/auth/login', 'POST', {
      email: userB.email,
      password: userB.password
    });
    const freshToken = loginFresh.body.token;

    const mfaSetup = await runRequest('/api/auth/mfa/setup', 'GET', null, freshToken);
    console.log(`Status: ${mfaSetup.statusCode} (Expected: 200)`);
    console.log('Secret key generated:', mfaSetup.body.secret);
    if (mfaSetup.statusCode !== 200 || !mfaSetup.body.secret) throw new Error('MFA setup failed');

    // -----------------------------------------------------------------
    // TEST 7: Device Sessions log checks
    // -----------------------------------------------------------------
    console.log('\n[Test 7] Auditing logged devices...');
    const devices = await runRequest('/api/auth/devices', 'GET', null, freshToken);
    console.log(`Status: ${devices.statusCode} (Expected: 200)`);
    console.log('Active Sessions logged:', devices.body.length);
    console.log('Session item sample:', {
      deviceName: devices.body[0].deviceName,
      ip: devices.body[0].ip,
      isCurrent: devices.body[0].isCurrent
    });
    if (devices.statusCode !== 200 || devices.body.length === 0) throw new Error('Sessions log is empty');

    console.log('\n===================================================');
    console.log('STATUS: ALL SECURITY INTEGRATION TESTS COMPLETED SUCCESSFULLY!');
    console.log('===================================================');
    process.exit(0);

  } catch (err) {
    console.error('\nSTATUS: SECURITY INTEGRATION TEST SUITE ENCOUNTERED A FAILURE!');
    console.error('Error Stack:', err.message);
    process.exit(1);
  }
};

runTests();
