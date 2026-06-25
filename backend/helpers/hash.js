let argon2;
const bcrypt = require('bcryptjs');

try {
  argon2 = require('argon2');
  console.log('Argon2 loaded successfully for password security.');
} catch (err) {
  console.warn('Argon2 module load failed. Engaging bcryptjs password hashing fallback. Error:', err.message);
}

/**
 * Hashes a plain-text password using Argon2 or Bcrypt.
 * @param {string} password 
 * @returns {Promise<string>}
 */
const hashPassword = async (password) => {
  if (argon2) {
    try {
      return await argon2.hash(password);
    } catch (err) {
      console.error('Argon2 hashing error, falling back to bcryptjs:', err);
    }
  }
  const salt = await bcrypt.genSalt(12);
  return await bcrypt.hash(password, salt);
};

/**
 * Verifies a password against a hash (supports both Argon2 and Bcrypt formats).
 * @param {string} hash 
 * @param {string} password 
 * @returns {Promise<boolean>}
 */
const verifyPassword = async (hash, password) => {
  if (!hash || !password) return false;
  
  if (hash.startsWith('$argon2') && argon2) {
    try {
      return await argon2.verify(hash, password);
    } catch (err) {
      console.error('Argon2 verify error, falling back:', err);
    }
  }
  
  // Bcrypt prefix checks
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    try {
      return await bcrypt.compare(password, hash);
    } catch (err) {
      console.error('Bcrypt verify error:', err);
      return false;
    }
  }
  
  return false;
};

module.exports = {
  hashPassword,
  verifyPassword
};
