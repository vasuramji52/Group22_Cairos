// me.js
const { ObjectId } = require('mongodb');
const { requireAuth } = require('./auth.middleware');

exports.setApp = function setApp(app, client) {
  const db = client.db('COP4331Cards');

  // GET /me - dashboard data
  app.get('/me', requireAuth, async (req, res) => {
    try {
      const user = await db.collection('users').findOne(
        { _id: new ObjectId(req.userId) },
        { projection: { firstName:1, lastName:1, email:1, isVerified:1, google:1, createdAt:1, updatedAt:1 } }
      );
      if (!user) return res.status(404).json({ error: 'user_not_found' });

      // shape the response the UI wants
      res.json({
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          isVerified: user.isVerified,
          google: {
            connected: Boolean(user.google?.connected),
            accountId: user.google?.accountId || null
          },
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    } catch (e) {
      console.error('GET /me error:', e);
      res.status(500).json({ error: 'server_error' });
    }
  });
};
