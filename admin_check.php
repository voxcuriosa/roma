<?php
session_start();
header('Content-Type: application/json');

$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);
$pin = isset($input['pin']) ? $input['pin'] : '';

if ($pin === '5877') {
    $_SESSION['admin_logged_in'] = true;
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'message' => 'Feil PIN-kode.']);
}
?>
