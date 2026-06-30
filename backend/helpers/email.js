const https = require('https');

/**
 * Sends an email using the Resend API.
 * @param {Object} options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content of the email
 * @returns {Promise<Object>} Resend response
 */
const sendEmail = ({ to, subject, html }) => {
  return new Promise((resolve, reject) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      const errorMsg = 'RESEND_API_KEY is not configured in the environment variables.';
      console.warn(`[EMAIL WARNING] ${errorMsg}`);
      return reject(new Error(errorMsg));
    }

    // Resend Free Tier sandbox limitation: can only send to the registered owner's email.
    // We redirect all test emails to your real Gmail (syedshahid7650@gmail.com) so they actually deliver.
    const recipient = 'syedshahid7650@gmail.com';

    const data = JSON.stringify({
      from: 'Veritas AI <onboarding@resend.dev>',
      to: [recipient],
      subject: `${subject} (For: ${to})`,
      html: html
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    };

    const req = https.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(responseBody));
          } catch (e) {
            resolve({ success: true, message: 'Email sent successfully (response parsed with errors)' });
          }
        } else {
          reject(new Error(`Resend API returned status ${res.statusCode}: ${responseBody}`));
        }
      });
    });

    req.on('error', (err) => {
      console.error('[EMAIL ERROR] Failed to send email:', err.message);
      reject(err);
    });

    req.write(data);
    req.end();
  });
};

module.exports = { sendEmail };
