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

    public function adminList()
    {
        $this->requireAdmin();
        $pdo = DB::conn();
        $rows = $pdo->query("SELECT id,title,body,cover_path,is_published,created_at FROM news ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
        foreach ($rows as &$row) {
            $row['cover_path'] = $this->assetUrl($row['cover_path']);
        }
        return $rows;
    }

    public function show()
    {
        $id = (int)($_GET['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(422);
            return ['message' => 'Invalid news id'];
        }
        $pdo = DB::conn();
        $stmt = $pdo->prepare("SELECT id,title,body,cover_path,created_at FROM news WHERE id=? AND is_published=1 LIMIT 1");
        $stmt->execute([$id]);
        $news = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$news) {
            http_response_code(404);
            return ['message' => 'News not found'];
        }
        $news['cover_path'] = $this->assetUrl($news['cover_path']);
        return $news;
    }

    public function update()
    {
        $this->requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(422);
            return ['message' => 'Invalid news id'];
        }
        $fields = [];
        $params = [];
        if (array_key_exists('title', $data)) {
            $fields[] = 'title = ?';
            $params[] = trim((string)$data['title']);
        }
        if (array_key_exists('body', $data)) {
            $fields[] = 'body = ?';
            $params[] = trim((string)$data['body']);
        }
        if (array_key_exists('is_published', $data)) {
            $fields[] = 'is_published = ?';
            $params[] = (int)filter_var($data['is_published'], FILTER_VALIDATE_BOOLEAN);
        }
        if (empty($fields)) {
            return ['message' => 'Nothing to update'];
        }
        $params[] = $id;
        $pdo = DB::conn();
        $stmt = $pdo->prepare('UPDATE news SET ' . implode(',', $fields) . ' WHERE id = ?');
        $stmt->execute($params);
        return ['message' => 'News updated'];
    }

    public function delete()
    {
        $this->requireAdmin();
        $payload = $_POST;
        if (empty($payload)) {
            $payload = json_decode(file_get_contents('php://input'), true) ?? [];
        }
        $id = (int)($payload['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(422);
            return ['message' => 'Invalid news id'];
        }

        $pdo = DB::conn();
        $stmt = $pdo->prepare('SELECT cover_path FROM news WHERE id=? LIMIT 1');
        $stmt->execute([$id]);
        $news = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$news) {
            http_response_code(404);
            return ['message' => 'News not found'];
        }
        if (!empty($news['cover_path']) && !str_starts_with($news['cover_path'], 'http')) {
            $file = __DIR__ . '/../../public' . $news['cover_path'];
            if (is_file($file)) {
                @unlink($file);
            }
        }

        $pdo->prepare('DELETE FROM news WHERE id=?')->execute([$id]);
        return ['message' => 'News deleted'];
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
