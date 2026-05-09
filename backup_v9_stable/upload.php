<?php
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    die(json_encode(['success' => false, 'error' => 'Method not allowed']));
}

$targetDir = "assets/";
if (!file_exists($targetDir)) {
    if (!mkdir($targetDir, 0777, true)) {
        die(json_encode(['success' => false, 'error' => 'Failed to create assets directory. Check permissions.']));
    }
}

if (!isset($_FILES['image'])) {
    die(json_encode(['success' => false, 'error' => 'No file uploaded. Check post_max_size in php.ini.']));
}

$file = $_FILES['image'];
if ($file['error'] !== UPLOAD_ERR_OK) {
    $errors = [
        UPLOAD_ERR_INI_SIZE => 'Filen er for stor (php.ini).',
        UPLOAD_ERR_FORM_SIZE => 'Filen er for stor (HTML form).',
        UPLOAD_ERR_PARTIAL => 'Opplasting avbrutt.',
        UPLOAD_ERR_NO_FILE => 'Ingen fil valgt.',
        UPLOAD_ERR_NO_TMP_DIR => 'Mangler temp-mappe.',
        UPLOAD_ERR_CANT_WRITE => 'Kunne ikke skrive til disk.',
        UPLOAD_ERR_EXTENSION => 'En PHP-utvidelse stoppet opplastingen.'
    ];
    $errorMsg = isset($errors[$file['error']]) ? $errors[$file['error']] : 'Ukjent feil ved opplasting.';
    die(json_encode(['success' => false, 'error' => $errorMsg]));
}

$fileName = basename($file['name']);
$targetFilePath = $targetDir . $fileName;
$fileType = pathinfo($targetFilePath, PATHINFO_EXTENSION);

$allowTypes = array('jpg', 'png', 'jpeg', 'gif', 'webp');
if (in_array(strtolower($fileType), $allowTypes)) {
    if (move_uploaded_file($file['tmp_name'], $targetFilePath)) {
        echo json_encode(['success' => true, 'filePath' => $targetFilePath]);
    } else {
        echo json_encode(['success' => false, 'error' => 'Failed to move file to assets/. Check folder permissions.']);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'Only JPG, JPEG, PNG, WEBP & GIF files are allowed.']);
}
?>
