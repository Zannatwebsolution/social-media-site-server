const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
require("dotenv").config();

app.use(express.json());
app.use(cors());

const uri = process.env.URL;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

// Connect Database
async function run() {
  try {
    await client.connect();
  }finally {
  }
}
run().catch(error=>console.log(error))

// Collection
const usersCollection = client.db("socialMediaSite").collection("users");
const postsCollection = client.db("socialMediaSite").collection("posts");

// Decode JWT
function verifyJWT (req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: "Unauthorized access"})
  }
  
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      return res.status(403).send({message: "Forbidden access"})
    }
    req.decoded = decoded;
    next();
  })
}

// Home 
app.get("/", (req, res)=>{
	res.send("Done");
})

// Create New USER 
app.put("/users/:email", async (req, res)=>{
    try{
      const email = req.params.email;
      const user = req.body;
      const filter = {email: email}
      const updateDoc = {
        $set: user,
      }
      const options = {upsert: true}
      const result = await usersCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET, {expiresIn: "365d"})
      res.send(result);
    }
    catch(error){
      console.log(error)
    }
})

// Get USERS 
app.get("/users", async (req, res)=>{
    try{
      const query = {};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    }
    catch(error){
      console.log(error)
    }
})
// Get USERS 
app.get("/users/:email", async (req, res)=>{
    try{
      const email = req.params.email;
      const query = {email: email};
      const result = await usersCollection.find(query).toArray();
      res.send(result);
    }
    catch(error){
      console.log(error)
    }
})

// Create New POST 
app.post("/posts", async (req, res)=>{
  try{
    const post = req.body;
    const result = await postsCollection.insertOne(post);
    res.send(result);
  }
  catch(error){
    console.log(error)
  }
})

// Get POST 
app.get("/posts", async (req, res)=>{
  try{
    const query = {};
    const result = await postsCollection.find(query).toArray();
    res.send(result);
  }
  catch(error){
    console.log(error)
  }
})

// Get POST By Email
app.get("/posts/:email", async (req, res)=>{
  try{
    const email = req.params.email;
    const query = {email: email}
    const result = await postsCollection.find(query).toArray();
    res.send(result);
  }
  catch(error){
    console.log(error)
  }
})
// Get POST By Email
app.delete("/posts", async (req, res)=>{
  try{
    const email = req.params.email;
    const query = {email: email}
    const result = await postsCollection.deleteMany({});
    res.send(result);
  }
  catch(error){
    console.log(error)
  }
})

const port = process.env.PORT || 5000;
app.listen(port, ()=>{
  console.log(`Server Running Successful On Port ${port}`)
})