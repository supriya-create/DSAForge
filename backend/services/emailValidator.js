const dns = require('dns').promises;

// Set of common disposable email domains to block
const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com',
  '10minutemail.com',
  'tempmail.com',
  'yopmail.com',
  'guerrillamail.com',
  'sharklasers.com',
  'dispostable.com',
  'getairmail.com',
  'maildrop.cc',
  'trashmail.com',
  'temp-mail.org',
  'tempmailaddress.com',
  'fakeinbox.com',
  'generator.email',
  'throwawaymail.com'
]);

/**
 * Validates if an email is real and has a valid domain with active mail servers.
 * Allows test domains in development mode.
 * 
 * @param {string} email - Email address to validate
 * @returns {Promise<boolean>} - True if the email domain is real and active
 */
async function validateEmailIsReal(email) {
  if (!email || typeof email !== 'string') return false;

  // 1. Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return false;

  const parts = email.split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1].toLowerCase();

  // 2. Allow local/testing domains in development
  const isDev = process.env.NODE_ENV !== 'production';
  const allowedTestDomains = ['example.com', 'test.com', 'localhost', 'local'];
  if (isDev && allowedTestDomains.includes(domain)) {
    return true;
  }

  // 3. Block disposable domains
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return false;
  }

  // 4. DNS check: Look for MX (Mail Exchange) records to confirm it can receive mail
  try {
    const mxRecords = await dns.resolveMx(domain);
    if (mxRecords && mxRecords.length > 0) {
      return true;
    }
  } catch (error) {
    // If MX lookup fails, fall back to checking A (host address) records
    // Some small or internal setups route mail through the primary A record
    try {
      const aRecords = await dns.resolve(domain, 'A');
      return aRecords && aRecords.length > 0;
    } catch (aError) {
      // Both lookup attempts failed, domain doesn't exist or has no active servers
      return false;
    }
  }

  return false;
}

module.exports = {
  validateEmailIsReal
};
