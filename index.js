const express = require('express')
const cors = require('cors')
const { MongoClient } = require('mongodb')
const app = express()
const port = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
    res.send("hello world")
})

const uri = `mongodb+srv://demoUser:7LkbTwzV6voIQa1d@cluster0.klq4o7m.mongodb.net/?appName=Cluster0`

const client = new MongoClient(uri)

async function connectDB () {
    try {
        await client.connect()

        const smartDB = client.db('smartDB')
        const productCollection = db.collection('products')

    } catch (err) {
        console.error(err)
    }
}

connectDB()

app.listen(port, () => {
    console.log(`example port listening on ${port}`)
})