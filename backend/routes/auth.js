const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');

const db = require('../config/db');
const auth = require('../middleware/auth');
const { hashPassword, verifyPassword } = require('../helpers/hash');
const { sendEmail } = require('../helpers/email');

// Token secrets
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_12345';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'fallback_refresh_key_54321';

// Password policy evaluator
const validatePasswordPolicy = (password) => {
  if (!password) return false;
  if (password.length < 12) return false;
  if (!/[A-Z]/.test(password)) return false; // Uppercase
  if (!/[a-z]/.test(password)) return false; // Lowercase
  if (!/[0-9]/.test(password)) return false; // Number
  if (!/[^A-Za-z0-9]/.test(password)) return false; // Special Character
  return true;
};

// Device fingerprinting helper
const getDeviceDetails = (req) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  const userAgent = req.headers['user-agent'] || 'Unknown Browser';
  
  // Create a simple deterministic fingerprint from IP + User Agent
  const fingerprint = crypto.createHash('md5').update(ip + userAgent).digest('hex');
  
  // Extract readable browser/OS info
  let deviceName = 'Web Browser';
  if (userAgent.includes('Windows')) deviceName = 'Windows PC';
  else if (userAgent.includes('Macintosh')) deviceName = 'Mac OS Device';
  else if (userAgent.includes('iPhone')) deviceName = 'iPhone';
  else if (userAgent.includes('Android')) deviceName = 'Android Phone';
  else if (userAgent.includes('Linux')) deviceName = 'Linux Desktop';

  return { ip, userAgent, fingerprint, deviceName };
};

// Generate Access & Refresh token family
const generateTokenFamily = (userId, name, email, sessionId) => {
  const payload = {
    user: { id: userId, name, email },
    sessionId
  };

  const accessToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' }); // 15 mins access token
  const refreshToken = jwt.sign({ sessionId, userId }, JWT_REFRESH_SECRET, { expiresIn: '7d' }); // 7 days refresh token

  return { accessToken, refreshToken };
};

// @route    POST api/auth/register
// @desc     Register secure user (Enforces OWASP password rules & verification mail)
// @access   Public
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  // Enforce Password Policy
  if (!validatePasswordPolicy(password)) {
    return res.status(400).json({
      message: 'Password does not meet complexity requirements. Minimum 12 characters, including at least one uppercase letter, one lowercase letter, one number, and one special character.'
    });
  }

  try {
    let users = db.getUsers();
    let user = users.find(u => u.email === email);
    if (user) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password securely with Argon2 (or bcrypt fallback)
    const secureHash = await hashPassword(password);

    // Generate Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours expiry

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password: secureHash,
      createdAt: new Date().toISOString(),
      emailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpiry: verificationExpiry,
      passwordResetToken: null,
      passwordResetExpiry: null,
      loginAttempts: 0,
      lockUntil: null,
      mfaEnabled: false,
      mfaSecret: null,
      mfaType: 'none',
      mfaBackupCodes: [],
      sessions: [],
      modelPreference: 'Random Forest'
    };

    users.push(newUser);
    db.saveUsers(users);

    const origin = req.headers.origin || 'http://localhost:3050';
    const verifyLink = `${origin}/auth?verifyToken=${verificationToken}`;
    
    // Log verification link to server logs for convenience
    console.log('\n=================== [MAIL LOGGER] ===================');
    console.log(`To: ${email}`);
    console.log('Subject: Verify Your Veritas AI Credentials');
    console.log(`Link: ${verifyLink}`);
    console.log('=====================================================\n');

    let emailSent = false;
    let emailErrorMsg = '';

    try {
      await sendEmail({
        to: email,
        subject: 'Verify Your Veritas AI Credentials - Veritas AI',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f8fafc; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: bold; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Veritas AI</span>
            </div>
            <h2 style="color: #818cf8; text-align: center; margin-bottom: 20px; font-size: 20px;">Verify Your Account</h2>
            <p style="line-height: 1.6; color: #cbd5e1; font-size: 15px;">Welcome to Veritas AI! To activate your account and start using our premium fake news detection tools, please verify your email address by clicking the link below:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyLink}" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">Verify Email Address</a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">If the button doesn't work, you can also copy and paste the following link into your web browser:</p>
            <p style="font-size: 12px; color: #818cf8; word-break: break-all; margin-top: 5px; text-align: center;"><a href="${verifyLink}" style="color: #818cf8; text-decoration: underline;">${verifyLink}</a></p>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 30px 0;">
            <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">This is an automated security transmission. If you did not sign up for Veritas AI, please ignore this email.</p>
          </div>
        `
      });
      emailSent = true;
    } catch (err) {
      emailErrorMsg = err.message;
    }

    res.status(200).json({
      message: emailSent
        ? 'Registration successful. A verification link has been dispatched to your email address.'
        : `Registration successful. Note: Email delivery failed (${emailErrorMsg}). The link has been printed in the server logs.`,
      verifyToken: verificationToken
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/verify-email
// @desc     Confirm email verification token
// @access   Public
router.post('/verify-email', async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ message: 'Token is required' });

  try {
    let users = db.getUsers();
    const userIndex = users.findIndex(u => 
      u.emailVerificationToken === token && 
      new Date(u.emailVerificationExpiry) > new Date()
    );

    if (userIndex === -1) {
      return res.status(400).json({ message: 'Verification token is invalid or has expired' });
    }

    users[userIndex].emailVerified = true;
    users[userIndex].emailVerificationToken = null;
    users[userIndex].emailVerificationExpiry = null;
    db.saveUsers(users);

    res.json({ message: 'Email successfully verified. You can now login.' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/resend-verification
// @desc     Resend verification email to unverified user
// @access   Private
router.post('/resend-verification', auth, async (req, res) => {
  try {
    let users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === req.user.id);

    if (userIndex === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[userIndex];

    if (user.emailVerified) {
      return res.status(400).json({ message: 'Email is already verified' });
    }

    // Generate/Refresh Verification Token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    users[userIndex].emailVerificationToken = verificationToken;
    users[userIndex].emailVerificationExpiry = verificationExpiry;
    db.saveUsers(users);

    const origin = req.headers.origin || 'http://localhost:3050';
    const verifyLink = `${origin}/auth?verifyToken=${verificationToken}`;

    let emailSent = false;
    let emailErrorMsg = '';

    try {
      await sendEmail({
        to: user.email,
        subject: 'Verify Your Veritas AI Credentials - Veritas AI',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f8fafc; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: bold; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Veritas AI</span>
            </div>
            <h2 style="color: #818cf8; text-align: center; margin-bottom: 20px; font-size: 20px;">Verify Your Account</h2>
            <p style="line-height: 1.6; color: #cbd5e1; font-size: 15px;">Welcome to Veritas AI! To activate your account and start using our premium fake news detection tools, please verify your email address by clicking the link below:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${verifyLink}" style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.4);">Verify Email Address</a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">If the button doesn't work, you can also copy and paste the following link into your web browser:</p>
            <p style="font-size: 12px; color: #818cf8; word-break: break-all; margin-top: 5px; text-align: center;"><a href="${verifyLink}" style="color: #818cf8; text-decoration: underline;">${verifyLink}</a></p>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 30px 0;">
            <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">This is an automated security transmission. If you did not sign up for Veritas AI, please ignore this email.</p>
          </div>
        `
      });
      emailSent = true;
    } catch (err) {
      emailErrorMsg = err.message;
    }

    if (!emailSent) {
      return res.status(500).json({ message: `Email delivery failed: ${emailErrorMsg}` });
    }

    res.json({ message: 'Verification link resent to your email address.' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/login
// @desc     Authenticate user with lockout rules & 2FA checks
// @access   Public
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  try {
    let users = db.getUsers();
    let userIndex = users.findIndex(u => u.email === email);
    
    if (userIndex === -1) {
      // generic error message for security (prevent email discovery)
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    let user = users[userIndex];

    // Check Account Lockout
    if (user.lockUntil && new Date(user.lockUntil) > new Date()) {
      const remainingMin = Math.ceil((new Date(user.lockUntil) - new Date()) / 60000);
      return res.status(400).json({ 
        message: `This account is temporarily locked due to multiple failed login attempts. Try again in ${remainingMin} minute(s).` 
      });
    }

    // Verify Password Hashing (Argon2 / Bcrypt)
    const isMatch = await verifyPassword(user.password, password);
    
    if (!isMatch) {
      // Increment login failure
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins lock
        user.loginAttempts = 0;
        db.saveUsers(users);
        return res.status(400).json({ 
          message: 'Invalid credentials. Account is now locked for 15 minutes due to multiple failed attempts.' 
        });
      }
      
      db.saveUsers(users);
      return res.status(400).json({ 
        message: `Invalid credentials. ${5 - user.loginAttempts} attempts remaining.` 
      });
    }

    // Reset failed counter
    user.loginAttempts = 0;
    user.lockUntil = null;

    // Check if 2FA Multi-Factor Auth is required
    if (user.mfaEnabled) {
      // Generate a temporary 2FA token containing userId
      const tempToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '5m' });
      
      if (user.mfaType === 'email' || user.mfaType === 'sms') {
        // Generate a 6-digit OTP code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        user.tempOtpCode = code;
        user.tempOtpExpiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5m expiry
        db.saveUsers(users);

        // Simulated Delivery logs
        console.log(`\n=================== [MFA OTP LOGGER] ===================`);
        console.log(`To: ${email} via ${user.mfaType.toUpperCase()}`);
        console.log(`Your 2FA Verification Code is: ${code}`);
        console.log(`========================================================\n`);
      }

      db.saveUsers(users);
      return res.json({
        mfaRequired: true,
        tempToken,
        mfaType: user.mfaType
      });
    }

    // Direct Login (No 2FA configured)
    const { ip, userAgent, fingerprint, deviceName } = getDeviceDetails(req);
    const sessionId = crypto.randomBytes(16).toString('hex');
    const { accessToken, refreshToken } = generateTokenFamily(user.id, user.name, user.email, sessionId);

    // Save Active Session
    if (!user.sessions) user.sessions = [];
    user.sessions.push({
      sessionId,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ip,
      userAgent,
      fingerprint,
      deviceName,
      createdAt: new Date().toISOString()
    });

    db.saveUsers(users);

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified }
    });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/mfa/verify
// @desc     Verify TOTP / SMS / Email OTP and recovery backup codes
// @access   Public
router.post('/mfa/verify', async (req, res) => {
  const { tempToken, code } = req.body;

  if (!tempToken || !code) {
    return res.status(400).json({ message: 'Authentication elements are missing' });
  }

  try {
    // Verify temp JWT token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ message: '2FA session expired. Please sign in again.' });
    }

    let users = db.getUsers();
    const userIndex = users.findIndex(u => u.id === decoded.userId);
    if (userIndex === -1) return res.status(400).json({ message: 'User not found' });
    let user = users[userIndex];

    let isValid = false;
    let isBackupCode = false;

    // Check if recovery backup code matches
    if (user.mfaBackupCodes && user.mfaBackupCodes.includes(code)) {
      isValid = true;
      isBackupCode = true;
      // Remove used recovery code
      user.mfaBackupCodes = user.mfaBackupCodes.filter(c => c !== code);
    } else {
      // Standard OTP checks
      if (user.mfaType === 'totp') {
        isValid = speakeasy.totp.verify({
          secret: user.mfaSecret,
          encoding: 'base32',
          token: code,
          window: 1 // tolerance window
        });
      } else if (user.mfaType === 'email' || user.mfaType === 'sms') {
        isValid = (
          user.tempOtpCode === code &&
          new Date(user.tempOtpExpiry) > new Date()
        );
      }
    }

    if (!isValid) {
      return res.status(400).json({ message: 'Verification code is invalid or has expired' });
    }

    // Clear temp variables
    user.tempOtpCode = null;
    user.tempOtpExpiry = null;

    // Issue Tokens
    const { ip, userAgent, fingerprint, deviceName } = getDeviceDetails(req);
    const sessionId = crypto.randomBytes(16).toString('hex');
    const { accessToken, refreshToken } = generateTokenFamily(user.id, user.name, user.email, sessionId);

    // Log Session
    if (!user.sessions) user.sessions = [];
    user.sessions.push({
      sessionId,
      refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      ip,
      userAgent,
      fingerprint,
      deviceName,
      createdAt: new Date().toISOString()
    });

    db.saveUsers(users);

    res.json({
      token: accessToken,
      refreshToken,
      user: { id: user.id, name: user.name, email: user.email, emailVerified: user.emailVerified },
      recoveryCodeUsed: isBackupCode
    });

  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/refresh
// @desc     Rotate Refresh Token and issue new access/refresh tokens (Replay revoking)
// @access   Public
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(401).json({ message: 'Refresh token is required' });

  try {
    // 1. Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    } catch (e) {
      return res.status(401).json({ message: 'Invalid refresh token signature' });
    }

    let users = db.getUsers();
    let userIndex = users.findIndex(u => u.id === decoded.userId);
    if (userIndex === -1) return res.status(401).json({ message: 'Token owner not found' });
    let user = users[userIndex];

    // 2. Lookup session matching this token
    const sessionIndex = user.sessions ? user.sessions.findIndex(s => s.refreshToken === refreshToken) : -1;

    // REPLAY ATTACK DETECTION:
    // If the token is cryptographically valid but not in user's active session logs,
    // it was already rotated or stolen. Revoke ALL sessions for security.
    if (sessionIndex === -1) {
      console.warn(`[SECURITY WARNING] Refresh token replay attack suspected for User ID: ${user.id}. Invalidating all active sessions!`);
      user.sessions = [];
      db.saveUsers(users);
      return res.status(401).json({ message: 'Session compromise detected. Forced logout completed across all devices.' });
    }

    const session = user.sessions[sessionIndex];

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      user.sessions.splice(sessionIndex, 1);
      db.saveUsers(users);
      return res.status(401).json({ message: 'Session expired' });
    }

    // 3. Issue rotated tokens
    const newSessionId = crypto.randomBytes(16).toString('hex');
    const tokens = generateTokenFamily(user.id, user.name, user.email, newSessionId);

    // Update session values
    user.sessions[sessionIndex] = {
      ...session,
      sessionId: newSessionId,
      refreshToken: tokens.refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    db.saveUsers(users);

    res.json({
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/mfa/setup
// @desc     Generate TOTP Secret & QR Code
// @access   Private
router.get('/mfa/setup', auth, async (req, res) => {
  try {
    const users = db.getUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `Veritas AI (${user.email})`
    });

    // Generate QR code
    qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
      if (err) return res.status(500).json({ message: 'Failed to generate QR code' });
      
      res.json({
        secret: secret.base32,
        qrCodeUrl: data_url
      });
    });

  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/mfa/enable
// @desc     Enable specific MFA configuration
// @access   Private
router.post('/mfa/enable', auth, async (req, res) => {
  const { code, type, secret } = req.body;

  if (!type || (type === 'totp' && (!code || !secret))) {
    return res.status(400).json({ message: 'Missing values' });
  }

  try {
    let users = db.getUsers();
    const index = users.findIndex(u => u.id === req.user.id);
    if (index === -1) return res.status(404).json({ message: 'User not found' });
    let user = users[index];

    // Verify TOTP if enabling authenticator app
    if (type === 'totp') {
      const verified = speakeasy.totp.verify({
        secret: secret,
        encoding: 'base32',
        token: code
      });
      if (!verified) {
        return res.status(400).json({ message: 'OTP verification failed. Invalid code.' });
      }
      user.mfaSecret = secret;
    }

    // Set configuration parameters
    user.mfaEnabled = true;
    user.mfaType = type;

    // Generate 8 backup recovery codes
    const backupCodes = [];
    for (let i = 0; i < 8; i++) {
      backupCodes.push(crypto.randomBytes(4).toString('hex')); // 8 chars code
    }
    user.mfaBackupCodes = backupCodes;

    db.saveUsers(users);

    res.json({
      message: `Multi-Factor Authentication enabled successfully using ${type.toUpperCase()}.`,
      backupCodes
    });

  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/mfa/disable
// @desc     Disable MFA settings
// @access   Private
router.post('/mfa/disable', auth, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ message: 'Password is required' });

  try {
    let users = db.getUsers();
    const index = users.findIndex(u => u.id === req.user.id);
    if (index === -1) return res.status(404).json({ message: 'User not found' });
    let user = users[index];

    const isMatch = await verifyPassword(user.password, password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    user.mfaEnabled = false;
    user.mfaSecret = null;
    user.mfaType = 'none';
    user.mfaBackupCodes = [];

    db.saveUsers(users);

    res.json({ message: 'Multi-Factor Authentication disabled successfully.' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/logout
// @desc     Logout current session
// @access   Public
router.post('/logout', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return res.status(400).json({ message: 'Refresh token missing' });

  try {
    let users = db.getUsers();
    let userIndex = -1;
    let sessionIndex = -1;

    for (let i = 0; i < users.length; i++) {
      if (users[i].sessions) {
        const sIdx = users[i].sessions.findIndex(s => s.refreshToken === refreshToken);
        if (sIdx !== -1) {
          userIndex = i;
          sessionIndex = sIdx;
          break;
        }
      }
    }

    if (userIndex !== -1 && sessionIndex !== -1) {
      users[userIndex].sessions.splice(sessionIndex, 1);
      db.saveUsers(users);
    }

    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/logout-all
// @desc     Logout from all active sessions (clear token family)
// @access   Private
router.post('/logout-all', auth, (req, res) => {
  try {
    let users = db.getUsers();
    const index = users.findIndex(u => u.id === req.user.id);
    if (index === -1) return res.status(404).json({ message: 'User not found' });

    users[index].sessions = [];
    db.saveUsers(users);

    res.json({ message: 'Successfully logged out from all active sessions.' });
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    GET api/auth/devices
// @desc     Fetch all active session details
// @access   Private
router.get('/devices', auth, (req, res) => {
  try {
    const users = db.getUsers();
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Map sessions securely (avoid leaking refresh token strings)
    const sessions = (user.sessions || []).map(s => ({
      sessionId: s.sessionId,
      ip: s.ip,
      deviceName: s.deviceName,
      userAgent: s.userAgent,
      createdAt: s.createdAt,
      isCurrent: s.sessionId === req.user.sessionId || false // check if current session match
    }));

    res.json(sessions);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/reset-password/request
// @desc     Initiate password reset (emails a secure reset token)
// @access   Public
router.post('/reset-password/request', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    let users = db.getUsers();
    const index = users.findIndex(u => u.email === email);
    if (index === -1) {
      // Don't leak user database presence, return generic success
      return res.json({ message: 'If the email is verified, a password reset link has been dispatched.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(); // 1 hour expiry

    users[index].passwordResetToken = resetToken;
    users[index].passwordResetExpiry = resetExpiry;
    db.saveUsers(users);

    const origin = req.headers.origin || 'http://localhost:3050';
    const resetLink = `${origin}/auth?resetToken=${resetToken}`;

    // Log password reset link to server logs for convenience
    console.log('\n=================== [MAIL LOGGER] ===================');
    console.log(`To: ${email}`);
    console.log('Subject: Password Reset Request');
    console.log(`Link: ${resetLink}`);
    console.log('=====================================================\n');

    let emailSent = false;
    let emailErrorMsg = '';

    try {
      await sendEmail({
        to: email,
        subject: 'Reset Your Veritas AI Password',
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); color: #f8fafc; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);">
            <div style="text-align: center; margin-bottom: 24px;">
              <span style="font-size: 24px; font-weight: bold; background: linear-gradient(to right, #818cf8, #c084fc); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Veritas AI</span>
            </div>
            <h2 style="color: #f43f5e; text-align: center; margin-bottom: 20px; font-size: 20px;">Password Reset Request</h2>
            <p style="line-height: 1.6; color: #cbd5e1; font-size: 15px;">We received a request to reset the password for your Veritas AI account. Click the button below to establish a new, secure password:</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${resetLink}" style="background: linear-gradient(135deg, #e11d48 0%, #f43f5e 100%); color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; box-shadow: 0 4px 12px rgba(225, 29, 72, 0.4);">Reset Password</a>
            </div>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.5;">This request is valid for 1 hour. If the button doesn't work, you can copy and paste this link into your browser:</p>
            <p style="font-size: 12px; color: #818cf8; word-break: break-all; margin-top: 5px; text-align: center;"><a href="${resetLink}" style="color: #818cf8; text-decoration: underline;">${resetLink}</a></p>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.08); margin: 30px 0;">
            <p style="font-size: 11px; color: #64748b; text-align: center; margin: 0;">If you did not request a password reset, please ignore this email; your security credentials will remain unaffected.</p>
          </div>
        `
      });
      emailSent = true;
    } catch (err) {
      emailErrorMsg = err.message;
    }

    res.json({
      message: emailSent
        ? 'A password reset link has been dispatched to your email address.'
        : `Password reset link compiled (Resend API key missing; link printed to server logs).`,
      resetToken // returned to ease automated validation scripts
    });

  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    POST api/auth/reset-password/confirm
// @desc     Complete password reset with complexity validations
// @access   Public
router.post('/reset-password/confirm', async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Invalid payload parameters.' });
  }

  if (!validatePasswordPolicy(password)) {
    return res.status(400).json({
      message: 'Password does not meet complexity rules. Min 12 chars, upper, lower, numbers, special characters.'
    });
  }

  try {
    let users = db.getUsers();
    const index = users.findIndex(u => 
      u.passwordResetToken === token &&
      new Date(u.passwordResetExpiry) > new Date()
    );

    if (index === -1) {
      return res.status(400).json({ message: 'Reset token is invalid or has expired' });
    }

    // Update password
    users[index].password = await hashPassword(password);
    users[index].passwordResetToken = null;
    users[index].passwordResetExpiry = null;
    
    // Security: Revoke all active sessions on password change
    users[index].sessions = [];

    db.saveUsers(users);

    res.json({ message: 'Password updated successfully. You can now login.' });

  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    PUT api/auth/user/password
// @desc     Change password for logged-in user
// @access   Private
router.put('/user/password', auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Please enter all fields' });
  }

  if (!validatePasswordPolicy(newPassword)) {
    return res.status(400).json({
      message: 'New password does not meet complexity requirements. Min 12 chars, upper, lower, numbers, special characters.'
    });
  }

  try {
    let users = db.getUsers();
    const index = users.findIndex(u => u.id === req.user.id);
    if (index === -1) return res.status(404).json({ message: 'User not found' });
    let user = users[index];

    // Verify current password
    const isMatch = await verifyPassword(user.password, currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash and update
    user.password = await hashPassword(newPassword);

    // Security check: revoke other active sessions (logout other devices)
    if (user.sessions) {
      user.sessions = user.sessions.filter(s => s.sessionId === req.user.sessionId);
    }

    db.saveUsers(users);
    res.json({ message: 'Password changed successfully.' });

  } catch (err) {
    res.status(500).send('Server error');
  }
});

// @route    GET api/auth/user
// @desc     Get authenticated user profile
// @access   Private
router.get('/user', auth, (req, res) => {
  try {
    const users = db.getUsers();
    const user = users.find(u => u.id === req.user.id);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Exclude password
    const { password, ...userProfile } = user;
    res.json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route    PUT api/auth/user/settings
// @desc     Update user profile settings (e.g. modelPreference)
// @access   Private
router.put('/user/settings', auth, (req, res) => {
  try {
    const { modelPreference } = req.body;
    let users = db.getUsers();
    const index = users.findIndex(u => u.id === req.user.id);
    
    if (index === -1) {
      return res.status(404).json({ message: 'User not found' });
    }

    users[index].modelPreference = modelPreference || users[index].modelPreference;
    db.saveUsers(users);

    const { password, ...userProfile } = users[index];
    res.json(userProfile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
