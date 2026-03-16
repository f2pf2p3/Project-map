<?php
header("Content-Type: application/json");

// JSON file path
$file = "foodShopsData.json";

function jsonResponse($status, $message = null) {
    $payload = ["status" => $status];
    if ($message !== null) {
        $payload["message"] = $message;
    }
    echo json_encode($payload);
    exit;
}

// Required fields check
$required = ["name", "lat", "lng", "loc", "food", "des", "link"];
foreach ($required as $field) {
    if (!isset($_POST[$field]) || trim($_POST[$field]) === "") {
        jsonResponse("error", "Missing required field: $field");
    }
}

// Read existing data safely
$jsonText = @file_get_contents($file);
if ($jsonText === false) {
    $data = [];
} else {
    $data = json_decode($jsonText, true);
    if (!is_array($data)) {
        $data = [];
    }
}

// Auto-increment ID from existing data
$nextId = 1;
if (!empty($data)) {
    $maxId = max(array_map(fn($shop) => isset($shop["id"]) ? intval($shop["id"]) : 0, $data));
    $nextId = $maxId + 1;
}

// Build new entry
$newShop = [
    "id" => $nextId,
    "name" => trim($_POST["name"]),
    "lat" => floatval($_POST["lat"]),
    "lng" => floatval($_POST["lng"]),
    "location" => trim($_POST["loc"]),
    "food" => array_filter(array_map('trim', explode(",", $_POST["food"])), fn($v) => $v !== ""),
    "description" => trim($_POST["des"]),
    "link" => trim($_POST["link"])
];

$data[] = $newShop;

$saved = file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE), LOCK_EX);
if ($saved === false) {
    jsonResponse("error", "Could not save data to file.");
}

jsonResponse("success");
