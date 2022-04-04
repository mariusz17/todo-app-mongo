const express = require("express");
const path = require("path");
const sanitizeHTML = require("sanitize-html");
const app = express();
const { MongoClient, ObjectId } = require("mongodb");

const uri = "mongodb://user:pass@localhost:27017"; //enter user and pass to MongoDB
const client = new MongoClient(uri);
let db;
const port = process.env.PORT || 3000;

//this is to access data from the form that user has posted, like req.body.item below
app.use(
	express.urlencoded({
		extended: false,
	})
);
app.use(express.json());
app.use(express.static("public"));

async function run(database) {
	await client.connect();
	db = client.db(database);
	app.listen(port);
}

async function addNewItem(task) {
	const items = db.collection("items");
	const result = await items.insertOne({ task: task });
	console.log(`Wprowadzono nowy rekord z _id: ${result.insertedId}`);
	return result;
}

async function deleteAllItems() {
	const items = db.collection("items");
	const result = await items.deleteMany();
	console.log(`Usunięto tyle rekordów: ${result.deletedCount}`);
}

async function getAllItems() {
	const items = db.collection("items");
	const query = {};
	const options = {
		// Include only the `title` and `imdb` fields in each returned document
		projection: { _id: 1, task: 1 },
	};
	const cursor = await items.find(query, options).toArray();
	return cursor;
}

async function updateItem(task, id) {
	const items = db.collection("items");
	const result = await items.updateOne(
		{ _id: new ObjectId(id) },
		{ $set: { task: task } }
	);
	console.log(`Zaktualizowano tyle rekordów: ${result.modifiedCount}`);
}

async function deleteItem(item) {
	const items = db.collection("items");
	await items.deleteOne({ _id: new ObjectId(item._id) });
}

function passwordProtected(req, res, next) {
	res.set("WWW-Authenticate", "Basic realm='Simple Todo App'");
	console.log(req.headers.authorization);
	if (req.headers.authorization === "Basic ZHVwYTpibGFkYQ==") {
		next();
	} else {
		res.status(401).send("Authentication required");
	}
}

app.use(passwordProtected);

app.get("/", function (req, res) {
	getAllItems().then((items) => {
		res.send(`<!DOCTYPE html>
		<html>
		
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<title>Simple To-Do App</title>
			<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.2.1/css/bootstrap.min.css"
				integrity="sha384-GJzZqFGwb1QTTN6wy59ffF1BuGJpLSa9DkKMp0DgiMDm4iYMj70gZWKYbI706tWS" crossorigin="anonymous">
		</head>
		
		<body>
			<div class="container">
				<h1 class="display-4 text-center py-1">To-Do App</h1>
		
				<div class="jumbotron p-3 shadow-sm">
					<form id ="create-form" action="/create-item" method="POST">
						<div class="d-flex align-items-center">
							<input id="create-field" name="item" autofocus autocomplete="off" class="form-control mr-3" type="text" style="flex: 1;">
							<button class="btn btn-primary">Add New Item</button>
						</div>
					</form>
				</div>
		
				<ul id="item-list" class="list-group pb-5">
				</ul>
		
			</div>
		<script>
			let items = ${JSON.stringify(items)}
		</script>
		<script src="browser.js"></script>
		
		</body>
		
		</html>`);
	});
	// res.sendFile(path.join(__dirname, "/index.html"));
});

app.post("/create-item", function (req, res) {
	const safeText = sanitizeHTML(req.body.task, {
		allowedTags: [],
		allowedAttributes: {},
	});
	addNewItem(safeText).then((item) =>
		res.json({ _id: item.insertedId, task: safeText })
	);
});

app.post("/update-item", function (req, res) {
	// addNewItem(req.body.task).then(res.redirect("/"));
	const safeText = sanitizeHTML(req.body.task, {
		allowedTags: [],
		allowedAttributes: {},
	});
	updateItem(safeText, req.body._id).then(res.send("OK"));
});

app.post("/delete-item", function (req, res) {
	// addNewItem(req.body.task).then(res.redirect("/"));
	deleteItem(req.body).then(res.send("OK"));
});

run("to-do-app").catch((err) =>
	console.log("Error connecting to database: ", err)
);
