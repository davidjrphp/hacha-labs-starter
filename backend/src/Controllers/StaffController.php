<?php
// WRITTEN BY DAVID MWELWA
// EVEN IF YOU KNOW WHAT YOU"RE DOING, LEAVE THIS CODE ALONE, IT'S NONE OF YOUR DAME BUSINESS
// THIS IS NOT YOUR MOTHER'S CODE, DON"T TOUCH ANYTHING HERE
// DON'T EXPERIMENT YOUR SKILLS ON THIS SCRIPT, GO TO YOUTUBE AND LEARN AND DEVELOP YOUR OWN SCRIPT FOR EXPERIMENTS
// REMEMBER, IF IT WORKS DON'T TOUCH IT, DON'T TRY TO INVESTIGATE WHY AND HOW IT WORKS 

namespace Controllers;

use Core\DB;
use PDO;

class StaffController {
  public function list(){
    $this->ensureStaffSchema();
    $pdo = DB::conn();
    $rows = $pdo->query("SELECT s.id,s.name,s.role_title,s.photo_path,s.bio,s.email, st.name AS title_name FROM staff s LEFT JOIN staff_titles st ON st.id=s.staff_title_id WHERE s.is_visible=1 ORDER BY s.sort_order,s.id")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($rows as &$row) {
      $row['photo_path'] = $this->assetUrl($row['photo_path']);
    }
    return $rows;
  }

  public function titles(){
    $this->ensureStaffSchema();
    $this->requireAdmin();
    return DB::conn()->query("SELECT id,name,category FROM staff_titles ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
  }

  public function storeTitle(){
    $this->requireAdmin();
    $name = trim($_POST['name'] ?? '');
    $category = trim($_POST['category'] ?? '') ?: null;
    if($name === ''){
      http_response_code(422);
      return ['message' => 'Title name is required'];
    }
    $pdo = DB::conn();
    $stmt = $pdo->prepare("INSERT INTO staff_titles (name,category) VALUES(?,?)");
    try{
      $stmt->execute([$name,$category]);
    } catch(\PDOException $e){
      if(str_contains($e->getMessage(),'Duplicate')){
        http_response_code(422);
        return ['message'=>'Title already exists'];
      }
      throw $e;
    }
    return ['message'=>'Title created','id'=>(int)$pdo->lastInsertId()];
  }

  public function adminList(){
    $this->ensureStaffSchema();
    $this->requireAdmin();
    $pdo = DB::conn();
    $page = max(1,(int)($_GET['page'] ?? 1));
    $perPage = (int)($_GET['per_page'] ?? 8);
    if ($perPage < 1) $perPage = 1;
    if ($perPage > 50) $perPage = 50;
    $offset = ($page - 1) * $perPage;

    $total = (int)$pdo->query("SELECT COUNT(*) FROM staff")->fetchColumn();

    $stmt = $pdo->prepare("SELECT s.id,s.name,s.role_title,s.photo_path,s.bio,s.is_visible,s.sort_order,s.staff_title_id,s.email,s.user_id,st.name AS title_name,st.category FROM staff s LEFT JOIN staff_titles st ON st.id=s.staff_title_id ORDER BY s.sort_order,s.id LIMIT :limit OFFSET :offset");
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
    $this->ensureStaffSchema();
    $this->requireAdmin();

    $name = trim($_POST['name'] ?? '');
    $staffTitleId = (int)($_POST['staff_title_id'] ?? 0);
    $bio  = trim($_POST['bio'] ?? '');
    $sort = (int)($_POST['sort_order'] ?? 0);
    $isVisible = filter_var($_POST['is_visible'] ?? '1', FILTER_VALIDATE_BOOLEAN);

    if ($name === '' || $staffTitleId <= 0) {
      http_response_code(422);
      return ['message' => 'Name and staff title are required'];
    }

    $pdo = DB::conn();
    $stmt = $pdo->prepare("SELECT name,category FROM staff_titles WHERE id=? LIMIT 1");
    $stmt->execute([$staffTitleId]);
    $titleRow = $stmt->fetch(PDO::FETCH_ASSOC);
    if(!$titleRow){
      http_response_code(422);
      return ['message' => 'Invalid staff title'];
    }
    $role = $titleRow['name'];

    if (!isset($_FILES['photo']) || $_FILES['photo']['error'] !== UPLOAD_ERR_OK) {
      http_response_code(422);
      return ['message' => 'Profile photo is required'];
    }

    $photoPath = $this->storePhoto($_FILES['photo']);

    $email = trim($_POST['email'] ?? '');
    if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
      http_response_code(422);
      return ['message' => 'Valid email is required'];
    }
    $password = (string)($_POST['password'] ?? '');
    $passwordConfirm = (string)($_POST['password_confirmation'] ?? $_POST['password_confirm'] ?? '');
    if ($password === '' || $password !== $passwordConfirm) {
      http_response_code(422);
      return ['message' => 'Password confirmation does not match'];
    }

    $pdo->beginTransaction();
    try {
      $roleId = $this->determineRoleIdFromCategory($titleRow['category'] ?? null);
      $userStmt = $pdo->prepare("INSERT INTO users (role_id,full_name,email,password_hash) VALUES (?,?,?,?)");
      $userStmt->execute([$roleId, $name, $email, password_hash($password, PASSWORD_BCRYPT)]);
      $userId = (int)$pdo->lastInsertId();

      $stmt = $pdo->prepare("INSERT INTO staff (name,role_title,photo_path,bio,is_visible,sort_order,staff_title_id,email,user_id) VALUES (?,?,?,?,?,?,?,?,?)");
      $stmt->execute([$name, $role, $photoPath, $bio, $isVisible ? 1 : 0, $sort, $staffTitleId, $email, $userId]);
      if ($roleId === 2) {
        $this->ensureDoctorProfile($pdo, $userId, $role, $bio ?: null);
      }
      $staffId = (int)$pdo->lastInsertId();

      $pdo->commit();
    } catch(\PDOException $e){
      $pdo->rollBack();
      if(str_contains($e->getMessage(),'users_email') || str_contains($e->getMessage(),'Duplicate')){
        http_response_code(422);
        return ['message'=>'Email already exists'];
      }
      throw $e;
    }

    return [
      'message' => 'Staff profile created',
      'staff' => [
        'id' => $staffId,
        'name' => $name,
        'role_title' => $role,
        'bio' => $bio,
        'photo_path' => $this->assetUrl($photoPath),
        'is_visible' => $isVisible,
        'sort_order' => $sort,
        'email' => $email,
        'staff_title_id' => $staffTitleId,
      ],
    ];
  }

  public function update(){
    $this->ensureStaffSchema();
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
    $stmt = $pdo->prepare("SELECT s.*, st.category AS title_category, st.name AS title_name, u.email AS user_email, u.role_id AS user_role_id, d.id AS doctor_profile_id FROM staff s LEFT JOIN staff_titles st ON st.id=s.staff_title_id LEFT JOIN users u ON u.id=s.user_id LEFT JOIN doctors d ON d.user_id = s.user_id WHERE s.id = ? LIMIT 1");
    $stmt->execute([$id]);
    $current = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$current) {
      http_response_code(404);
      return ['message' => 'Staff profile not found'];
    }

    $staffFields = [];
    $staffParams = [];
    $newPhotoPath = null;

    $finalName = $current['name'];
    $finalRoleTitle = $current['role_title'];
    $finalBio = $current['bio'];
    if (array_key_exists('name', $payload)) {
      $incomingName = trim((string)$payload['name']);
      if ($incomingName === '') {
        http_response_code(422);
        return ['message' => 'Name cannot be empty'];
      }
      $staffFields[] = 'name = ?';
      $staffParams[] = $incomingName;
      $finalName = $incomingName;
    }

    $finalTitleCategory = $current['title_category'];
    $finalTitleId = $current['staff_title_id'] ? (int)$current['staff_title_id'] : null;
    $titleChanged = false;
    if (array_key_exists('staff_title_id', $payload)) {
      $titleId = (int)$payload['staff_title_id'];
      if ($titleId <= 0) {
        http_response_code(422);
        return ['message' => 'Staff title is required'];
      }
      if ($titleId !== $finalTitleId) {
        $titleStmt = $pdo->prepare("SELECT id,name,category FROM staff_titles WHERE id=? LIMIT 1");
        $titleStmt->execute([$titleId]);
        $title = $titleStmt->fetch(PDO::FETCH_ASSOC);
        if (!$title) {
          http_response_code(422);
          return ['message' => 'Invalid staff title'];
        }
        $staffFields[] = 'staff_title_id = ?';
        $staffParams[] = $title['id'];
        $staffFields[] = 'role_title = ?';
        $staffParams[] = $title['name'];
        $finalRoleTitle = $title['name'];
        $finalTitleId = (int)$title['id'];
        $finalTitleCategory = $title['category'];
        $titleChanged = true;
      }
    }

    if (array_key_exists('bio', $payload)) {
      $bioVal = trim((string)$payload['bio']);
      $staffFields[] = 'bio = ?';
      $staffParams[] = $bioVal;
      $finalBio = $bioVal;
    }
    if (array_key_exists('sort_order', $payload)) {
      $staffFields[] = 'sort_order = ?';
      $staffParams[] = (int)$payload['sort_order'];
    }
    if (array_key_exists('is_visible', $payload)) {
      $staffFields[] = 'is_visible = ?';
      $staffParams[] = (int)filter_var($payload['is_visible'], FILTER_VALIDATE_BOOLEAN);
    }

    $emailSupplied = array_key_exists('email', $payload);
    $finalEmail = $current['email'];
    if ($emailSupplied) {
      $incomingEmail = trim((string)$payload['email']);
      if ($incomingEmail === '' || !filter_var($incomingEmail, FILTER_VALIDATE_EMAIL)) {
        http_response_code(422);
        return ['message' => 'Valid email is required'];
      }
      $staffFields[] = 'email = ?';
      $staffParams[] = $incomingEmail;
      $finalEmail = $incomingEmail;
    }

    $password = (string)($payload['password'] ?? '');
    $confirm = (string)($payload['password_confirmation'] ?? $payload['password_confirm'] ?? '');
    if ($password !== '' && $password !== $confirm) {
      http_response_code(422);
      return ['message' => 'Passwords do not match'];
    }
    if ($password !== '' && !$finalEmail) {
      http_response_code(422);
      return ['message' => 'Email is required when setting a password'];
    }
    if (!$current['user_id'] && $emailSupplied && $password === '') {
      http_response_code(422);
      return ['message' => 'Password is required when assigning a login'];
    }

    if (isset($_FILES['photo']) && $_FILES['photo']['error'] === UPLOAD_ERR_OK) {
      $newPhotoPath = $this->storePhoto($_FILES['photo']);
      $staffFields[] = 'photo_path = ?';
      $staffParams[] = $newPhotoPath;
    }

    $targetRoleId = $this->determineRoleIdFromCategory($finalTitleCategory);
    $createUser = !$current['user_id'] && $finalEmail && $password !== '';

    $shouldHaveDoctor = ($targetRoleId === 2);
    $needsDoctorSync = false;
    if ($current['user_id']) {
      if ($shouldHaveDoctor) {
        $needsDoctorSync = !$current['doctor_profile_id'] || $finalRoleTitle !== $current['role_title'] || $finalBio !== $current['bio'];
      } else {
        $needsDoctorSync = (bool)$current['doctor_profile_id'];
      }
    }

    if (empty($staffFields) && !$emailSupplied && $password === '' && !$createUser && !$titleChanged && $targetRoleId === (int)$current['user_role_id'] && !$needsDoctorSync) {
      return ['message' => 'Nothing to update'];
    }

    $pdo->beginTransaction();
    try {
      if ($createUser) {
        $userStmt = $pdo->prepare("INSERT INTO users (role_id,full_name,email,password_hash) VALUES (?,?,?,?)");
        $userStmt->execute([$targetRoleId, $finalName ?: $current['name'], $finalEmail, password_hash($password, PASSWORD_BCRYPT)]);
        $newUserId = (int)$pdo->lastInsertId();
        $staffFields[] = 'user_id = ?';
        $staffParams[] = $newUserId;
        $current['user_id'] = $newUserId;
      } elseif ($current['user_id']) {
        $userFields = [];
        $userParams = [];
        if ($finalName !== $current['name']) {
          $userFields[] = 'full_name = ?';
          $userParams[] = $finalName;
        }
        if ($emailSupplied) {
          $userFields[] = 'email = ?';
          $userParams[] = $finalEmail;
        }
        if ($password !== '') {
          $userFields[] = 'password_hash = ?';
          $userParams[] = password_hash($password, PASSWORD_BCRYPT);
        }
        if ($targetRoleId !== (int)$current['user_role_id']) {
          $userFields[] = 'role_id = ?';
          $userParams[] = $targetRoleId;
        }
        if (!empty($userFields)) {
          $userParams[] = $current['user_id'];
          $pdo->prepare('UPDATE users SET ' . implode(',', $userFields) . ' WHERE id = ?')->execute($userParams);
        }
      }

      if (!empty($staffFields)) {
        $staffParams[] = $id;
        $pdo->prepare('UPDATE staff SET ' . implode(',', $staffFields) . ' WHERE id = ?')->execute($staffParams);
      }

      if ($current['user_id']) {
        if ($shouldHaveDoctor) {
          $this->ensureDoctorProfile($pdo, (int)$current['user_id'], $finalRoleTitle, $finalBio);
        } else {
          $this->deleteDoctorProfile($pdo, (int)$current['user_id']);
        }
      }

      $pdo->commit();
    } catch(\PDOException $e){
      $pdo->rollBack();
      if(str_contains($e->getMessage(),'users_email') || str_contains($e->getMessage(),'Duplicate')){
        http_response_code(422);
        return ['message'=>'Email already exists'];
      }
      throw $e;
    }

    if ($newPhotoPath && !empty($current['photo_path'])) {
      $this->deletePhoto($current['photo_path']);
    }

    return ['message' => 'Staff profile updated'];
  }

  public function delete(){
    $this->ensureStaffSchema();
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
    $stmt = $pdo->prepare("SELECT photo_path,user_id FROM staff WHERE id = ? LIMIT 1");
    $stmt->execute([$id]);
    $staff = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$staff) {
      http_response_code(404);
      return ['message' => 'Staff profile not found'];
    }

    $pdo->beginTransaction();
    try {
      $userId = !empty($staff['user_id']) ? (int)$staff['user_id'] : null;
      if ($userId) {
        $this->deleteDoctorProfile($pdo, $userId);
      }
      $pdo->prepare("DELETE FROM staff WHERE id = ?")->execute([$id]);
      if ($userId) {
        $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$userId]);
      }
      $pdo->commit();
    } catch(\PDOException $e){
      $pdo->rollBack();
      throw $e;
    }

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

  private function ensureDoctorProfile(PDO $pdo, int $userId, ?string $specialty, ?string $bio): void {
    $specialty = $specialty ?: 'Specialist';
    $bio = $bio ?: null;
    $stmt = $pdo->prepare("SELECT id FROM doctors WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $doctorId = $stmt->fetchColumn();
    if ($doctorId) {
      $upd = $pdo->prepare("UPDATE doctors SET specialty = ?, bio = ? WHERE id = ?");
      $upd->execute([$specialty, $bio, $doctorId]);
    } else {
      $ins = $pdo->prepare("INSERT INTO doctors (user_id, specialty, bio) VALUES (?,?,?)");
      $ins->execute([$userId, $specialty, $bio]);
    }
  }

  private function deleteDoctorProfile(PDO $pdo, int $userId): void {
    $pdo->prepare("DELETE FROM doctors WHERE user_id = ?")->execute([$userId]);
  }

  private function determineRoleIdFromCategory(?string $category): int {
    $category = strtolower((string)$category);
    return (str_contains($category, 'manage') || str_contains($category, 'leader'))
      ? 1
      : 2;
  }

  private static bool $schemaReady = false;

  private function ensureStaffSchema(): void {
    if (self::$schemaReady) {
      return;
    }
    $pdo = DB::conn();

    // Ensure staff_titles table exists
    $pdo->exec("
      CREATE TABLE IF NOT EXISTS staff_titles (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(160) NOT NULL UNIQUE,
        category VARCHAR(80) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    ");

    // Seed default titles
    $seedTitles = [
      ['Laboratory Director', 'Management'],
      ['Laboratory Manager / Administrator', 'Management'],
      ['Section Head / Supervisor / Team Leader', 'Management'],
      ['Medical Laboratory Scientist', 'Technical'],
      ['Medical Laboratory Technician', 'Technical'],
      ['Specialized Technologist', 'Technical'],
      ['Pathologist Assistant', 'Technical'],
      ['Phlebotomist / Phlebotomy Technician', 'Technical'],
      ['Laboratory Assistant / Support Services Clerk', 'Support'],
      ['Specimen Processor', 'Support'],
      ['Clerical Worker / Administrative Secretary', 'Support'],
      ['Quality Assurance / Compliance Director', 'Other'],
      ['Biochemist / Chemist', 'Other'],
    ];
    $seedStmt = $pdo->prepare("INSERT INTO staff_titles (name,category) VALUES (?,?) ON DUPLICATE KEY UPDATE category=VALUES(category)");
    foreach ($seedTitles as $row) {
      $seedStmt->execute($row);
    }

    // Inspect existing staff columns
    $columns = $pdo->query("SHOW COLUMNS FROM staff")->fetchAll(PDO::FETCH_COLUMN);
    $toAlter = [];
    $emailAdded = false;
    $userIdAdded = false;
    if (!in_array('staff_title_id', $columns, true)) {
      $toAlter[] = "ADD COLUMN staff_title_id INT NULL AFTER role_title";
    }
    if (!in_array('email', $columns, true)) {
      $toAlter[] = "ADD COLUMN email VARCHAR(160) NULL AFTER staff_title_id";
      $emailAdded = true;
    }
    if (!in_array('user_id', $columns, true)) {
      $toAlter[] = "ADD COLUMN user_id INT NULL AFTER email";
      $userIdAdded = true;
    }
    if ($toAlter) {
      $pdo->exec("ALTER TABLE staff " . implode(', ', $toAlter));
    }

    if ($emailAdded) {
      try {
        $pdo->exec("ALTER TABLE staff ADD UNIQUE KEY staff_email_unique (email)");
      } catch (\PDOException $e) {
        // ignore if already exists
      }
    }

    $dbName = $pdo->query("SELECT DATABASE()")->fetchColumn();
    $constraintExists = function(string $name) use ($pdo, $dbName): bool {
      $stmt = $pdo->prepare("SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS WHERE CONSTRAINT_SCHEMA = ? AND TABLE_NAME = 'staff' AND CONSTRAINT_NAME = ?");
      $stmt->execute([$dbName, $name]);
      return (bool)$stmt->fetchColumn();
    };

    if (!$constraintExists('fk_staff_title')) {
      try {
        $pdo->exec("ALTER TABLE staff ADD CONSTRAINT fk_staff_title FOREIGN KEY (staff_title_id) REFERENCES staff_titles(id)");
      } catch (\PDOException $e) {
        // ignore if constraint already exists or table lacks column for some reason
      }
    }
    if (!$constraintExists('fk_staff_user')) {
      try {
        $pdo->exec("ALTER TABLE staff ADD CONSTRAINT fk_staff_user FOREIGN KEY (user_id) REFERENCES users(id)");
      } catch (\PDOException $e) {
        // ignore if already exists
      }
    }

    $missingDoctors = $pdo->query("
      SELECT s.user_id, s.role_title, s.bio
      FROM staff s
      JOIN users u ON u.id = s.user_id
      LEFT JOIN staff_titles stt ON stt.id = s.staff_title_id
      LEFT JOIN doctors d ON d.user_id = u.id
      WHERE u.role_id = 2
        AND d.id IS NULL
        AND (stt.id IS NULL OR (LOWER(stt.category) NOT LIKE '%manage%' AND LOWER(stt.category) NOT LIKE '%leader%'))
    ")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($missingDoctors as $row) {
      $this->ensureDoctorProfile($pdo, (int)$row['user_id'], $row['role_title'], $row['bio']);
    }

    self::$schemaReady = true;
  }
}
