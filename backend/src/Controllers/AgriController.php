<?php
// WRITTEN BY DAVID MWELWA
// EVEN IF YOU KNOW WHAT YOU"RE DOING, LEAVE THIS CODE ALONE, IT'S NONE OF YOUR DAME BUSINESS
// THIS IS NOT YOUR MOTHER'S CODE, DON"T TOUCH ANYTHING HERE
// DON'T EXPERIMENT YOUR SKILLS ON THIS SCRIPT, GO TO YOUTUBE AND LEARN AND DEVELOP YOUR OWN SCRIPT FOR EXPERIMENTS
// REMEMBER, IF IT WORKS DON'T TOUCH IT, DON'T TRY TO INVESTIGATE WHY AND HOW IT WORKS 
namespace Controllers;

use Core\DB;
use PDO;

class AgriController {
  private function requireAdmin(): void {
    if ((int)($_SESSION['role_id'] ?? 0) !== 1) {
      http_response_code(403);
      echo json_encode(['message' => 'Forbidden']);
      exit;
    }
  }

  private function ensureTable(): void {
    static $ready = false;
    if ($ready) return;
    $pdo = DB::conn();
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS agriculture_posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        title VARCHAR(160) NOT NULL,
        description TEXT,
        image_path VARCHAR(255),
        is_published BOOLEAN DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    ");
    $ready = true;
  }

  public function listPublic(){
    $this->ensureTable();
    $pdo = DB::conn();
    $rows = $pdo->query("SELECT id,title,description,image_path FROM agriculture_posts WHERE is_published=1 ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
    foreach($rows as &$row){
      $row['image_path'] = $this->assetUrl($row['image_path']);
    }
    return $rows;
  }

  public function adminList(){
    $this->ensureTable();
    $this->requireAdmin();
    $rows = DB::conn()->query("SELECT * FROM agriculture_posts ORDER BY created_at DESC")->fetchAll(PDO::FETCH_ASSOC);
    foreach($rows as &$row){
      $row['image_path'] = $this->assetUrl($row['image_path']);
      $row['is_published'] = (bool)$row['is_published'];
    }
    return $rows;
  }

  public function store(){
    $this->ensureTable();
    $this->requireAdmin();
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $isPublished = filter_var($_POST['is_published'] ?? '0', FILTER_VALIDATE_BOOLEAN);
    if($title === ''){
      http_response_code(422);
      return ['message'=>'Title is required'];
    }
    $imagePath = null;
    if(isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK){
      $imagePath = $this->storeImage($_FILES['image']);
    }
    $stmt = DB::conn()->prepare("INSERT INTO agriculture_posts (title,description,image_path,is_published) VALUES (?,?,?,?)");
    $stmt->execute([$title,$description,$imagePath,$isPublished ? 1 : 0]);
    return ['message'=>'Saved','id'=>(int)DB::conn()->lastInsertId()];
  }

  public function update(){
    $this->ensureTable();
    $this->requireAdmin();
    $id = (int)($_POST['id'] ?? 0);
    if($id <= 0){
      http_response_code(422);
      return ['message'=>'Invalid id'];
    }
    $pdo = DB::conn();
    $current = $pdo->prepare("SELECT image_path FROM agriculture_posts WHERE id=? LIMIT 1");
    $current->execute([$id]);
    $row = $current->fetch(PDO::FETCH_ASSOC);
    if(!$row){
      http_response_code(404);
      return ['message'=>'Not found'];
    }
    $fields = [];
    $params = [];
    if(isset($_POST['title'])){
      $title = trim($_POST['title']);
      if($title === ''){
        http_response_code(422);
        return ['message'=>'Title is required'];
      }
      $fields[] = 'title = ?';
      $params[] = $title;
    }
    if(isset($_POST['description'])){
      $fields[] = 'description = ?';
      $params[] = trim($_POST['description']);
    }
    if(isset($_POST['is_published'])){
      $fields[] = 'is_published = ?';
      $params[] = filter_var($_POST['is_published'], FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    }
    if(isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK){
      $newPath = $this->storeImage($_FILES['image']);
      $fields[] = 'image_path = ?';
      $params[] = $newPath;
      if(!empty($row['image_path'])){
        $this->deleteImage($row['image_path']);
      }
    }
    if(empty($fields)){
      return ['message'=>'Nothing to update'];
    }
    $params[] = $id;
    $pdo->prepare('UPDATE agriculture_posts SET '.implode(',',$fields).' WHERE id=?')->execute($params);
    return ['message'=>'Updated'];
  }

  public function delete(){
    $this->ensureTable();
    $this->requireAdmin();
    $id = (int)($_POST['id'] ?? 0);
    if($id <= 0){
      http_response_code(422);
      return ['message'=>'Invalid id'];
    }
    $pdo = DB::conn();
    $current = $pdo->prepare("SELECT image_path FROM agriculture_posts WHERE id=? LIMIT 1");
    $current->execute([$id]);
    $row = $current->fetch(PDO::FETCH_ASSOC);
    if(!$row){
      http_response_code(404);
      return ['message'=>'Not found'];
    }
    $pdo->prepare("DELETE FROM agriculture_posts WHERE id=?")->execute([$id]);
    if(!empty($row['image_path'])){
      $this->deleteImage($row['image_path']);
    }
    return ['message'=>'Deleted'];
  }

  private function storeImage(array $file): string {
    $allowed = ['jpg','jpeg','png','webp'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if(!in_array($ext,$allowed,true)){
      http_response_code(422);
      echo json_encode(['message'=>'Unsupported image type']);
      exit;
    }
    $dir = __DIR__.'/../../public/uploads/agri';
    if(!is_dir($dir) && !mkdir($dir,0755,true) && !is_dir($dir)){
      http_response_code(500);
      echo json_encode(['message'=>'Unable to create directory']);
      exit;
    }
    $filename = uniqid('agri_', true).'.'.$ext;
    $dest = $dir.'/'.$filename;
    if(!move_uploaded_file($file['tmp_name'],$dest)){
      http_response_code(500);
      echo json_encode(['message'=>'Failed to store image']);
      exit;
    }
    return '/uploads/agri/'.$filename;
  }

  private function deleteImage(string $path): void {
    if(str_starts_with($path,'http://') || str_starts_with($path,'https://')) return;
    $file = __DIR__.'/../../public'.$path;
    if(is_file($file)){
      @unlink($file);
    }
  }

  private function assetUrl(?string $path): ?string {
    if(!$path) return null;
    if(str_starts_with($path,'http://') || str_starts_with($path,'https://')) return $path;
    $scheme = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
    $host = $_SERVER['HTTP_HOST'] ?? 'localhost';
    return $scheme.'://'.$host.$path;
  }
}
