const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static("public"));

app.get("/data", (req, res) => {
  const data = fs.readFileSync("data.json", "utf8");
  res.json(JSON.parse(data));
});

app.post("/data", (req, res) => {
  const data = JSON.parse(fs.readFileSync("data.json", "utf8"));
  data.push(req.body);
  fs.writeFileSync("data.json", JSON.stringify(data, null, 2));
  res.send("saved");
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
