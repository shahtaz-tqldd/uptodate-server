const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1uor19o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const userCollection = client.db('uptodate').collection('users')
        const blogsCollection = client.db('uptodate').collection('blogs')
        const bloggerRequestCollection = client.db('uptodate').collection('bloggerRequest')

        //users =================================================
        app.post('/users', async (req, res) => {
            const user = req.body
            const filter = { email: user.email }
            const existUser = await userCollection.findOne(filter)
            if (!existUser) {
                const result = await userCollection.insertOne(user)
                res.send(result)
            }
        })
        app.get('/users', async (req, res) => {
            const result = await userCollection.find({}).toArray()
            res.send(result)
        })
        app.delete('/users/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }           
            const result = await userCollection.deleteOne(filter)
            res.send(result)
        })

        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email }
            const user = await userCollection.findOne(filter)
            res.send({isAdmin: user?.role === 'admin'})
        })

        // bloggers request ===========================================
        app.post('/blogger-request', async (req, res) => {
            const blogger = req.body
            const result = await bloggerRequestCollection.insertOne(blogger)
            res.send(result)
        })
        app.get('/blogger-request', async (req, res) => {
            const result = await bloggerRequestCollection.find({}).toArray()
            res.send(result)
        })
        app.delete('/blogger-request/:id', async (req, res) => {
            const id = req.params.id
            const filter = {_id: ObjectId(id)}
            const result = await bloggerRequestCollection.deleteOne(filter)
            res.send(result)
        })
        app.put('/blogger-request/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'blogger'
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        // bloggers
        app.get('/bloggers', async (req, res) => {
            const filter = {role: 'blogger'}
            const result = await userCollection.find(filter).toArray()
            res.send(result)
        })
        app.put('/bloggers/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: null
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })
        app.get('/users/blogger/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email }
            const user = await userCollection.findOne(filter)
            res.send({isBlogger: user?.role === 'blogger'})
        })

        // blogs ==============================================
        app.post('/blogs', async (req, res) => {
            const blogPost = req.body
            const result = await blogsCollection.insertOne(blogPost)
            res.send(result)
        })
        app.get('/blogs', async (req, res) => {
            const result = await blogsCollection.find({}).toArray()
            res.send(result)
        })
        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id
            const blog = {_id: ObjectId(id)}
            const result = await blogsCollection.findOne(blog)
            res.send(result)
        })
        app.delete('/blogs/:id', async (req, res) => {
            const id = req.params.id
            const filter = {_id: ObjectId(id)}
            const result = await blogsCollection.deleteOne(filter)
            res.send(result)
        })
        
    } finally {}
}

run().catch(err=>console.error(err))


app.get('/', (req, res) => {
    res.send('uptodate blog server is running...')
})

app.listen(port, () => {
    console.log(`uptodate server is running on port ${port}`)
})