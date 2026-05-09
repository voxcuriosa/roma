<?php
header('Content-Type: application/json');

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

if (!$input) {
    die(json_encode(['success' => false, 'error' => 'Invalid input']));
}

$action = isset($input['action']) ? $input['action'] : 'save';
$name = isset($input['name']) ? $input['name'] : 'Uten navn';
$imagePath = isset($input['imagePath']) ? $input['imagePath'] : null;
$corners = isset($input['corners']) ? $input['corners'] : null;

if (!$imagePath || !$corners) {
    die(json_encode(['success' => false, 'error' => 'Missing data (imagePath or corners)']));
}

$publishedFile = 'published_maps.json';
$publishedData = [];

if (file_exists($publishedFile)) {
    $publishedData = json_decode(file_get_contents($publishedFile), true);
    if (!$publishedData) $publishedData = [];
}

$found = false;
foreach ($publishedData as &$map) {
    if ($map['imagePath'] === $imagePath) {
        $map['name'] = $name;
        $map['corners'] = $corners;
        $found = true;
        break;
    }
}

if (!$found) {
    $publishedData[] = [
        'name' => $name,
        'imagePath' => $imagePath,
        'corners' => $corners,
        'timestamp' => time()
    ];
}

file_put_contents($publishedFile, json_encode($publishedData, JSON_PRETTY_PRINT));
echo json_encode(['success' => true]);
?>
