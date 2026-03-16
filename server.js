const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "public", "foodShopsData.json");
const PIC_DIR = path.join(__dirname, "public", "pic");

if (!fs.existsSync(PIC_DIR)) {
  fs.mkdirSync(PIC_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, PIC_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    cb(null, `${unique}${ext}`);
  }
});

const upload = multer({ storage });

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

function readShops() {
  try {
    const text = fs.readFileSync(DATA_FILE, "utf8");
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
  } catch (err) {
    return [];
  }
}

function writeShops(shops) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(shops, null, 2), "utf8");
}

app.post("/save", upload.single("thumbnail"), (req, res) => {
  const { name, lat, lng, loc, food, des, link, date, timezone } = req.body;
  if (!name || !lat || !lng || !loc || !food || !des || !link) {
    return res.status(400).json({ status: "error", message: "Missing required fields" });
  }

  const shops = readShops();
  const newShop = {
    id: Date.now(),
    name: name.toString().trim(),
    thumbnail: req.file ? `pic/${req.file.filename}` : "",
    lat: Number(lat),
    lng: Number(lng),
    location: loc.toString().trim(),
    food: food.toString().split(",").map((v) => v.trim()).filter(Boolean),
    description: des.toString().trim(),
    link: link.toString().trim(),
    date: date ? date.toString().trim() : "",
    timezone: timezone ? timezone.toString().trim() : ""
  };

  shops.push(newShop);
  writeShops(shops);

  return res.json({ status: "success", shop: newShop });
});

app.post("/delete", (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ status: "error", message: "Missing id" });
  }

  const shops = readShops();
  const filtered = shops.filter((shop) => String(shop.id) !== String(id));
  writeShops(filtered);
  return res.json({ status: "deleted" });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
