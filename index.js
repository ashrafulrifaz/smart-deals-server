const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.send("Hello World");
});

const uri = "mongodb+srv://demoUser:7LkbTwzV6voIQa1d@cluster0.klq4o7m.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();

        const smartDB = client.db("smartDB");
        const productCollection = smartDB.collection("products");
        const usersCollection = smartDB.collection('users')

        app.get("/products", async (req, res) => {
            const result = await productCollection.find().toArray();
            res.send(result);
        });

        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = {email: user.email}
            const isExist = await usersCollection.findOne(query)
            if(isExist) {
                res.send({success: false})
            } else {
                const result = await usersCollection.insertOne(user)
                res.send(result)
            }
        })
    } catch (err) {
        console.error(err);
    }
}

connectDB();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});