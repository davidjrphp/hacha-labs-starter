<?php
session_start();

header('Content-Type: application/json');

// Increase upload limits for hero/news assets (falls back to php.ini if lower)
@ini_set('upload_max_filesize', '200M');
@ini_set('post_max_size', '210M');

// Allow Vite frontend during development (support localhost/127.0.0.1 and arbitrary dev ports)
$allowedOrigins = array_filter(array_map('trim', explode(',', getenv('APP_ALLOWED_ORIGINS') ?: 'http://localhost:5173,http://127.0.0.1:5173')));
$requestOrigin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($requestOrigin !== '') {
    $host = parse_url($requestOrigin, PHP_URL_HOST);
    if (in_array($requestOrigin, $allowedOrigins, true) || in_array($host, ['127.0.0.1', 'localhost'], true)) {
        header('Access-Control-Allow-Origin: ' . $requestOrigin);
    } else {
        header('Access-Control-Allow-Origin: ' . reset($allowedOrigins));
    }
} else {
    header('Access-Control-Allow-Origin: ' . reset($allowedOrigins));
}
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// Composer autoload, etc.
$autoload = __DIR__ . '/../vendor/autoload.php';
if (file_exists($autoload)) {
    require $autoload;
}

spl_autoload_register(function (string $class) {
    $path = __DIR__ . '/' . str_replace('\\', '/', $class) . '.php';
    if (is_file($path)) {
        require $path;
    }
});
