const express = require('express');
const { authenticateUser } = require('../middlewares/authMiddleware');
const {
  requireSupabaseSession,
  listPersonalAccessTokens,
  createToken,
  revokeToken
} = require('../controllers/personalAccessTokenController');

const router = express.Router();

router.use(authenticateUser, requireSupabaseSession);
router.get('/', listPersonalAccessTokens);
router.post('/', createToken);
router.post('/:id/revoke', revokeToken);

module.exports = router;
