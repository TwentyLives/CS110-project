const { MongoClient } = require("mongodb");
const bcrypt = require("bcrypt");

// config
const url =
    "mongodb+srv://EventSnapTeam:CS110GROUPPSW@eventsnapdatabase.te31njv.mongodb.net/?retryWrites=true&w=majority&appName=EventSnapDatabase";
const dbName = "Project0";
const adminUsername = "admin";
const adminPassword = "myAdminPassword";

async function createAdmin() {
    const client = new MongoClient(url);
    try {
        await client.connect();
        const db = client.db(dbName);
        const adminsCollection = db.collection("admins");

        // check if the admin user already exists
        const existingAdmin = await adminsCollection.findOne({ username: adminUsername });
        if (existingAdmin) {
            console.log("Admin user already exists.");
            return;
        }

        // hash the password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

        // insert the new admin user
        await adminsCollection.insertOne({
            username: adminUsername,
            password: hashedPassword,
        });

        console.log(`Successfully created admin user: ${adminUsername}`);
    } catch (err) {
        console.error("Failed to create admin user:", err);
    } finally {
        await client.close();
    }
}

createAdmin();

// run node create_admin.js once to create the admin user in the database
// this will be required for when we add the endpoints for the admin page
