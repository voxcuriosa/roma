<?php
/**
 * Ultra-Simple Image Proxy for Rome Map
 * Maximum compatibility for restricted hosting environments
 */

if (!isset($_GET['url'])) {
    die("No URL provided.");
}

$url = $_GET['url'];

// Set a generic image header if we can't detect the specific type
header('Cache-Control: public, max-age=86400');

// Use simple readfile if allow_url_fopen is on
if (ini_get('allow_url_fopen')) {
    // Try to set content type based on extension as a fallback
    $ext = strtolower(pathinfo($url, PATHINFO_EXTENSION));
    if ($ext == 'jpg' || $ext == 'jpeg') header('Content-Type: image/jpeg');
    elseif ($ext == 'png') header('Content-Type: image/png');
    elseif ($ext == 'webp') header('Content-Type: image/webp');
    
    readfile($url);
    exit;
}

// Fallback to CURL if readfile fails
if (function_exists('curl_init')) {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, 1);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 0); // Stream directly to output
    curl_setopt($ch, CURLOPT_TIMEOUT, 10);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) RomeMapProxy/1.2');
    curl_exec($ch);
    curl_close($ch);
    exit;
}

echo "Proxy Error: Server configuration prevents fetching external images.";
?>
