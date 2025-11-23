<?php
namespace Controllers;

use Core\DB;
use PDO;

class StaffController {
  public function list(){
    $pdo = DB::conn();
    $rows = $pdo->query("SELECT id,name,role_title,photo_path,bio FROM staff WHERE is_visible=1 ORDER BY sort_order,id")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$row) {
      $row['photo_path'] = $this->assetUrl($row['photo_path']);
    }
    return $rows;
  }

  public function adminList(){
    $this->requireAdmin();
    $pdo = DB::conn();
    $page = max(1,(int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['per_page'] ?? 8);
    if ($perPage < 1) $perPage = 1;
    if ($perPage > 50) $perPage = 50;
    $offset = ($page - 1) * $perPage;

    $total = (int)$pdo->query("SELECT COUNT(*) FROM staff")->fetchColumn();

    $stmt = $pdo->prepare("SELECT id,name,role_title,photo_path,bio,is_visible,sort_order FROM staff ORDER BY sort_order,id LIMIT :limit OFFSET :offset");
    $stmt->bindValue(':limit', $perPage, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$row) {
      $row['photo_path'] = $this->assetUrl($row['photo_path']);
      $row['is_visible'] = (bool)$row['is_visible'];
    }

    return [
      'data' => $rows,
      'meta' => [
        'page' => $page,
        'per_page' => $perPage,
        'total' => $total,
        'total_pages' => max(1, (int)ceil($total / $perPage)),
      ],
    ];
  }

  public function store(){
    $this->requireAdmin();

    $name = trim($_POST['name'] ?? '');
    $role = trim($_POST['role_title'] ?? '');
    $bio  = trim($_POST['bio'] ?? '');
    $sort = (int)($_POST['sort_order'] ?? 0);
    $isVisible = filter_var($_POST['is_visible'] ?? '1', FILTER_VALIDATE_BOOLEAN);

    if ($name === '' || $role === '') {
      http_response_code(422);
      return ['message' => 'Name and role are required'];
    }

    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
      http_response_code(422);
      return ['message' => 'Profile photo is required'];
    }

    $photoPath = $this->storePhoto($_FILES['photo']);

    $pdo = DB::conn();
    $stmt = $pdo->prepare("INSERT INTO staff (name,role_title,photo_path,bio,is_visible,sort_order) VALUES (?,?,?,?,?,?)");
    $stmt->execute([$name, $role, $photoPath, $bio, $isVisible ? 1 : 0, $sort]);

    return [
      'message' => 'Staff profile created',
      'staff' => [
        'id' => (int)$pdo->lastInsertId(),
        'name' => $name,
        'role_title' => $role,
        'bio' => $bio,
        'photo_path' => $this->assetUrl($photoPath),
        'is_visible' => $isVisible,
        'sort_order' => $sort,
      ],
    ];
  }

  public function update(){
    $this->requireAdmin();
    $payload = $_POST;
    if (empty($payload)) {
      $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    }
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) {
      http_response_code(422);
      return ['message' => 'Invalid staff id'];
    }

    $pdo = DB::conn();
    $stmt = $pdo->prepare("SELECT photo_path FROM staff WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$current) {
      http_response_code(404);
      return ['message' => 'Staff profile not found'];
    }

    $fields = [];
    $params = [];

    if (array_key_exists('name', $payload)) {
      $fields[] = 'name = ?';
      $params[] = trim((string)$payload['name']);
    }
    if (array_key_exists('role_title', $payload)) {
      $fields[] = 'role_title = ?';
      $params[] = trim((string)$payload['role_title']);
    }
    if (array_key_exists('bio', $payload)) {
      $fields[] = 'bio = ?';
      $params[] = trim((string)$payload['bio']);
    }
    if (array_key_exists('sort_order', $payload)) {
      $fields[] = 'sort_order = ?';
      $params[] = (int)$payload['sort_order'];
    }
    if (array_key_exists('is_visible', $payload)) {
      $fields[] = 'is_visible = ?';
      $params[] = (int)filter_var($payload['is_visible'], FILTER_VALIDATE_BOOLEAN);
    }

    $newPhotoPath = null;
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
      $newPhotoPath = $this->storePhoto($_FILES['photo']);
      $fields[] = 'photo_path = ?';
      $params[] = $newPhotoPath;
    }

    if (empty($fields)) {
      return ['message' => 'Nothing to update'];
    }

    $params[] = $id;
    $pdo->prepare('UPDATE staff SET ' . implode(',', $fields) . ' WHERE id = ?')->execute($params);

    if ($newPhotoPath && !empty($current['photo_path'])) {
      $this->deletePhoto($current['photo_path']);
    }

    return ['message' => 'Staff profile updated'];
  }

  public function delete(){
    $this->requireAdmin();
    $payload = $_POST;
    if (empty($payload)) {
      $payload = json_decode(file_get_contents('php://input'), true) ?? [];
    }
    $id = (int)($payload['id'] ?? 0);
    if ($id <= 0) {
      http_response_code(422);
      return ['message' => 'Invalid staff id'];
    }

    $pdo = DB::conn();
    $stmt = $pdo->prepare("SELECT photo_path FROM staff WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$staff) {
      http_response_code(404);
      return ['message' => 'Staff profile not found'];
    }

    $pdo->prepare("DELETE FROM staff WHERE id = ?")->execute([$id]);
    if (!empty($staff['photo_path'])) {
      $this->deletePhoto($staff['photo_path']);
    }
    return ['message' => 'Staff profile deleted'];
  }

  private function requireAdmin(): void {
    if ((int)($_SESSION['role_id'] ?? 0) !== 1) {
      http_response_code(403);
      echo json_encode(['message' => 'Forbidden']);
      exit;
    }
  }

  private function storePhoto(array $file): string {
    $allowed = ['jpg','jpeg','png','webp'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed, true)) {
      http_response_code(422);
      echo json_encode(['message' => 'Unsupported photo type']);
      exit;
    }
    $limit = 20 * 1024 * 1024;
    if ($file['size'] > $limit) {
      http_response_code(413);
      echo json_encode(['message' => 'Photo exceeds 20MB limit']);
      exit;
    }
    $directory = __DIR__ . '/../../public/uploads/staff';
    if (!is_dir($directory) && !mkdir($directory, 0755, true) && !is_dir($directory)) {
      http_response_code(500);
      echo json_encode(['message' => 'Unable to create staff directory']);
      exit;
    }
    $filename = uniqid('staff_', true) . '.' . $ext;
    $dest = $directory . '/' . $filename;
    if (!move_uploaded_file($file['tmp_name'], $dest)) {
      http_response_code(500);
      echo json_encode(['message' => 'Failed to store staff photo']);
      exit;
    }
    return '/uploads/staff/' . $filename;
  }

  private function deletePhoto(string $path): void {
    if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
      return;
    }
    $file = __DIR__ . '/../../public' . $path;
    if (is_file($file)) {
      @unlink($file);
    }
  }

  private function assetUrl(?string $path): ?string {
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
