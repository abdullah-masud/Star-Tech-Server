const express = require('express')
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.02fsy.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'UnAuthorized Access' });
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
        if (err) {
            return res.status(403).send({ message: 'Forbidden Access' })
        }
        req.decoded = decoded;
        next();
    })
}

async function run() {
    try {
        await client.connect();
        const partCollection = client.db('InsidePC').collection('parts');
        const reviewCollection = client.db('InsidePC').collection('reviews');
        const orderCollection = client.db('InsidePC').collection('orders');
        const userCollection = client.db('InsidePC').collection('users');

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

        // Update part info (AVAILABLE)
        // app.put('/parts/:id', async (req, res) => {
        //     const id = req.params.id;
        //     const updatedAvailable = req.body;
        //     const filter = { _id: ObjectId(id) };
        //     const options = { upsert: true };
        //     const updatedDoc = {
        //         $set: {
        //             available: updatedAvailable.available
        //         }
        //     }
        //     const result = await partCollection.updateOne(filter, updatedDoc, options)
        //     res.send(result);
        // })

        // GET reviews from db
        app.get('/reviews', async (req, res) => {
            const query = {};
            const cursor = reviewCollection.find(query);
            const reviews = await cursor.toArray();
            res.send(reviews)
        })

        // POST reviews into db
        app.post('/reviews', async (req, res) => {
            const newReviews = req.body;
            const result = await reviewCollection.insertOne(newReviews);
            res.send(result);
        })

        // POST order into db
        app.post('/orders', async (req, res) => {
            const order = req.body;
            const result = orderCollection.insertOne(order);
            res.send(result)
        })

        // GET order from db
        app.get('/orders', verifyJWT, async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if (email === decodedEmail) {
                const query = { email: email }
                const orders = await orderCollection.find(query).toArray();
                return res.send(orders)
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
        })

        // DELETE order from db
        app.delete('/orders/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await orderCollection.deleteOne(query);
            res.send(result)
        })

        // GET users from db
        app.get('/users', verifyJWT, async (req, res) => {
            const users = await userCollection.find().toArray();
            res.send(users)
        })

        // Check whether the user is Admin
        app.get('/admin/:email', async (req, res) => {
            const email = req.params.email;
            const user = await userCollection.findOne({ email: email });
            const isAdmin = user.role === 'admin'
            res.send({ admin: isAdmin })
        })

        // PUT user into db (Make Admin)
        app.put('/users/admin/:email', verifyJWT, async (req, res) => {
            const email = req.params.email;
            const requester = req.decoded.email;
            const requesterAccount = await userCollection.findOne({ email: requester })
            if (requesterAccount.role === 'admin') {
                const filter = { email: email };
                const updateDoc = {
                    $set: { role: 'admin' },
                }
                const result = await userCollection.updateOne(filter, updateDoc);
                res.send(result);
            }
            else {
                return res.status(403).send({ message: 'Forbidden Access' })
            }
        })

        // PUT user into db
        app.put('/users/:email', async (req, res) => {
            const email = req.params.email;
            const user = req.body
            const filter = { email: email };
            const options = { upsert: true };
            const updateDoc = {
                $set: user,
            }
            const result = await userCollection.updateOne(filter, updateDoc, options);
            const token = jwt.sign({ email: email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })
            res.send({ result, token });
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