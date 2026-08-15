const crypto = require('crypto');

const PERSONAL_ACCESS_TOKEN_PREFIX = 'kolium_pat_';
const PERSONAL_ACCESS_TOKEN_PREFIX_LENGTH = PERSONAL_ACCESS_TOKEN_PREFIX.length + 8;

const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const createPersonalAccessToken = () => {
  const token = `${PERSONAL_ACCESS_TOKEN_PREFIX}${crypto.randomBytes(32).toString('base64url')}`;

  return {
    token,
    tokenHash: hashToken(token),
    tokenPrefix: token.slice(0, PERSONAL_ACCESS_TOKEN_PREFIX_LENGTH)
  };
};

module.exports = {
  PERSONAL_ACCESS_TOKEN_PREFIX,
  hashToken,
  createPersonalAccessToken
};
