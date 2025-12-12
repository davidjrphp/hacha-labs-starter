<?php
// WRITTEN BY DAVID MWELWA
// EVEN IF YOU KNOW WHAT YOU"RE DOING, LEAVE THIS CODE ALONE, IT'S NONE OF YOUR DAME BUSINESS
// THIS IS NOT YOUR MOTHER'S CODE, DON"T TOUCH ANYTHING HERE
// DON'T EXPERIMENT YOUR SKILLS ON THIS SCRIPT, GO TO YOUTUBE AND LEARN AND DEVELOP YOUR OWN SCRIPT FOR EXPERIMENTS
// REMEMBER, IF IT WORKS DON'T TOUCH IT, DON'T TRY TO INVESTIGATE WHY AND HOW IT WORKS 

namespace Controllers;

use Core\DB;

class MediaController
{
    public function hero()
    {
        $pdo = DB::conn();
        $rows = $pdo->query("SELECT id,type,path,caption FROM media WHERE is_hero=1 ORDER BY created_at DESC LIMIT 6")->fetchAll();
        foreach ($rows as &$row) {
            $row['path'] = $this->assetUrl($row['path']);
        }
        return $rows;
    }

    public function store()
    {
        $this->requireAdmin();

        if (!isset($_FILES['media']) || $_FILES['media']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(422);
            return ['message' => 'Media file is required'];
        }

        $type = $_POST['type'] ?? 'image';
        if (!in_array($type, ['image', 'video'], true)) {
            http_response_code(422);
            return ['message' => 'Invalid media type'];
        }

        $caption = trim($_POST['caption'] ?? '');
        $isHero = filter_var($_POST['is_hero'] ?? '0', FILTER_VALIDATE_BOOLEAN);

        $path = $this->storeUpload($_FILES['media'], $type);

        $pdo = DB::conn();
        $stmt = $pdo->prepare("INSERT INTO media (type,path,caption,is_hero) VALUES (?,?,?,?)");
        $stmt->execute([$type, $path, $caption, $isHero ? 1 : 0]);

        return [
            'message' => 'Media saved',
            'media'   => [
                'id'      => (int)$pdo->lastInsertId(),
                'type'    => $type,
                'path'    => $this->assetUrl($path),
                'caption' => $caption,
                'is_hero' => $isHero,
            ],
        ];
    }

    public function adminList()
    {
        $this->requireAdmin();
        $pdo = DB::conn();
        $rows = $pdo->query("SELECT id,type,path,caption,is_hero,created_at FROM media ORDER BY created_at DESC")->fetchAll();
        foreach ($rows as &$row) {
            $row['path'] = $this->assetUrl($row['path']);
        }
        return $rows;
    }

    public function update()
    {
        $this->requireAdmin();
        $data = json_decode(file_get_contents('php://input'), true) ?? [];
        $id = (int)($data['id'] ?? 0);
        if ($id <= 0) {
            http_response_code(422);
            return ['message' => 'Invalid media id'];
        }
        $fields = [];
        $params = [];
        if (array_key_exists('caption', $data)) {
            $fields[] = 'caption = ?';
            $params[] = trim((string)$data['caption']);
        }
        if (array_key_exists('is_hero', $data)) {
            $fields[] = 'is_hero = ?';
            $params[] = (int)filter_var($data['is_hero'], FILTER_VALIDATE_BOOLEAN);
        }
        if (empty($fields)) {
            return ['message' => 'Nothing to update'];
        }
        $params[] = $id;
        $pdo = DB::conn();
        $stmt = $pdo->prepare('UPDATE media SET ' . implode(',', $fields) . ' WHERE id = ?');
        $stmt->execute($params);
        return ['message' => 'Media updated'];
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
            return ['message' => 'Invalid media id'];
        }
        $pdo = DB::conn();
        $stmt = $pdo->prepare('SELECT path FROM media WHERE id=? LIMIT 1');
        $stmt->execute([$id]);
        $media = $stmt->fetch();
        if (!$media) {
            http_response_code(404);
            return ['message' => 'Media not found'];
        }
        if (!str_starts_with($media['path'], 'http')) {
            $file = __DIR__ . '/../../public' . $media['path'];
            if (is_file($file)) {
                @unlink($file);
            }
        }
        $pdo->prepare('DELETE FROM media WHERE id=?')->execute([$id]);
        return ['message' => 'Media deleted'];
    }

    private function requireAdmin(): void
    {
        if ((int)($_SESSION['role_id'] ?? 0) !== 1) {
            http_response_code(403);
            echo json_encode(['message' => 'Forbidden']);
            exit;
        }
    }

    private function storeUpload(array $file, string $type): string
    {
        $allowed = $type === 'video'
            ? ['mp4', 'mov']
            : ['jpg', 'jpeg', 'png', 'webp'];
        $limit = $type === 'video' ? 200 * 1024 * 1024 : 30 * 1024 * 1024; // 200MB video, 30MB image

        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if (!in_array($ext, $allowed, true)) {
            http_response_code(422);
            echo json_encode(['message' => 'Unsupported file extension']);
            exit;
        }

        if ($file['size'] > $limit) {
            http_response_code(413);
            $msg = $type === 'video' ? 'Video exceeds 200MB limit' : 'Image exceeds 30MB limit';
            echo json_encode(['message' => $msg]);
            exit;
        }

        $directory = __DIR__ . '/../../public/uploads/media';
        if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
            http_response_code(500);
            echo json_encode(['message' => 'Unable to create media directory']);
            exit;
        }

        $filename = uniqid('media_', true) . '.' . $ext;
        $dest = $directory . '/' . $filename;

        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            http_response_code(500);
            echo json_encode(['message' => 'Failed to move uploaded file']);
            exit;
        }

        return '/uploads/media/' . $filename;
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
