<?php
header("Content-Type: application/json");

$file = "foodShopsData.json";
$id = $_POST["id"] ?? null;

if (!$id) {
    echo json_encode(["status" => "error", "message" => "No ID"]);
    exit;
}

$data = json_decode(file_get_contents($file), true);
if (!$data) {
    echo json_encode(["status" => "error", "message" => "No data"]);
    exit;
}

// Filter out item with matching ID
$data = array_values(array_filter($data, function ($shop) use ($id) {
    return $shop["id"] != $id;
}));

file_put_contents(
    $file,
    json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE)
);

echo json_encode(["status" => "deleted"]);
