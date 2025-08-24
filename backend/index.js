const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const multer = require('multer');
const cloudinary = require('./cloudinary');
const fs = require("fs");

const upload = multer({ dest: 'uploads/' });//creates a folder where it puts images to hold temporarily
const app = express();
const port = 3002;

const url = "mongodb+srv://dfria006:cs100@cluster0.w1u0atk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(url);
const dbName = "Project0";

let db;

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(cookieParser());
app.use(express.json());

async function connectToDb() {
    try {
        await client.connect();
        console.log("Connected successfully to MongoDB");
        db = client.db(dbName);

        app.listen(port, () => {
            console.log(`Backend running at http://localhost:${port}`);
        });
    } catch (err) {
        console.error("Failed to connect to MongoDB", err);
        process.exit(1);
    }
}
connectToDb();

// Put Code For Routes Here!

// When user uploads an image 
app.post("/upload", upload.single('image'), async (req, res) => {
    try {
    const filePath = req.file.path;
    const {authorID, description, albumID, contestID } = req.body

    const result = await cloudinary.uploader.upload(filePath, {
      folder: 'cs110-photo-storage', //folder in cloudinary to store images
    });

    fs.unlinkSync(filePath);
     await db.collection("posts").insertOne({
        authorID: new ObjectId(authorID),
        url: result.secure_url, 
        createdAt: new Date(),
        description: description || "", 
        albumID: albumID ? new ObjectId(albumID) : null,
        contestID: contestID ? new ObjectId(contestID) : null,
        likes: 0
    });

    res.json({ url: result.secure_url });
  } catch (error) {
    console.error(error);
    res.status(500).send('Upload failed');
  }  
});

//currently returns all posts of just one user
app.get("/posts/:authorID", async (req, res) => {
  try {
    const authorID = req.params.authorID;

    const posts = await db
      .collection("posts")
      .find({ authorID: new ObjectId(authorID) })
      .sort({ createdAt: -1 })
      .toArray();

    res.json(posts);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch posts");
  }
});
app.get("/comments/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;

    const comments = await db
      .collection("comments")
      .find({ postId: new ObjectId(postId) })
      .sort({ createdAt: 1 }) // oldest to newest
      .toArray();

    res.json(comments);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch comments");
  }
});

app.post("/comments", async (req, res) => {
  try {
    const { postId, userId, text } = req.body;

    const newComment = {
      postId: new ObjectId(postId),
      userId: new ObjectId(userId),
      text,
      createdAt: new Date(),
    };

    const result = await db.collection("comments").insertOne(newComment);

    res.json({
      message: "Comment created successfully",
      commentId: result.insertedId, // MongoDB _id for the new comment
      ...newComment
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create comment" });
  }
});

app.post("/check-username", async (req, res) => {
    try {
        const { username } = req.body;

        // look for a user with the given username
        const user = await db.collection("users").findOne({ username });

        // if user is null, that means username is available
        res.json({ available: !user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error checking username " });
    }
});

app.post("/create", async (req, res) => {
    try {
        const { username, email, password } = req.body;

        const existingUser = await db.collection("users").findOne({ email });
        if (existingUser) {
            // 409 conflict for duplicate
            return res
                .status(409)
                .json({
                    error: "An account with this email address already exists.",
                });
        }

        // hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        const result = await db.collection("users").insertOne({
            username,
            email,
            password: hashedPassword,
        });

        res.status(201).json({ insertedId: result.insertedId });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to create user" });
    }
});

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        console.log("Attempting to find user with username:", username);

        const user = await db.collection("users").findOne({ username });

        console.log("Database found user:", user); 

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Invalid password" });
        }

        res.json({ message: "Login successful", userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});

app.get("/", (req, res) => {
    let visitCount = parseInt(req.cookies.visitCount) || 0;
    visitCount++;

    res.cookie("visitCount", visitCount.toString(), {
        maxAge: 900000,
        httpOnly: true,
    });

    res.send(`Welcome! You have visited this page ${visitCount} times.`);
});
