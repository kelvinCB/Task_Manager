const {
  PERSONAL_ACCESS_TOKEN_PREFIX,
  hashToken,
  createPersonalAccessToken
} = require('../../utils/personalAccessTokens');

describe('personal access token utilities', () => {
  it('generates a prefixed token and stores only its hash metadata', () => {
    const generated = createPersonalAccessToken();

    expect(generated.token.startsWith(PERSONAL_ACCESS_TOKEN_PREFIX)).toBe(true);
    expect(generated.tokenHash).toBe(hashToken(generated.token));
    expect(generated.tokenPrefix).toBe(generated.token.slice(0, PERSONAL_ACCESS_TOKEN_PREFIX.length + 8));
    expect(generated.tokenHash).not.toContain(generated.token);
  });
});
