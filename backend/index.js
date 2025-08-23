// 1. Import the Express library
const express = require('express');
const cors = require('cors');

// 2. Create an instance of an Express application
const app = express();

// 3. Define the port the server will run on
const port = 3001;

// only allow frontend to access it
app.use(cors({
    origin: 'http://localhost:3000',
    methods: 'GET,POST',
    credentials: true,
}));

app.get('/', (reg, res) =>{
    res.send("Hello World!");
});

// 4. Start the server and make it listen for connections on the specified port
app.listen(port, () => {
    console.log(`Server is running and listening on http://localhost:${port}`);
});