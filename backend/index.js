require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcrypt");
const multer = require("multer");
const cloudinary = require("./cloudinary");
const fs = require("fs");
const { create } = require("domain");
const jwt = require("jsonwebtoken");

const upload = multer({ dest: "uploads/" }); //creates a folder where it puts images to hold temporarily
const app = express();
const port = 3002;

const url =
    "mongodb+srv://EventSnapTeam:CS110GROUPPSW@eventsnapdatabase.te31njv.mongodb.net/?retryWrites=true&w=majority&appName=EventSnapDatabase";
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

// get a user profile data (info and albums)
app.get("/profile/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID" });
        }

        // get user info
        const user = await db.collection("users").findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } } // dont send password
        );

        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // get all albums user is in
        const albums = await db
            .collection("albums")
            .find({ participants: new ObjectId(userId) })
            .sort({ createdAt: -1 })
            .toArray();

        // send user and albums
        res.json({ user, albums });
    } catch (error) {
        console.error("Failed to fetch profile:", error);
        res.status(500).json({ error: "Failed to fetch profile data" });
    }
});

// update a user profile
app.put("/profile/:userId", upload.single("avatar"), async (req, res) => {
    try {
        const { userId } = req.params;
        const { username, bio } = req.body;
        let avatarUrl;

        if (username) {
            // check if username taken
            const existingUser = await db.collection("users").findOne({ username: username });

            // if user found and not the same person
            if (existingUser && existingUser._id.toString() !== userId) {
                return res.status(409).json({ error: "Username is already taken." });
            }
        }

        if (req.file) {
            // if new avatar, upload it
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "cs110-avatars",
            });
            avatarUrl = result.secure_url;
            fs.unlinkSync(req.file.path); // delete temp file
        }

        const updateData = {};
        if (username) updateData.username = username;
        if (bio) updateData.bio = bio;
        if (avatarUrl) updateData.avatarUrl = avatarUrl;

        await db.collection("users").updateOne({ _id: new ObjectId(userId) }, { $set: updateData });

        res.status(200).json({ message: "Profile updated successfully", updateData });
    } catch (error) {
        console.error("Failed to update profile:", error);
        res.status(500).json({ error: "Failed to update profile" });
    }
});

// post a comment to an album
app.post("/comments", async (req, res) => {
    try {
        // expects an albumid
        const { albumId, userId, text } = req.body;

        const newComment = {
            albumId: new ObjectId(albumId), // store albumid
            userId: new ObjectId(userId),
            text,
            createdAt: new Date(),
        };

        const result = await db.collection("comments").insertOne(newComment);

        // get username for frontend update
        const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });

        res.status(201).json({
            ...newComment,
            _id: result.insertedId,
            userInfo: { username: user.username }, // send user info back
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to create comment" });
    }
});

// get all comments for an album
app.get("/comments/album/:albumId", async (req, res) => {
    try {
        const { albumId } = req.params;
        if (!ObjectId.isValid(albumId)) {
            return res.status(400).json({ error: "Invalid Album ID" });
        }

        const comments = await db
            .collection("comments")
            .aggregate([
                { $match: { albumId: new ObjectId(albumId) } },
                { $sort: { createdAt: 1 } },
                // get user details for each comment
                {
                    $lookup: {
                        from: "users",
                        localField: "userId",
                        foreignField: "_id",
                        as: "userInfo",
                    },
                },
                { $unwind: "$userInfo" },
                {
                    $project: {
                        text: 1,
                        createdAt: 1,
                        "userInfo.username": 1,
                    },
                },
            ])
            .toArray();

        res.json(comments);
    } catch (error) {
        console.error("Failed to fetch album comments:", error);
        res.status(500).json({ error: "Failed to fetch album comments" });
    }
});

// add new people to album
app.post("/album/:albumId/participants", async (req, res) => {
    try {
        const { albumId } = req.params;
        const { userIdsToAdd } = req.body; // expects user ids

        if (!ObjectId.isValid(albumId)) {
            return res.status(400).json({ error: "Invalid Album ID" });
        }

        // convert ids to objectids
        const participantObjectIds = userIdsToAdd.map((id) => new ObjectId(id));

        // add new users to participants
        // addtoset stops duplicates
        const result = await db
            .collection("albums")
            .updateOne(
                { _id: new ObjectId(albumId) },
                { $addToSet: { participants: { $each: participantObjectIds } } }
            );

        if (result.modifiedCount === 0) {
            return res.status(200).json({ message: "Participants already in album or no new participants added." });
        }

        res.status(200).json({ message: "Participants added successfully." });
    } catch (error) {
        console.error("Failed to add participants:", error);
        res.status(500).json({ error: "Failed to add participants" });
    }
});

// get one album by its id
app.get("/album/:albumId", async (req, res) => {
    try {
        const { albumId } = req.params;
        if (!ObjectId.isValid(albumId)) {
            return res.status(400).json({ error: "Invalid Album ID" });
        }

        // find the album
        const album = await db.collection("albums").findOne({ _id: new ObjectId(albumId) });

        if (!album) {
            return res.status(404).json({ error: "Album not found" });
        }

        // find author details
        // only get some fields to be fast
        const author = await db
            .collection("users")
            .findOne({ _id: album.userId }, { projection: { username: 1, avatarUrl: 1 } });

        // find all participant details
        const participants = await db
            .collection("users")
            .find(
                { _id: { $in: album.participants } }, // find users in participants array
                { projection: { username: 1, avatarUrl: 1 } }
            )
            .toArray();

        // put it all together for response
        const responseData = {
            _id: album._id,
            Title: album.Title,
            albumPosts: album.albumPosts,
            createdAt: album.createdAt,
            authorInfo: author,
            participantInfo: participants,
        };

        res.json(responseData);
    } catch (error) {
        console.error("Failed to fetch album details:", error);
        res.status(500).json({ error: "Failed to fetch album details" });
    }
});

// search for users by username
app.get("/users/search", async (req, res) => {
    try {
        const { query } = req.query; // get search word

        if (!query) {
            return res.json([]);
        }

        // find users that start with the word, no case sensitive
        const users = await db
            .collection("users")
            .find({ username: { $regex: `^${query}`, $options: "i" } })
            .limit(10) // only get 10 results to be fast
            .toArray();

        // send only what's needed
        const results = users.map((user) => ({
            id: user._id,
            username: user.username,
            avatarUrl: user.avatarUrl, // send avatar url too
        }));

        res.json(results);
    } catch (error) {
        console.error("Failed to search users: ", error);
        res.status(500).json({ error: "Failed to search users" });
    }
});

//post to an album - adds user and their post to the album entry
app.post("/albums/:albumID/upload", upload.single("image"), async (req, res) => {
    try {
        const albumID = req.params.albumID;
        const { userId } = req.body;
        const filePath = req.file.path;

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(filePath, {
            folder: "cs110-photo-storage",
        });
        fs.unlinkSync(filePath); // delete the file from server after upload

        const newPost = {
            url: result.secure_url,
            userId: new ObjectId(userId),
            createdAt: new Date(),
        };
        const update = await db.collection("albums").updateOne(
            { _id: new ObjectId(albumID) },
            {
                $addToSet: { participants: new ObjectId(userId) },
                $push: { albumPosts: newPost },
            }
        );

        res.status(201).json({
            message: "Post added to album successfully",
            post: newPost,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to add post to album");
    }
});

//get the album
app.get("/albums/:userId", async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!ObjectId.isValid(userId)) {
            return res.status(400).json({ error: "Invalid user ID format" });
        }

        const albums = await db
            .collection("albums")
            .find({ participants: new ObjectId(userId) }) // find albums by userID
            .sort({ createdAt: -1 }) // most recent first
            .toArray();

        res.json(albums);
    } catch (error) {
        console.error("Failed to fetch albums:", error);
        res.status(500).json({ error: "Failed to fetch albums" }); // Send a JSON error
    }
});

//create a new album empty initially
app.post("/albums", async (req, res) => {
    try {
        const { userId, albumTitle } = req.body;

        const album = {
            userId: new ObjectId(userId),
            Title: albumTitle,
            albumPosts: [],
            createdAt: new Date(),
            participants: [new ObjectId(userId)], // only author initially
        };

        const result = await db.collection("albums").insertOne(album);

        res.status(201).json({
            message: "Album created successfully",
            albumId: result.insertedId,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send("Failed to create album");
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
            return res.status(409).json({
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

        // create a token that contains the user's id
        const token = jwt.sign({ userId: user._id, username: user.username }, process.env.JWT_SECRET, {
            expiresIn: "30d",
        });

        res.json({ message: "Login successful", token: token, userId: user._id });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Login failed" });
    }
});
