<?php
namespace Controllers;

use Core\DB;
use PDO;

class OfficeController {
  public function list(){
    $pdo = DB::conn();
    $rows = $pdo->query("SELECT id, province, district, description, photo_path, created_at FROM offices ORDER BY created_at DESC")
                 ->fetchAll(PDO::FETCH_ASSOC);
    return $rows;
  }

  public function adminList(){
    $this->requireAdmin();
    return $this->list();
  }

  public function store(){
    $this->requireAdmin();
    $province = trim($_POST['province'] ?? '');
    $district = trim($_POST['district'] ?? '');
    $description = trim($_POST['description'] ?? '');
    if($province === '' || $district === ''){
      http_response_code(422);
      return ['message'=>'Province and district are required'];
    }

    $photoPath = null;
    if(isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK){
      $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
      if(!in_array($ext, ['jpg','jpeg','png','webp'])){
        http_response_code(400);
        return ['message'=>'Unsupported image type'];
      }
      $dir = __DIR__ . '/../../public/uploads/offices';
      if(!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)){
        http_response_code(500);
        return ['message'=>'Failed to create upload directory'];
      }
      $filename = uniqid('office_', true) . '.' . $ext;
      $dest = $dir . '/' . $filename;
      if(!move_uploaded_file($_FILES['photo']['tmp_name'], $dest)){
        http_response_code(500);
        return ['message'=>'Failed to save image'];
      }
      $photoPath = '/uploads/offices/' . $filename;
    }

    $pdo = DB::conn();
    $stmt = $pdo->prepare("INSERT INTO offices (province,district,description,photo_path) VALUES (?,?,?,?)");
    $stmt->execute([$province, $district, $description ?: null, $photoPath]);
    return ['message'=>'Office saved'];
  }

  public function update(){
    $this->requireAdmin();
    $id = (int)($_POST['id'] ?? 0);
    $province = trim($_POST['province'] ?? '');
    $district = trim($_POST['district'] ?? '');
    $description = trim($_POST['description'] ?? '');
    if($id <= 0 || $province === '' || $district === ''){
      http_response_code(422);
      return ['message'=>'Invalid payload'];
    }
    $pdo = DB::conn();
    $photoPath = null;
    if(isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK){
      $ext = strtolower(pathinfo($_FILES['photo']['name'], PATHINFO_EXTENSION));
      if(!in_array($ext, ['jpg','jpeg','png','webp'])){
        http_response_code(400);
        return ['message'=>'Unsupported image type'];
      }
      $dir = __DIR__ . '/../../public/uploads/offices';
      if(!is_dir($dir) && !mkdir($dir, 0755, true) && !is_dir($dir)){
        http_response_code(500);
        return ['message'=>'Failed to create upload directory'];
      }
      $filename = uniqid('office_', true) . '.' . $ext;
      $dest = $dir . '/' . $filename;
      if(!move_uploaded_file($_FILES['photo']['tmp_name'], $dest)){
        http_response_code(500);
        return ['message'=>'Failed to save image'];
      }
      $photoPath = '/uploads/offices/' . $filename;
    }
    $stmt = $pdo->prepare("UPDATE offices SET province=?, district=?, description=?, photo_path=COALESCE(?, photo_path) WHERE id=? LIMIT 1");
    $stmt->execute([$province, $district, $description ?: null, $photoPath, $id]);
    return ['message'=>'Office updated'];
  }

  public function delete(){
    $this->requireAdmin();
    $id = (int)($_POST['id'] ?? 0);
    if($id <= 0){
      http_response_code(422);
      return ['message'=>'Invalid id'];
    }
    $pdo = DB::conn();
    $stmt = $pdo->prepare("DELETE FROM offices WHERE id=? LIMIT 1");
    $stmt->execute([$id]);
    return ['message'=>'Office deleted'];
  }

  private function requireAdmin(): void {
    if ((int)($_SESSION['role_id'] ?? 0) !== 1) {
      http_response_code(403);
      echo json_encode(['message' => 'Forbidden']);
      exit;
    }
  }
}
