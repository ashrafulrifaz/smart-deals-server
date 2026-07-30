const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");
const admin = require("firebase-admin");
const jwt = require('jsonwebtoken')
const app = express();
require('dotenv').config()
const { cert, initializeApp } = require("firebase-admin/app")
const { getAuth } = require("firebase-admin/auth")
const port = process.env.PORT || 3000;

const serviceAccount = require("./smart-deals-firebase-adminsdk.json");

initializeApp({
  credential: cert(serviceAccount)
})


app.use(cors());
app.use(express.json());

const logger = (req, res, next) => {
    console.log('middlesware applied')
    next()
}

const verifyToken = async (req, res, next) => {
    if(!req.headers.authorization) {
        return res.status(401).send({message: 'unauthorized access'})
    }
    const token = req.headers.authorization.split(' ')[1]
    if(!token) {
        return res.status(401).send({message: 'unauthorized access'})
    }

    try {
        const tokenInfo = await getAuth().verifyIdToken(token)
        req.token_email = tokenInfo.email
        next()
    } catch {
        return res.status(401).send({message: 'unauthorized access'})
    }
}

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
        const bidsCollection = smartDB.collection('bids')

        app.post('/getToken', (req, res) => {
            const loggedUser = req.body
            const token = jwt.sign(loggedUser, process.env.JWT_SECRET, {expiresIn: '12h'})
            res.send({token: token})
        })

        app.get("/products", async (req, res) => {
            const result = await productCollection.find().sort({postedAt: -1}).toArray();
            res.send(result);
        });

        app.get('/bids', verifyToken, async (req, res) => {
            const email = req.query.email
            if(!email && email !== req?.token_email) {
                return res.status(401).send({message: 'unauthorized access'})
            }
            const query = {"buyer.email": email}
            const result = await bidsCollection.find(query).toArray()
            res.send(result)
        })

        app.get('/bids/byProduct/:productId', async (req, res) => {
            const productId = req.params.productId
            const query = {productId: productId}
            const result = await bidsCollection.find(query).toArray()
            res.send(result)
        })

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
        app.post('/products', async (req, res) => {
            const product = req.body;
            const result = await productCollection.insertOne(product)
            res.send(product)
        })

        app.post('/bids', async (req, res) => {
            const bid = req.body
            const query = {
                productId: bid.productId,
                "buyer.email": bid.buyer.email
            };
            const isExist = await bidsCollection.findOne(query)
            
            if(isExist) {
                res.send({
                    success: false,
                    message: 'You have already placed a bid on this product.'
                })
            } else {
                const result = await bidsCollection.insertOne(bid)
                res.send(result)
            }
        })

        app.delete('/bids/:id', async (req, res) => {
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await bidsCollection.deleteOne(query)
            res.send(result)
        })

    } catch (err) {
        console.error(err);
    }
}

connectDB();

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});