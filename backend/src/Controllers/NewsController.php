<?php
namespace Controllers;

use Core\DB;
use PDO;

class NewsController
{
    public function latest()
    {
        $pdo = DB::conn();
        $all = isset($_GET['all']) && $_GET['all'] == '1';

        $sql = "SELECT id,title,cover_path,LEFT(body,220) AS excerpt,created_at FROM news WHERE is_published=1 ORDER BY created_at DESC";
        if (!$all) {
            $sql .= " LIMIT 6";
        }
        $rows = $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['cover_path'] = $this->assetUrl($row['cover_path']);
        }
        return $rows;
    }

    public function store()
    {
        $this->requireAdmin();

        $title = trim($_POST['title'] ?? '');
        $body  = trim($_POST['body'] ?? '');
        $publish = filter_var($_POST['is_published'] ?? '1', FILTER_VALIDATE_BOOLEAN);

        if ($title === '' || $body === '') {
            http_response_code(422);
            return ['message' => 'Title and body are required'];
        }

        $coverPath = null;
        if (isset($_FILES['cover']) && $_FILES['cover']['error'] === UPLOAD_ERR_OK) {
            $coverPath = $this->storeCover($_FILES['cover']);
        }

        $pdo = DB::conn();
        $stmt = $pdo->prepare("INSERT INTO news (title, body, cover_path, is_published) VALUES (?,?,?,?)");
        $stmt->execute([$title, $body, $coverPath, $publish ? 1 : 0]);

        return [
            'message' => 'News saved',
            'news' => [
                'id'          => (int)$pdo->lastInsertId(),
                'title'       => $title,
                'cover_path'  => $this->assetUrl($coverPath),
                'is_published'=> $publish,
            ],
        ];
    }

    private function requireAdmin(): void
    {
        if ((int)($_SESSION['role_id'] ?? 0) !== 1) {
            http_response_code(403);
            echo json_encode(['message' => 'Forbidden']);
            exit;
        }
    }

    private function storeCover(array $file): string
    {
        $allowed = ['jpg', 'jpeg', 'png', 'webp'];
        $limit = 30 * 1024 * 1024;
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

        if (!in_array($ext, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Unsupported cover file']);
            exit;
        }

        if ($file['size'] > $limit) {
            http_response_code(413);
            echo json_encode(['message' => 'Cover exceeds 30MB limit']);
            exit;
        }

        $directory = __DIR__ . '/../../public/uploads/news';
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            http_response_code(500);
            echo json_encode(['message' => 'Unable to create news directory']);
            exit;
        }

        $filename = uniqid('news_', true) . '.' . $ext;
        $dest = $directory . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to store cover']);
            exit;
        }

        return '/uploads/news/' . $filename;
    }

    private function assetUrl(?string $path): ?string
    {
        if (!$path) {
            return null;
        }
        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }
        $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
        $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
        return $scheme . '://' . $host . $path;
    }
}
