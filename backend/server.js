require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors = require('cors');
const app = express();
const { MongoClient } = require('mongodb');

const url = process.env.MONGODB_URI;
if (!url) {
  console.error('❌ MONGODB_URI is missing. Check backend/.env');
  process.exit(1);
}
const client = new MongoClient(url);
client.connect();

app.use(cors());
app.use(express.json());

// local API path:
const api = require('./api.js');
api.setApp(app, client);

// require('dotenv').config({ path: __dirname + '/api/backend/.env' });

// const express = require('express');
// const cors = require('cors');
// const app = express();
// const MongoClient = require('mongodb').MongoClient;
// const url = process.env.MONGODB_URI;
// if (!url) {
//   console.error('❌ MONGODB_URI is missing. Check backend/.env');
//   process.exit(1);
// }
// const client = new MongoClient(url);
// client.connect();

// app.use(cors());
// // app.use(bodyParser.json());
// app.use(express.json());

// var api = require('./api/backend/api.js');
// api.setApp( app, client );


// var cardList =
//     [
//         ''
//     ];



// app.use((req, res, next) => {
//     app.get("/api/ping", (req, res, next) => {
//         res.status(200).json({ message: "Hello World" });
//     });
//     res.setHeader('Access-Control-Allow-Origin', '*');
//     res.setHeader(
//         'Access-Control-Allow-Headers',
//         'Origin, X-Requested-With, Content-Type, Accept, Authorization'
//     );
//     res.setHeader(
//         'Access-Control-Allow-Methods',
//         'GET, POST, PATCH, DELETE, OPTIONS'
//     );
//     next();
// });

// app.post('/api/addcard', async (req, res, next) => {
//     // incoming: userId, color
//     // outgoing: error
//     const { userId, card } = req.body;
//     const newCard = { Card: card, UserId: userId };
//     var error = '';
//     try {
//         const db = client.db('COP4331Cards');
//         const result = db.collection('Cards').insertOne(newCard);
//     }
//     catch (e) {
//         error = e.toString();
//     }
//     cardList.push(card);
//     var ret = { error: error };
//     res.status(200).json(ret);
// });

// app.post('/api/login', async (req, res, next) => {
//     // incoming: login, password
//     // outgoing: id, firstName, lastName, error
//     var error = '';
//     const { login, password } = req.body;
//     const db = client.db('COP4331Cards');
//     const results = await db.collection('Users').find({ Login: login, Password: password }).toArray();
//     var id = -1;
//     var fn = '';
//     var ln = '';
//     if (results.length > 0) {
//         id = results[0].UserID;
//         fn = results[0].FirstName;
//         ln = results[0].LastName;
//     }
//     var ret = { id: id, firstName: fn, lastName: ln, error: '' };
//     res.status(200).json(ret);
// });

// app.post('/api/register', async (req, res) => {
//     // incoming: firstName, lastName, login, password
//     // outgoing: success message or error
//     const { firstName, lastName, login, password } = req.body;
//     let error = '';

//     try {
//         const db = client.db('COP4331Cards');
//         const users = db.collection('Users');

//         // check if user already exists
//         const existingUser = await users.findOne({ Login: login });
//         if (existingUser) {
//             return res.status(200).json({ message: 'User already exists', error: '' });
//         }

//         // get next available UserID
//         const lastUser = await users.find().sort({ UserID: -1 }).limit(1).toArray();
//         const nextId = lastUser.length > 0 ? lastUser[0].UserID + 1 : 1;

//         // insert user
//         await users.insertOne({
//             UserID: nextId,
//             FirstName: firstName,
//             LastName: lastName,
//             Login: login,
//             Password: password
//         });

//         res.status(200).json({ message: 'User created successfully', error: '' });
//     } catch (e) {
//         error = e.toString();
//         res.status(500).json({ error });
//     }
// });

// app.post('/api/searchcards', async (req, res, next) => {
//     // incoming: userId, search
//     // outgoing: results[], error
//     var error = '';
//     const { userId, search } = req.body;
//     var _search = search.trim();

//     const db = client.db('COP4331Cards');
//     const results = await db.collection('Cards').find({ "Card": { $regex: _search + '.*', $options: 'i' } }).toArray();

//     var _ret = [];
//     for (var i = 0; i < results.length; i++) {
//         _ret.push(results[i].Card);
//     }

//     var ret = { results: _ret, error: error };
//     res.status(200).json(ret);

// });

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
});
