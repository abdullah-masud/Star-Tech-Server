const express = require('express')
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.02fsy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        const partCollection = client.db('InsidePC').collection('parts');
        const reviewCollection = client.db('InsidePC').collection('reviews');
        const orderCollection = client.db('InsidePC').collection('orders');

        // GET parts from db
        app.get('/parts', async (req, res) => {
            const query = {};
            const cursor = partCollection.find(query);
            const parts = await cursor.toArray();
            res.send(parts)
        })

        // GET one part using specific ID
        app.get('/parts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const part = await partCollection.findOne(query);
            res.send(part)
        })

        // GET reviews from db
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews)
        })

        // POST order into db
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = orderCollection.insertOne(order);
            res.send(result)
        })
    }
    finally {

    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Hello From Inside PC')
})

app.listen(port, () => {
    console.log(`Inside Pc listening on port ${port}`)
})