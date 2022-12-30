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
  } finally {
  }
}
run().catch((error) => console.log(error));

// Collection
const usersCollection = client.db("socialMediaSite").collection("users");
const postsCollection = client.db("socialMediaSite").collection("posts");

// Decode JWT
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized access" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    process.env.JWT_ACCESS_TOKEN_SECRET,
    function (err, decoded) {
      if (err) {
        return res.status(403).send({ message: "Forbidden access" });
      }
      req.decoded = decoded;
      next();
    }
  );
}

// Home
app.get("/", (req, res) => {
  res.send("Done");
});

// Create New USER
app.put("/users/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const user = req.body;
    const filter = { email: email };
    const updateDoc = {
      $set: user,
    };
    const options = { upsert: true };
    const result = await usersCollection.updateOne(filter, updateDoc, options);
    const token = jwt.sign(user, process.env.JWT_ACCESS_TOKEN_SECRET, {
      expiresIn: "365d",
    });
    res.send({ result, token });
  } catch (error) {
    console.log(error);
  }
});

// Get USERS
app.get("/users", async (req, res) => {
  try {
    const query = {};
    const result = await usersCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
// Get USERS
app.get("/users/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const query = { email: email };
    const result = await usersCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// Create New POST
app.post("/posts", async (req, res) => {
  try {
    const post = req.body;
    const result = await postsCollection.insertOne(post);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// increment decrement like button
app.put("/post-like/:id", async (req, res) => {
  try {
    const body = req.body;
    // console.log(body)
    const id = req.params.id;

    console.log(id);
    const userEmail = req.query.email;
    const post = await postsCollection.find({ _id: ObjectId(id) }).toArray();
    // const findUserInfo = post.find(likedInfo=>likedInfo.email === body.userLiked.email)
    const userInfo = await post[0].userLiked;
    const userFind = await userInfo?.find((user) => user.email === userEmail);
    const userFindIndex = await userInfo?.findIndex(
      (user) => user === userFind
    );
    // console.log(userFindIndex)
    console.log(userEmail, userFind);
    if (userFind?.liked === true) {
      console.log("if");
      const filter = { _id: ObjectId(id) };
      const increment = userFind.liked ? { like: -1 } : { like: +1 };
      const likedUserInfo = userFind.liked ? false : true;
      const updateDoc = { $inc: increment };
      const options = { upsert: true };
      const result = await postsCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      const updateLiked = postsCollection.findOneAndUpdate(
        { _id: ObjectId(id), "userLiked.email": userEmail },
        {
          $set: {
            "userLiked.$.liked": likedUserInfo,
          },
        }
      );
      res.send(result);
      return;
    } else if (userFind?.liked === false) {
      const filter = { _id: ObjectId(id) };
      const increment = userFind.liked ? { like: -1 } : { like: +1 };
      const likedUserInfo = userFind.liked ? false : true;
      const updateDoc = { $inc: increment };
      const options = { upsert: true };
      const result = await postsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const updateLiked = postsCollection.findOneAndUpdate(
        { _id: ObjectId(id), "userLiked.email": userEmail },
        {
          $set: {
            "userLiked.$.liked": likedUserInfo,
          },
        }
      );

      res.send(result);
    } else {
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $inc: { like: +1 },
        $push: { userLiked: { liked: true, email: userEmail } },
      };
      const options = { upsert: true };
      const result = await postsCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      const updateLiked = postsCollection.findOneAndUpdate(
        { _id: ObjectId(id), "userLiked.email": userEmail },
        {
          $set: {
            "userLiked.$.liked": true,
          },
        }
      );
      res.send(result);
    }
  } catch (error) {
    console.log(error);
  }
});

// Create Comment
app.post("/post-comment/:id", async (req, res) => {
  try {
    const comment = req.body;
    const id = req.params.id;
    const email = req.query.email;
    const filter = { _id: ObjectId(id) };
    const updateDoc = { $push: { userComment: comment } };
    const options = { upsert: true };
    const result = await postsCollection.updateOne(filter, updateDoc, options);
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// Get all comment
app.get("/post-comment/:id", async (req, res) => {
  try {
    const query = {};
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await postsCollection.find(filter).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// Get all post
app.get("/posts", verifyJWT, async (req, res) => {
  try {
    const query = {};
    const result = await postsCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
// Get Top 3 post
app.get("/top-posts", async (req, res) => {
  try {
    const query = {};
    const result = await postsCollection.find(query).toArray();
    const data = result
      .sort(function (a, b) {
        return b.like - a.like;
      })
      .slice(0, 3);
    res.send(data);
  } catch (error) {
    console.log(error);
  }
});
// Get post by id
app.get("/post/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const filter = { _id: ObjectId(id) };
    const result = await postsCollection.find(filter).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

// Get POST By Email
app.get("/posts/:email", async (req, res) => {
  try {
    const email = req.params.email;
    const query = { email: email };
    const result = await postsCollection.find(query).toArray();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});
//  Delete all POST 
// app.delete("/posts", async (req, res) => {
//   try {
//     const email = req.params.email;
//     const query = { email: email };
//     const result = await postsCollection.deleteMany({});
//     res.send(result);
//   } catch (error) {
//     console.log(error);
//   }
// });

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server Running Successful On Port ${port}`);
});
