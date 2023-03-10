const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const SSLCommerzPayment = require('sslcommerz-lts');
const express = require('express');
const app = express()
const cors = require('cors')
const port = process.env.PORT || 5000;
require('dotenv').config();

// middleware
app.use(cors())
app.use(express.json())

const storeId = process.env.STORE_ID
const storePassword = process.env.STORE_PASSWORD
const isLive = false

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.1uor19o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const userCollection = client.db('uptodate').collection('users')
        const blogsCollection = client.db('uptodate').collection('blogs')
        const bloggerRequestCollection = client.db('uptodate').collection('bloggerRequest')
        const commentsCollection = client.db('uptodate').collection('comments')
        const categoriesCollection = client.db('uptodate').collection('categories')
        const savedCollection = client.db('uptodate').collection('savedPost')
        const favouriteCollection = client.db('uptodate').collection('favouritePost')

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
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email
            const filter = {email}
            const result = await userCollection.findOne(filter)
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
            res.send({ isAdmin: user?.role === 'admin' })
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
            const filter = { _id: ObjectId(id) }
            const result = await bloggerRequestCollection.deleteOne(filter)
            res.send(result)
        })
        app.put('/blogger-request/:email', async (req, res) => {
            const email = req.params.email
            const speciality = req.body.speciality
            const filter = { email }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    role: 'blogger',
                    speciality: speciality
                }
            }
            const result = await userCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        // bloggers
        app.get('/bloggers', async (req, res) => {
            const filter = { role: 'blogger' }
            const result = await userCollection.find(filter).toArray()
            res.send(result)
        })
        app.get('/users/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email }
            const result = await userCollection.findOne(filter)
            res.send({bloggerId: result._id})
        })
        app.get('/blogger/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await userCollection.findOne(filter)
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
            const filter = { email, paid: true }
            const user = await userCollection.findOne(filter)
            res.send({ isBlogger: user?.role === 'blogger' })
        })
        app.get('/users/blogger/accepted/:email', async (req, res) => {
            const email = req.params.email
            const filter = { email }
            const user = await userCollection.findOne(filter)
            res.send({ isAccepted: user?.role === 'blogger' })
        })

        // blogs ==============================================
        app.post('/blogs', async (req, res) => {
            const blogPost = req.body
            const result = await blogsCollection.insertOne(blogPost)
            res.send(result)
        })
        app.get('/blogs', async (req, res) => {
            const { category, search } = req.query
            const posts = await blogsCollection.find({}).toArray()

            if (category === 'All' && !search) {
                const result = await blogsCollection.find({}).toArray()
                res.send(result)
            }
            else if (search) {
                const result = posts.filter(post => post.title.toLowerCase().includes(search?.toLocaleLowerCase()))
                res.send(result)
            }
            else if (category) {
                const filter = { category: category }
                const result = await blogsCollection.find(filter).toArray()
                res.send(result)
            }
            else {
                const result = await blogsCollection.find({}).toArray()
                res.send(result)
            }
        })
        app.get('/blogs/:id', async (req, res) => {
            const id = req.params.id
            const blog = { _id: ObjectId(id) }
            const result = await blogsCollection.findOne(blog)
            res.send(result)
        })
        app.delete('/blogs/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await blogsCollection.deleteOne(filter)
            res.send(result)
        })

        // comments
        app.post('/blogs/comments', async (req, res) => {
            const comment = req.body
            const result = await commentsCollection.insertOne(comment)
            res.send(result)
        })
        app.get('/blogs/comments/:id', async (req, res) => {
            const id = req.params.id
            const filter = { blogId: id }
            const result = await commentsCollection.find(filter).sort({ time: 1, date: 1 }).toArray()
            res.send(result)
        })
        app.delete('/blogs/comments/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await commentsCollection.deleteOne(filter)
            res.send(result)
        })
        app.put('/blogs/comments/:id', async (req, res) => {
            const id = req.params.id
            const editedInfo = req.body
            const { editedDate, editedTime, editedComment } = editedInfo
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updatedDoc = {
                $set: {
                    comment: editedComment,
                    editedDate,
                    editedTime
                }
            }
            const result = await commentsCollection.updateOne(filter, updatedDoc, options)
            res.send(result)
        })

        // dashboard blogs
        app.get('/dashboard/blogs/:email', async (req, res) => {
            const email = req.params.email
            const user = await userCollection.findOne({ email })
            if(user?.role === 'admin'){
                const result = await blogsCollection.find({}).toArray()
                res.send(result)
            }
            else {
                const filter = { authorEmail: email }
                const result = await blogsCollection.find(filter).toArray()
                res.send(result)
            }
        })

        // categories
        app.post('/blogs/categories', async (req, res) => {
            const data = req.body
            const result = await categoriesCollection.insertOne(data)
            res.send(result)
        })
        app.get('/categories', async (req, res) => {
            const result = await categoriesCollection.find({}).toArray()
            res.send(result)
        })
        app.delete('/blogs/categories/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await categoriesCollection.deleteOne(filter)
            res.send(result)
        })

        // saved post
        app.post('/blogs/save', async (req, res) => {
            const saved = req.body
            const filter = { postId: saved.postId, savedBy: saved.savedBy }
            const post = await savedCollection.findOne(filter)
            if (post?.postId !== saved.postId) {
                const result = await savedCollection.insertOne(saved)
                res.send(result)
            }
            else {
                res.send({ message: "You already saved this post" })
            }
        })
        app.get('/blogs/saved/:email', async (req, res) => {
            const email = req.params.email
            const filter = { savedBy: email }
            const result = await savedCollection.find(filter).toArray()
            res.send(result)
        })
        app.delete('/blogs/saved/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await savedCollection.deleteOne(filter)
            res.send(result)
        })

        // favourite post
        app.post('/blogs/favourites', async (req, res) => {
            const favourite = req.body
            const { postId, savedBy } = favourite
            const post = await favouriteCollection.findOne({
                $and: [{ postId }, { savedBy }]
            })
            if (post) {
                res.send({ message: "This post is already in your favourite" })
            }
            else {
                const result = await favouriteCollection.insertOne(favourite)
                res.send(result)
            }
        })
        app.get('/blogs/favourites/:email', async (req, res) => {
            const email = req.params.email
            const filter = { savedBy: email }
            const result = await favouriteCollection.find(filter).toArray()
            res.send(result)
        })
        app.delete('/blogs/favourites/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: ObjectId(id) }
            const result = await favouriteCollection.deleteOne(filter)
            res.send(result)
        })

        // sslcommerz payment
        app.post('/payment', (req, res) => {
            const payment = req.body
            const transactionId = new ObjectId().toString();
            const filter = { email: payment?.paidEmail }
            const updatedDoc = { $set: { paid: false, transactionId } }
            const options = { upsert: true }
            const data = {
                total_amount: 200,
                currency: 'BDT',
                tran_id: transactionId,
                success_url: `http://localhost:5000/payment/success?transactionId=${transactionId}`,
                fail_url: 'http://localhost:5000/payment/fail',
                cancel_url: 'http://localhost:5000/payment/cancel',
                ipn_url: 'http://localhost:5000/payment/ipn',
                shipping_method: 'Online',
                product_name: 'Subscription.',
                product_category: 'Blogs',
                product_profile: 'Blogger',
                cus_name: payment?.paidBy,
                cus_email: payment?.paidEmail,
                cus_add1: payment?.time,
                cus_add2: payment?.date,
                cus_city: 'Dhaka',
                cus_state: 'Dhaka',
                cus_postcode: '1000',
                cus_country: 'Bangladesh',
                cus_phone: '01711111111',
                cus_fax: '01711111111',
                ship_name: payment?.paidBy,
                ship_add1: 'Dhaka',
                ship_add2: 'Dhaka',
                ship_city: 'Dhaka',
                ship_state: 'Dhaka',
                ship_postcode: 1000,
                ship_country: 'Bangladesh',

            };
            const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive)
            sslcz.init(data).then(apiResponse => {
                let GatewayPageURL = apiResponse.GatewayPageURL
                userCollection.updateOne(filter, updatedDoc, options)
                res.send({ url: GatewayPageURL })
            });
        })
        app.post('/payment/success', async (req, res) => {
            const transactionId = req.query.transactionId;
            const filter = { transactionId }
            const updatedDoc = {
                $set: {
                    paid: true,
                    paidAt: new Date(),
                }
            }
            const options = { upsert: true }
            const result = await userCollection.updateOne(filter, updatedDoc, options)
            if (result.modifiedCount > 0) {
                res.redirect(`http://localhost:3000/payment/success?transactionId=${transactionId}`)
            }

        })

    } finally { }
}

run().catch(err => console.error(err))


app.get('/', (req, res) => {
    res.send('uptodate blog server is running...')
})

app.listen(port, () => {
    console.log(`uptodate server is running on port ${port}`)
})