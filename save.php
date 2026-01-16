<?php
header("Content-Type: application/json");

// JSON file path
$file = "foodShopsData.json";

// Read existing data
$data = json_decode(file_get_contents($file), true);
if (!$data) {
    $data = [];
}

// Get POST data
$newShop = [
    "id" => time(), // simple unique id
    "name" => $_POST["name"],
    "lat" => floatval($_POST["lat"]),
    "lng" => floatval($_POST["lng"]),
    "location" => $_POST["loc"],
    "food" => explode(",", $_POST["food"]),
    "description" => $_POST["des"],
    "link" => $_POST["link"]
];

// Add new entry
$data[] = $newShop;

// Save back to JSON
file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

echo json_encode(["status" => "success"]);
