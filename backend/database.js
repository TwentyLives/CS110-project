const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3002;

const url = 'mongodb+srv://EventSnapTeam:CS110GROUPPSW@eventsnapdatabase.te31njv.mongodb.net/?retryWrites=true&w=majority&appName=EventSnapDatabase';
const client = new MongoClient(url);
const dbName = 'eventSnapDB';

let db;

app.use(cors({ origin: "http://localhost:3000", credentials: true })); 
app.use(cookieParser()); 
app.use(express.json());

async function connectToDb() {
  try {
    await client.connect();
    console.log('Connected successfully to MongoDB');
    db = client.db(dbName); 

    app.listen(port, () => {
      console.log(`Backend running at http://localhost:${port}`);
    });
  } catch (err) {
    console.error('Failed to connect to MongoDB', err);
    process.exit(1); 
  }
}
connectToDb();

// Put Code For Routes Here!

app.post('/create', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    const result = await db.collection('users').insertOne({
      username,
      email,
      password
    });

    res.status(201).json({ insertedId: result.insertedId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.password !== password) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    res.json({ message: 'Login successful', userId: user._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/', (req, res) => {
  let visitCount = parseInt(req.cookies.visitCount) || 0;
  visitCount++;

  res.cookie('visitCount', visitCount.toString(), { maxAge: 900000, httpOnly: true });

  res.send(`Welcome! You have visited this page ${visitCount} times.`);
});
