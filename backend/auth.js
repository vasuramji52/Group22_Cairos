const bcrypt = require('bcryptjs');
const jwtLib = require('./createJWT.js');

exports.setApp = function (app, client) 
{
  app.get('/api/ping', (_req, res) => res.json({ ok: true }));
  const db = client.db('COP4331Cards');

  /*app.get('/api/_db_probe', async (_req, res) => {
  try {
    const dbName = db.databaseName; // should be "COP4331Cards"
    const colls = await db.listCollections().toArray();
    const usersCol = db.collection('users');
    const count = await usersCol.estimatedDocumentCount();
    const sample = await usersCol.find({}, { projection: { email: 1 } }).limit(5).toArray();

    res.json({
      connectedDb: dbName,
      collections: colls.map(c => c.name),
      usersCount: count,
      sampleEmails: sample.map(d => d.email)
    });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
}); */

//Register without email verification
  app.post('/api/register', async (req, res) => 
  {
    // input: firstName, lastName, email, password
    // output: jwtToken or error
    try {
      const { firstName, lastName, email, password } = req.body;

      //stuff missing
      if (!firstName || !lastName || !email || !password)
        return res.status(400).json({ error: 'missing_fields' });

      const normalizedEmail = email.toLowerCase().trim();

      //email already exists
      const existingUser = await db.collection('users').findOne({ email: normalizedEmail });
     
      if (existingUser)
        return res.status(409).json({ error: 'User already exists' });

      const passwordHash = await bcrypt.hash(password, 10);

      const newUser = 
      {
        firstName: firstName,
        lastName: lastName,
        email: normalizedEmail,
        passwordHash,
        isVerified: false,
        google: { connected: false, accountId: null },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const result = await db.collection('users').insertOne(newUser);

      const token = jwtLib.createToken(firstName, lastName, result.insertedId);
      res.status(200).json(token);
    } 
    catch (e) 
    {
      console.error('Register error:', e);
      res.status(500).json({ error: e.toString() });
    }
  });

  // login 
  app.post('/api/login', async (req, res) => 
    {
    console.log('Reached /api/login route');
    // input: email, password
    // output: jwt token or error
    try 
    {
      const { email, password } = req.body;      
      const normalizedEmail = String(email).toLowerCase().trim();

      if (!email || !password)
        return res.status(400).json({ error: 'missing_fields' });

      const user = await db.collection('users').findOne({ email: normalizedEmail });
      if (!user)
        return res.status(401).json({ error: 'Invalid email' });

      if(!user.isVerified)
        return res.status(401).json({ error: 'User email not verified' });

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid)
        return res.status(401).json({ error: 'Invalid password' });

      //creates token
      const token = jwtLib.createToken(user.firstName, user.lastName, user._id);
      res.status(200).json(token);
    } 
    catch (e) 
    {
      console.error('Login error:', e);
      res.status(500).json({ error: e.toString() });
    }
  });
};
