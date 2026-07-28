const express = require("express");
const cors = require("cors");
const { MongoClient, ObjectId } = require("mongodb");

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
        const bidsCollection = smartDB.collection('bids')

        app.get("/products", async (req, res) => {
            const result = await productCollection.find().sort({postedAt: -1}).toArray();
            res.send(result);
        });

        app.get('/bids', async (req, res) => {
            const email = req.query.email
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