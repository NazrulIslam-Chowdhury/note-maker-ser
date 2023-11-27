const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const path = require("path");

const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hnlrj23.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});
const __dirname = path.resolve();

app.use(
  cors({
    methods: ["POST", "GET", "PUT", "PATCH", "DELETE", "OPTIONS"],
  })
);

// routes
async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");

    const categories = client.db("noteMaker").collection("categories");
    const notes = client.db("noteMaker").collection("notes");
    const bin_notes = client.db("noteMaker").collection("binNotes");

    // categories
    app.post("/note-categories", async (req, res) => {
      const category = req.body;
      const categoryCollection = await categories.insertOne(category);
      res.send(categoryCollection);
    });

    app.get("/categories", async (req, res) => {
      const email = req.query.email;
      const filter = { user_email: email };
      const result = await categories.find(filter).toArray();
      res.send(result);
    });
    app.delete("/categories/:category", async (req, res) => {
      const email = req.query.email;
      const category = req.params.category;
      const filter = { user_email: email, category };
      const result = await categories.deleteMany(filter);
      res.send(result);
    });

    // delete all notes of a category
    app.delete("/categoryNotes/:category", async (req, res) => {
      const email = req.query.email;
      const category = req.params.category;
      const filter = { category: category, email: email };
      const result = await notes.deleteMany(filter);
      res.send(result);
    });

    app.get("/categoryNotebooks/:name/:email", async (req, res) => {
      const name = req.params.name;
      const email = req.params.email;
      const note = { category: name, email: email };
      const result = await notes.find(note).toArray();
      res.send(result);
    });

    // notes
    app.post("/notes", async (req, res) => {
      const note = req.body;
      const noteCollection = await notes.insertOne(note);
      res.send(noteCollection);
    });

    app.get("/notesAll", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const resultArr = await notes.find(query).toArray();
      res.send(resultArr);
    });

    app.delete("/notesAll/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await notes.deleteOne(query);
      res.send(result);
    });
    app.get("/notesAll/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await notes.findOne(query);
      res.send(result);
    });

    app.put("/notesAll/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const document = req.body;
      const option = { upsert: true };
      const updateDescription = {
        $set: {
          category: document.category,
          title: document.title,
          description: document.description,
          image: document.image,
        },
      };
      const result = await notes.updateOne(query, updateDescription, option);
      res.send(result);
    });

    // bin
    app.post("/binNotes", async (req, res) => {
      const binNote = req.body;
      const result = await bin_notes.insertOne(binNote);
      res.send(result);
    });

    app.get("/binNotes", async (req, res) => {
      const email = req.query.email;
      const query = { email };
      const result = await bin_notes.find(query).toArray();
      res.send(result);
    });

    app.delete("/binNotes/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bin_notes.deleteOne(query);
      res.send(result);
    });
    app.delete("/delete-bin", async (req, res) => {
      const email = req.query.email;
      const filter = { email };
      const result = await bin_notes.deleteMany(filter);
      res.send(result);
    });

    // favorite
    app.put("/notesAll/favorite/:id", async (req, res) => {
      const id = req.params.id;
      const favorite = req.body;
      const query = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const addFavorite = {
        $set: { favorite },
      };
      const result = await notes.updateOne(query, addFavorite, option);
      res.send(result);
    });

    app.get("/favorite-notes", async (req, res) => {
      const email = req.query.email;
      const filter = { email, favorite: { isFavorite: true } };
      const result = await notes.find(filter).toArray();
      res.send(result);
    });
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port:${port}`);
});

app.use(express.static(path.join(__dirname, "/client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "client", "dist", "index.html"));
});
