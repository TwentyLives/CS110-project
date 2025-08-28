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

// admin authorization
const isAdmin = (req, res, next) => {
  // check for secret key in the request headers
  const adminKey = req.headers["x-admin-key"];
  if (adminKey && adminKey === process.env.ADMIN_SECRET_KEY) {
    next(); // if key is correct, then continue
  } else {
    res.status(401).json({ error: "Unauthorized: Admin Access Required" });
  }
};

// Follow a user
app.post("/follow", async (req, res) => {
  try {
    const { userId, followId } = req.body;

    if (!ObjectId.isValid(userId) || !ObjectId.isValid(followId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    if (userId === followId) {
      return res.status(400).json({ error: "You cannot follow yourself" });
    }

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    const userToFollow = await db.collection("users").findOne({ _id: new ObjectId(followId) });

    if (!user || !userToFollow) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add followId to user's following list
    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $addToSet: { following: new ObjectId(followId) } });

    // Fetch updated following list
    const updatedUser = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) }, { projection: { following: 1 } });

    const followingDetails = await db
      .collection("users")
      .find({ _id: { $in: updatedUser.following || [] } })
      .project({ username: 1, avatarUrl: 1 })
      .toArray();

    res.status(200).json(
      followingDetails.map((f) => ({
        id: f._id.toString(),
        name: f.username,
        pfp: f.avatarUrl || null,
      }))
    );
  } catch (error) {
    console.error("Failed to follow user:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
});

// Get the list of users the current user is following
app.get("/following/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) }, { projection: { following: 1 } });

    if (!user) return res.status(404).json({ error: "User not found" });

    const followingDetails = await db
      .collection("users")
      .find({ _id: { $in: user.following || [] } })
      .project({ username: 1, avatarUrl: 1 })
      .toArray();

    res.json(
      followingDetails.map((f) => ({
        id: f._id.toString(),
        name: f.username,
        pfp: f.avatarUrl || null,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch following:", error);
    res.status(500).json({ error: "Failed to fetch following" });
  }
});

// Get the list of users who are following this user
app.get("/followers/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const followers = await db
      .collection("users")
      .find({ following: new ObjectId(userId) })
      .project({ username: 1, avatarUrl: 1 })
      .toArray();

    res.json(
      followers.map((f) => ({
        id: f._id.toString(),
        name: f.username,
        pfp: f.avatarUrl || null,
      }))
    );
  } catch (error) {
    console.error("Failed to fetch followers:", error);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
});

app.get("/recommendations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    const userObjectId = new ObjectId(userId);

    const user = await db.collection("users").findOne({ _id: userObjectId }, { projection: { following: 1 } });

    if (!user) return res.status(404).json({ error: "User not found" });

    const userFollowingObjectIds = (user.following || []).map((fid) => new ObjectId(fid));

    const friendsOfFriends = await db
      .collection("users")
      .find({ _id: { $in: userFollowingObjectIds } })
      .project({ following: 1 })
      .toArray();

    let recommendationsSet = new Set();
    friendsOfFriends.forEach((friend) => {
      (friend.following || []).forEach((fid) => {
        recommendationsSet.add(fid.toString());
      });
    });

    recommendationsSet.delete(userId.toString());
    userFollowingObjectIds.forEach((fid) => recommendationsSet.delete(fid.toString()));

    const recommendationIds = Array.from(recommendationsSet).map((id) => new ObjectId(id));

    if (recommendationIds.length === 0) return res.json([]);

    const recommendedUsers = await db
      .collection("users")
      .find({ _id: { $in: recommendationIds } })
      .project({ username: 1, avatarUrl: 1 })
      .limit(10)
      .toArray();

    const formattedUsers = recommendedUsers.map((u) => ({
      id: u._id.toString(),
      name: u.username,
      pfp: u.avatarUrl || null,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Failed to get recommendations:", error);
    res.status(500).json({ error: "Failed to get recommendations" });
  }
});

app.post("/unfollow", async (req, res) => {
  try {
    const { userId, unfollowId } = req.body;

    if (!ObjectId.isValid(userId) || !ObjectId.isValid(unfollowId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    if (userId === unfollowId) {
      return res.status(400).json({ error: "You cannot unfollow yourself" });
    }

    const user = await db.collection("users").findOne({ _id: new ObjectId(userId) });
    if (!user) return res.status(404).json({ error: "User not found" });

    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $pull: { following: new ObjectId(unfollowId) } });

    res.status(200).json({ message: "Successfully unfollowed user" });
  } catch (error) {
    console.error("Failed to unfollow user:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
});

app.post("/remove", async (req, res) => {
  try {
    const { userId, removeId } = req.body;

    if (!ObjectId.isValid(userId) || !ObjectId.isValid(removeId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    await db
      .collection("users")
      .updateOne({ _id: new ObjectId(removeId) }, { $pull: { following: new ObjectId(userId) } });

    res.status(200).json({ message: "Follower removed" });
  } catch (err) {
    console.error("Failed to remove follower:", err);
    res.status(500).json({ error: "Failed to remove follower" });
  }
});

// Just some testing code I added that displays all users
// app.get("/recommendations/:userId", async (req, res) => {
//   try {
//     const { userId } = req.params;

//     if (!ObjectId.isValid(userId)) {
//       return res.status(400).json({ error: "Invalid user ID format" });
//     }

//     const allUsers = await db.collection("users")
//       .find({ _id: { $ne: new ObjectId(userId) } })
//       .project({ username: 1, avatarUrl: 1 })
//       .toArray();

//     const formattedUsers = allUsers.map(u => ({
//       id: u._id.toString(),
//       name: u.username,
//       pfp: u.avatarUrl || null
//     }));

//     res.json(formattedUsers);

//   } catch (error) {
//     console.error("Failed to get recommendations:", error);
//     res.status(500).json({ error: "Failed to get recommendations" });
//   }
// });

// gets list of users that are following this user
app.get("/followers/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid user ID format" });
    }

    // find all users who have this userId in their following array
    const followers = await db
      .collection("users")
      .find({ following: new ObjectId(userId) })
      .project({ username: 1, avatarUrl: 1 })
      .toArray();

    res.json(followers);
  } catch (error) {
    console.error("Failed to fetch followers:", error);
    res.status(500).json({ error: "Failed to fetch followers" });
  }
});

// admin routes
app.post("/admin/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await db.collection("admins").findOne({ username });

    if (admin && (await bcrypt.compare(password, admin.password))) {
      // send back the secret key to the frontend
      res.json({ message: "Admin login successful", adminKey: process.env.ADMIN_SECRET_KEY });
      /* not entirely safe in production, likely better to use cookies or other methods of security */
    } else {
      res.status(401).json({ error: "Invalid admin credentials" });
    }
  } catch (error) {
    res.status(500).json({ error: "Admin login failed" });
  }
});

// get all albums for admin dashboard
app.get("/admin/albums", isAdmin, async (req, res) => {
  try {
    const albums = await db.collection("albums").find({}).sort({ createdAt: -1 }).toArray();
    res.json(albums);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch albums" });
  }
});

// delete an album
app.delete("/admin/albums/:albumId", isAdmin, async (req, res) => {
  try {
    const { albumId } = req.params;
    // delete comments within the album
    await db.collection("comments").deleteMany({ albumId: new ObjectId(albumId) });

    // delete the album itself
    await db.collection("albums").deleteOne({ _id: new ObjectId(albumId) });
    res.status(200).json({ message: "Album and its comments deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete album" });
  }
});

// delete a comment within an album
app.delete("/admin/comments/:commentId", isAdmin, async (req, res) => {
  try {
    const { commentId } = req.params;
    await db.collection("comments").deleteOne({ _id: new ObjectId(commentId) });
    res.status(200).json({ message: "Comment deleted succesfluly" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

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

    res.json({ message: "Login successful", token: token, userId: user._id, avatarUrl: user.avatarUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Login failed" });
  }
});


//Stuff for Contests I dont like Github Merge Conflicts


app.post("/contests", async (req, res) => {
  try {
    const { title, description, creatorId } = req.body;
    const contest = {
      title,
      description,
      creatorId: new ObjectId(creatorId),
      createdAt: new Date(),
      entries: [],
    };
    const result = await db.collection("contests").insertOne(contest);

    const savedContest = await db.collection("contests").findOne({ _id: result.insertedId });
    res.status(201).json(savedContest);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create contest" });
  }
});



app.get("/contests/:contestId", async (req, res) => {
  try {
    const { contestId } = req.params;
    if (!ObjectId.isValid(contestId))
      return res.status(400).json({ error: "Invalid contest ID" });

    const contest = await db.collection("contests").findOne({ _id: new ObjectId(contestId) });
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    let creatorInfo = { username: "Unknown", avatarUrl: "" };
    if (contest.creatorId) {
      const creator = await db.collection("users").findOne(
        { _id: new ObjectId(contest.creatorId) },
        { projection: { username: 1, avatarUrl: 1 } }
      );
      if (creator) creatorInfo = { username: creator.username, avatarUrl: creator.avatarUrl };
    }

    let participantInfo = [];
    if (contest.participantInfo?.length > 0) {
      participantInfo = contest.participantInfo.map(p => ({
        _id: p._id,
        username: p.username,
        avatarUrl: p.avatarUrl || ""
      }));
    }

    let entriesWithUser = [];
    if (contest.entries?.length > 0) {
      const entryUserIds = contest.entries.map(e => new ObjectId(e.userId));
      const users = await db.collection("users")
        .find({ _id: { $in: entryUserIds } })
        .project({ username: 1, avatarUrl: 1 })
        .toArray();

      entriesWithUser = contest.entries.map(e => {
        const user = users.find(u => u._id.equals(new ObjectId(e.userId)));
        return {
          ...e,
          userInfo: user ? { username: user.username, avatarUrl: user.avatarUrl } : { username: "Unknown", avatarUrl: "" },
          totalLikes: e.likes?.length || 0,
          likedByCurrentUser: false
        };
      });
    }

    res.json({
      _id: contest._id,
      title: contest.title,
      description: contest.description,
      createdAt: contest.createdAt,
      creatorInfo,
      participantInfo,
      entries: entriesWithUser
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contest" });
  }
});



app.post("/contests/:contestId/upload", upload.single("image"), async (req, res) => {
  try {
    const { contestId } = req.params;
    const { userId } = req.body;
    const filePath = req.file.path;

    if (!ObjectId.isValid(contestId) || !ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Invalid IDs" });
    }

    const contest = await db.collection("contests").findOne({ _id: new ObjectId(contestId) });
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    if (contest.entries.some(e => e.userId.equals(userId))) {
      return res.status(400).json({ error: "User already submitted an entry" });
    }

    const result = await cloudinary.uploader.upload(filePath, { folder: "contest-entries" });
    fs.unlinkSync(filePath);

    const newEntry = { userId: new ObjectId(userId), url: result.secure_url, createdAt: new Date(), likes: [] };
    await db.collection("contests").updateOne(
      { _id: new ObjectId(contestId) },
      { $push: { entries: newEntry } }
    );

    res.status(201).json({ message: "Entry uploaded", entry: newEntry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to upload entry" });
  }
});


app.get("/contests", async (req, res) => {
  try {
    const contests = await db.collection("contests").find({}).sort({ createdAt: -1 }).toArray();
    res.json(contests);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch contests" });
  }
});

app.post("/contests/:contestId/like", async (req, res) => {
  try {
    const { contestId } = req.params;
    const { currentUserId, entryUserId } = req.body;

    if (!ObjectId.isValid(contestId) || !ObjectId.isValid(currentUserId) || !ObjectId.isValid(entryUserId)) {
      return res.status(400).json({ error: "Invalid IDs" });
    }

    const contest = await db.collection("contests").findOne({ _id: new ObjectId(contestId) });
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    const entryIndex = contest.entries.findIndex(e => e.userId.equals(entryUserId));
    if (entryIndex === -1) return res.status(404).json({ error: "Entry not found" });

    const entry = contest.entries[entryIndex];

    let update;
    if (entry.likes.some(likeId => likeId.equals(currentUserId))) {
      update = { $pull: { [`entries.${entryIndex}.likes`]: new ObjectId(currentUserId) } };
    } else {
      update = { $push: { [`entries.${entryIndex}.likes`]: new ObjectId(currentUserId) } };
    }

    await db.collection("contests").updateOne({ _id: new ObjectId(contestId) }, update);
    res.json({ message: "Like toggled successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to toggle like" });
  }
});





app.post("/comments/contest", async (req, res) => {
  try {
    const { contestId, userId, text } = req.body;

    const newComment = {
      contestId: new ObjectId(contestId),
      userId: new ObjectId(userId),
      text,
      createdAt: new Date(),
    };

    const result = await db.collection("comments").insertOne(newComment);

    const user = await db
      .collection("users")
      .findOne({ _id: new ObjectId(userId) });

    res.status(201).json({
      ...newComment,
      _id: result.insertedId,
      userInfo: { username: user.username },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create contest comment" });
  }
});

app.get("/comments/contest/:contestId", async (req, res) => {
  try {
    const { contestId } = req.params;
    if (!ObjectId.isValid(contestId)) {
      return res.status(400).json({ error: "Invalid Contest ID" });
    }

    const comments = await db
      .collection("comments")
      .aggregate([
        { $match: { contestId: new ObjectId(contestId) } },
        { $sort: { createdAt: 1 } },
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
    console.error("Failed to fetch contest comments:", error);
    res.status(500).json({ error: "Failed to fetch contest comments" });
  }
});

app.post("/contests/:contestId/participants", async (req, res) => {
  try {
    const { contestId } = req.params;
    const { userIdsToAdd } = req.body;

    if (!ObjectId.isValid(contestId)) {
      return res.status(400).json({ error: "Invalid Contest ID" });
    }

    const usersToAdd = await db
      .collection("users")
      .find({ _id: { $in: userIdsToAdd.map(id => new ObjectId(id)) } })
      .project({ username: 1, avatarUrl: 1 })
      .toArray();

    const contest = await db.collection("contests").findOne({ _id: new ObjectId(contestId) });
    if (!contest) return res.status(404).json({ error: "Contest not found" });

    const existingUsernames = (contest.participantInfo || []).map(u => u.username);
    const newParticipants = usersToAdd
      .filter(u => !existingUsernames.includes(u.username))
      .map(u => ({ username: u.username, avatarUrl: u.avatarUrl || "" }));

    if (newParticipants.length === 0) {
      return res.status(200).json({ message: "Participants already in contest." });
    }

    await db.collection("contests").updateOne(
      { _id: new ObjectId(contestId) },
      { $addToSet: { participantInfo: { $each: newParticipants } } }
    );

    const updatedContest = await db.collection("contests").findOne({ _id: new ObjectId(contestId) });
    res.status(200).json(updatedContest);

  } catch (error) {
    console.error("Failed to add participants:", error);
    res.status(500).json({ error: "Failed to add participants" });
  }
});
