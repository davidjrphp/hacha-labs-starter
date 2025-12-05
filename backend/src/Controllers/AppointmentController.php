<?php
namespace Controllers;
use Core\DB;
use DateTime;
use DateTimeImmutable;
use DateTimeZone;
use PDO;

class AppointmentController {
  public function availability(){
    $pdo = DB::conn();
    $slotStart = $_GET['slot_start'] ?? null;
    if ($slotStart) {
      return $this->availabilitySnapshot($pdo, $slotStart);
    }
    $sql="SELECT d.id AS doctor_id, u.full_name, d.specialty
          FROM doctors d
          JOIN users u ON u.id=d.user_id
          LEFT JOIN staff st ON st.user_id=u.id
          LEFT JOIN staff_titles stt ON stt.id=st.staff_title_id
          WHERE u.role_id=2
            AND u.status='active'
            AND (stt.id IS NULL OR LOWER(stt.category) <> 'management')
          ORDER BY u.full_name";
    return $pdo->query($sql)->fetchAll(PDO::FETCH_ASSOC);
  }

  public function create(){
    $userId = $_SESSION['uid'] ?? null;
    if(!$userId){ http_response_code(401); return ['message'=>'auth'];}
    $doctorId = (int)($_POST['doctor_id'] ?? 0);
    $slotStart = trim($_POST['slot_start'] ?? '');
    $slotEnd   = trim($_POST['slot_end'] ?? '');
    if($doctorId <= 0 || $slotStart === ''){
      http_response_code(422);
      return ['message'=>'Doctor and slot are required'];
    }

    $type = $_POST['type'] ?? 'new';
    if(!in_array($type, ['new','returning','referral'], true)){
      $type = 'new';
    }
    $serviceCode = trim($_POST['service_code'] ?? '');
    $patientAge = $_POST['patient_age'] !== '' ? (int)$_POST['patient_age'] : null;
    $patientPhone = trim($_POST['patient_phone'] ?? '');
    $patientSex = $_POST['patient_sex'] ?? 'other';
    if(!in_array($patientSex, ['male','female','other'], true)){
      $patientSex = 'other';
    }
    $patientCity = trim($_POST['patient_city'] ?? '');
    $patientAddress = trim($_POST['patient_address'] ?? '');
    $facilityId = (int)($_POST['referring_facility_id'] ?? 0);
    $providerId = (int)($_POST['referring_provider_id'] ?? 0);
    if($type === 'referral' && ($facilityId <= 0 || $providerId <= 0)){
      http_response_code(422);
      return ['message'=>'Referral facility and provider are required'];
    }

    $slotStartDt = new DateTime($slotStart);
    if($slotEnd === ''){
      $slotEndDt = (clone $slotStartDt)->modify('+1 hour');
      $slotEnd = $slotEndDt->format('Y-m-d H:i:s');
    }
    $referralNote = trim($_POST['referral_note'] ?? '');

    $filePath = null;
    if(isset($_FILES['attachment']) && $_FILES['attachment']['error'] === UPLOAD_ERR_OK){
      $ext = strtolower(pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION));
      if(!in_array($ext,['pdf','png','jpg','jpeg','doc','docx'])){
        http_response_code(400);
        return ['message'=>'Unsupported attachment type'];
      }
      $directory = __DIR__ . '/../../public/uploads/referrals';
      if(!is_dir($directory) && !mkdir($directory,0755,true) && !is_dir($directory)){
        http_response_code(500);
        return ['message'=>'Unable to create attachment directory'];
      }
      $filename = uniqid('ref_', true) . '.' . $ext;
      $destination = $directory . '/' . $filename;
      if(!move_uploaded_file($_FILES['attachment']['tmp_name'], $destination)){
        http_response_code(500);
        return ['message'=>'Failed to store attachment'];
      }
      $filePath = '/uploads/referrals/' . $filename;
    }

    $pdo = DB::conn();
    $stmt = $pdo->prepare("INSERT INTO appointments
      (patient_id,doctor_id,requested_at,slot_start,slot_end,type,service_code,referral_note,referral_file,
       patient_age,patient_phone,patient_sex,patient_city,patient_address,referring_facility_id,referring_provider_id)
      VALUES(?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([
      $userId,
      $doctorId,
      $slotStart,
      $slotEnd,
      $type,
      $serviceCode ?: null,
      $referralNote ?: null,
      $filePath,
      $patientAge,
      $patientPhone ?: null,
      $patientSex,
      $patientCity ?: null,
      $patientAddress ?: null,
      $facilityId ?: null,
      $providerId ?: null
    ]);
    return ['message'=>'requested'];
  }

  public function mine(){
    $userId = $_SESSION['uid'] ?? null;
    if(!$userId){ http_response_code(401); return ['message'=>'auth'];}
    $sql = "SELECT a.id,a.type,a.status,a.service_code,a.slot_start,a.slot_end,a.created_at,
                   u.full_name AS doctor_name,u.email AS doctor_email,
                   hf.name AS facility_name, fp.provider_name AS provider_name
            FROM appointments a
            LEFT JOIN doctors d ON d.id=a.doctor_id
            LEFT JOIN users u ON u.id=d.user_id
            LEFT JOIN healthcare_facilities hf ON hf.id=a.referring_facility_id
            LEFT JOIN facility_providers fp ON fp.id=a.referring_provider_id
            WHERE a.patient_id=?
            ORDER BY a.created_at DESC";
    $stmt = DB::conn()->prepare($sql);
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  public function summary(){
    $userId = $_SESSION['uid'] ?? null;
    if(!$userId){ http_response_code(401); return ['message'=>'auth'];}
    $pdo = DB::conn();
    $upcomingStmt = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE patient_id=? AND slot_start >= NOW() AND status IN ('pending','approved')");
    $upcomingStmt->execute([$userId]);
    $pendingStmt = $pdo->prepare("SELECT COUNT(*) FROM appointments WHERE patient_id=? AND status='pending'");
    $pendingStmt->execute([$userId]);
    $messagesStmt = $pdo->prepare("SELECT COUNT(*) FROM messages WHERE receiver_id=? AND is_read=0");
    $messagesStmt->execute([$userId]);

    return [
      'upcoming_visits' => (int)$upcomingStmt->fetchColumn(),
      'pending_approvals' => (int)$pendingStmt->fetchColumn(),
      'unread_messages' => (int)$messagesStmt->fetchColumn(),
    ];
  }

  public function checkAvailability(){
    $doctorId = (int)($_GET['doctor_id'] ?? 0);
    $slotStartRaw = $_GET['slot_start'] ?? '';
    if($doctorId <= 0 || $slotStartRaw === ''){
      http_response_code(422);
      return ['message' => 'Doctor and slot are required'];
    }
    try {
      $slot = new DateTimeImmutable($slotStartRaw);
    } catch(\Exception $e){
      http_response_code(422);
      return ['message' => 'Invalid desired date/time'];
    }
    $slotEnd = $slot->modify('+1 hour');
    $slotStartFormatted = $slot->format('Y-m-d H:i:s');
    $slotEndFormatted = $slotEnd->format('Y-m-d H:i:s');

    $pdo = DB::conn();
    $doctorStmt = $pdo->prepare("
      SELECT d.id, u.full_name, d.specialty
      FROM doctors d
      JOIN users u ON u.id=d.user_id
      LEFT JOIN staff st ON st.user_id=u.id
      LEFT JOIN staff_titles stt ON stt.id=st.staff_title_id
      WHERE d.id=?
        AND u.role_id=2
        AND u.status='active'
        AND (stt.id IS NULL OR LOWER(stt.category) <> 'management')
      LIMIT 1
    ");
    $doctorStmt->execute([$doctorId]);
    $doctor = $doctorStmt->fetch(PDO::FETCH_ASSOC);
    if(!$doctor){
      http_response_code(404);
      return ['message' => 'Specialist not found'];
    }

    $conflictStmt = $pdo->prepare("
      SELECT slot_start, slot_end
      FROM appointments
      WHERE doctor_id = ?
        AND status IN ('pending','approved')
        AND slot_start < ?
        AND slot_end > ?
      ORDER BY slot_end ASC
      LIMIT 1
    ");
    $conflictStmt->execute([$doctorId, $slotEndFormatted, $slotStartFormatted]);
    $conflict = $conflictStmt->fetch(PDO::FETCH_ASSOC);

    if ($conflict) {
      return [
        'doctor_id' => $doctorId,
        'available' => false,
        'message' => 'Specialist already booked for that time.',
        'next_available' => $conflict['slot_end'],
      ];
    }

    return [
      'doctor_id' => $doctorId,
      'available' => true,
      'message' => 'Specialist available for the requested time.',
      'next_available' => null,
    ];
  }

  public function adminLatest(){
    $this->requireAdmin();
    $pdo = DB::conn();
    $limit = (int)($_GET['limit'] ?? 6);
    if ($limit < 1) $limit = 1;
    if ($limit > 25) $limit = 25;

    $stmt = $pdo->prepare("
      SELECT a.id,
             a.type,
             a.status,
             a.slot_start,
             a.slot_end,
             a.service_code,
             p.full_name AS patient_name,
             duser.full_name AS doctor_name
      FROM appointments a
      JOIN users p ON p.id = a.patient_id
      LEFT JOIN doctors d ON d.id = a.doctor_id
      LEFT JOIN users duser ON duser.id = d.user_id
      ORDER BY a.slot_start DESC
      LIMIT :limit
    ");
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
  }

  public function doctorSchedule(){
    $userId = $this->requireDoctor();
    $pdo = DB::conn();
    $doctorId = $this->resolveDoctorId($pdo, $userId);
    if (!$doctorId) {
      return [
        'appointments' => [],
        'stats' => [
          'today_confirmed' => 0,
          'pending_referrals' => 0,
          'unread_messages' => 0,
        ],
      ];
    }

    $limit = (int)($_GET['limit'] ?? 10);
    if ($limit < 1) $limit = 1;
    if ($limit > 50) $limit = 50;

    $apptStmt = $pdo->prepare("
      SELECT a.id,
             a.type,
             a.status,
             a.slot_start,
             a.slot_end,
             a.service_code,
             p.full_name AS patient_name,
             p.email AS patient_email,
             hf.name AS facility_name
      FROM appointments a
      JOIN users p ON p.id = a.patient_id
      LEFT JOIN healthcare_facilities hf ON hf.id = a.referring_facility_id
      WHERE a.doctor_id = :doctor_id
        AND a.slot_start >= DATE_SUB(NOW(), INTERVAL 1 DAY)
      ORDER BY a.slot_start ASC
      LIMIT :limit
    ");
    $apptStmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $apptStmt->bindValue(':doctor_id', $doctorId, PDO::PARAM_INT);
    $apptStmt->execute();
    $appointments = $apptStmt->fetchAll(PDO::FETCH_ASSOC);

    $todayConfirmedStmt = $pdo->prepare("
      SELECT COUNT(*) FROM appointments
      WHERE doctor_id = ? AND status='approved' AND DATE(slot_start) = CURDATE()
    ");
    $todayConfirmedStmt->execute([$doctorId]);
    $pendingReferralStmt = $pdo->prepare("
      SELECT COUNT(*) FROM appointments
      WHERE doctor_id = ? AND type='referral' AND status='pending'
    ");
    $pendingReferralStmt->execute([$doctorId]);
    $unreadMessagesStmt = $pdo->prepare("SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = 0");
    $unreadMessagesStmt->execute([$userId]);

    return [
      'appointments' => $appointments,
      'stats' => [
        'today_confirmed' => (int)$todayConfirmedStmt->fetchColumn(),
        'pending_referrals' => (int)$pendingReferralStmt->fetchColumn(),
        'unread_messages' => (int)$unreadMessagesStmt->fetchColumn(),
      ],
    ];
  }

  public function doctorAppointmentsList(){
    $userId = $this->requireDoctor();
    $pdo = DB::conn();
    $doctorId = $this->resolveDoctorId($pdo, $userId);
    if (!$doctorId) {
      return [];
    }
    $limit = (int)($_GET['limit'] ?? 50);
    if ($limit < 1) $limit = 1;
    if ($limit > 100) $limit = 100;

    $stmt = $pdo->prepare("
      SELECT a.*, p.full_name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
             hf.name AS facility_name, fp.provider_name, fp.title AS provider_title
      FROM appointments a
      JOIN users p ON p.id = a.patient_id
      LEFT JOIN healthcare_facilities hf ON hf.id = a.referring_facility_id
      LEFT JOIN facility_providers fp ON fp.id = a.referring_provider_id
      WHERE a.doctor_id = :doctor_id
      ORDER BY a.slot_start DESC
      LIMIT :limit
    ");
    $stmt->bindValue(':doctor_id', $doctorId, PDO::PARAM_INT);
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $now = new \DateTimeImmutable('now');
    foreach ($rows as &$row) {
      $slotEnd = $row['slot_end'] ?? $row['slot_start'];
      $endTime = $slotEnd ? new \DateTimeImmutable($slotEnd) : $now;
      $row['is_overdue'] = ($endTime < $now) && !in_array($row['status'], ['completed'], true);
    }
    return $rows;
  }

  public function doctorRespond(){
    $userId = $this->requireDoctor();
    $pdo = DB::conn();
    $doctorId = $this->resolveDoctorId($pdo, $userId, false);
    if (!$doctorId) {
      http_response_code(422);
      return ['message' => 'Specialist profile missing'];
    }
    $appointmentId = (int)($_POST['appointment_id'] ?? 0);
    $action = strtolower(trim($_POST['action'] ?? ''));
    $note = trim($_POST['note'] ?? '');
    if ($appointmentId <= 0 || !in_array($action, ['approve', 'decline', 'close'], true)) {
      http_response_code(422);
      return ['message' => 'Invalid request'];
    }
    $newStatus = match($action){
      'approve' => 'approved',
      'decline' => 'declined',
      'close'   => 'completed',
      default   => 'pending'
    };
    $apptStmt = $pdo->prepare("SELECT id FROM appointments WHERE id = ? AND doctor_id = ? LIMIT 1");
    $apptStmt->execute([$appointmentId, $doctorId]);
    if (!$apptStmt->fetchColumn()) {
      http_response_code(404);
      return ['message' => 'Appointment not found'];
    }
    $update = $pdo->prepare("UPDATE appointments SET status = ?, status_reason = ? WHERE id = ? LIMIT 1");
    $update->execute([$newStatus, $note ?: null, $appointmentId]);
    return ['message' => 'Appointment updated', 'status' => $newStatus];
  }

  public function doctorAppointmentShow(){
    $userId = $this->requireDoctor();
    $pdo = DB::conn();
    $doctorId = $this->resolveDoctorId($pdo, $userId, false);
    if (!$doctorId) {
      http_response_code(404);
      return ['message' => 'Specialist profile not found'];
    }
    $appointmentId = (int)($_GET['id'] ?? 0);
    if ($appointmentId <= 0) {
      http_response_code(422);
      return ['message' => 'Invalid appointment id'];
    }
    $stmt = $pdo->prepare("
      SELECT a.*, p.full_name AS patient_name, p.email AS patient_email, p.phone AS patient_phone,
             hf.name AS facility_name, fp.provider_name, fp.title AS provider_title
      FROM appointments a
      JOIN users p ON p.id = a.patient_id
      LEFT JOIN healthcare_facilities hf ON hf.id = a.referring_facility_id
      LEFT JOIN facility_providers fp ON fp.id = a.referring_provider_id
      WHERE a.id = :id AND a.doctor_id = :doctor_id
      LIMIT 1
    ");
    $stmt->bindValue(':id', $appointmentId, PDO::PARAM_INT);
    $stmt->bindValue(':doctor_id', $doctorId, PDO::PARAM_INT);
    $stmt->execute();
    $row = $stmt->fetch(PDO::FETCH_ASSOC);
    if (!$row) {
      http_response_code(404);
      return ['message' => 'Appointment not found'];
    }
    $now = new \DateTimeImmutable('now');
    $slotEnd = $row['slot_end'] ?? $row['slot_start'];
    $endTime = $slotEnd ? new \DateTimeImmutable($slotEnd) : $now;
    $row['is_overdue'] = ($endTime < $now) && !in_array($row['status'], ['completed'], true);
    return $row;
  }

  public function doctorNotifications(){
    $userId = $this->requireDoctor();
    $pdo = DB::conn();
    $doctorId = $this->resolveDoctorId($pdo, $userId, false);
    if (!$doctorId) {
      return ['total' => 0, 'items' => []];
    }

    $items = [];
    $pendingAppts = $pdo->prepare("
      SELECT a.id AS appointment_id, a.slot_start, a.slot_end, a.status, a.type, a.service_code, p.full_name AS patient_name
      FROM appointments a
      JOIN users p ON p.id = a.patient_id
      WHERE a.doctor_id = ? AND a.status IN ('pending','approved')
      ORDER BY a.slot_start ASC
      LIMIT 20
    ");
    $pendingAppts->execute([$doctorId]);
    foreach ($pendingAppts->fetchAll(PDO::FETCH_ASSOC) as $row) {
      $items[] = [
        'type' => 'appointment',
        'id' => (int)$row['appointment_id'],
        'status' => $row['status'],
        'slot_start' => $row['slot_start'],
        'slot_end' => $row['slot_end'],
        'service_code' => $row['service_code'],
        'label' => ucfirst($row['type']) . ' visit for ' . ($row['patient_name'] ?? 'patient'),
        'patient_name' => $row['patient_name'] ?? null,
        'visit_type' => $row['type'],
      ];
    }

    $msgStmt = $pdo->prepare("SELECT id, sender_id, body, created_at FROM messages WHERE receiver_id = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 20");
    $msgStmt->execute([$userId]);
    foreach ($msgStmt->fetchAll(PDO::FETCH_ASSOC) as $msg) {
      $items[] = [
        'type' => 'message',
        'id' => (int)$msg['id'],
        'status' => 'unread',
        'label' => 'New message',
        'created_at' => $msg['created_at'],
        'preview' => mb_substr($msg['body'], 0, 120),
      ];
    }

    return [
      'total' => count($items),
      'items' => $items,
    ];
  }

  private function availabilitySnapshot(PDO $pdo, string $slotStartRaw){
    try {
      $slot = new DateTimeImmutable($slotStartRaw);
    } catch (\Exception $e) {
      http_response_code(422);
      return ['message' => 'Invalid desired date/time'];
    }

    $slotEnd = $slot->modify('+1 hour');
    $slotStartFormatted = $slot->format('Y-m-d H:i:s');
    $slotEndFormatted = $slotEnd->format('Y-m-d H:i:s');
    $weekday = (int)$slot->format('w');
    $timeStr = $slot->format('H:i:s');

    $doctorRows = $pdo->query(
      "SELECT d.id AS doctor_id, u.full_name, d.specialty
       FROM doctors d
       JOIN users u ON u.id=d.user_id
       LEFT JOIN staff st ON st.user_id=u.id
       LEFT JOIN staff_titles stt ON stt.id=st.staff_title_id
       WHERE u.role_id=2
         AND u.status='active'
         AND (stt.id IS NULL OR LOWER(stt.category) <> 'management')
       ORDER BY u.full_name"
    )->fetchAll(PDO::FETCH_ASSOC);

    if (!$doctorRows) {
      return [
        'slot_start' => $slotStartFormatted,
        'slot_end' => $slotEndFormatted,
        'weekday' => $weekday,
        'doctors' => [],
      ];
    }

    $doctorIds = array_map(fn($row) => (int)$row['doctor_id'], $doctorRows);
    $placeholders = implode(',', array_fill(0, count($doctorIds), '?'));

    $scheduleMatches = [];
    if ($doctorIds) {
      $scheduleSql = sprintf(
        "SELECT doctor_id FROM schedules
         WHERE available=1
           AND doctor_id IN (%s)
           AND weekday=?
           AND start_time <= ?
           AND end_time > ?",
        $placeholders
      );
      $scheduleStmt = $pdo->prepare($scheduleSql);
      $scheduleStmt->execute(array_merge($doctorIds, [$weekday, $timeStr, $timeStr]));
      foreach ($scheduleStmt->fetchAll(PDO::FETCH_COLUMN, 0) as $docId) {
        $scheduleMatches[(int)$docId] = true;
      }
    }

    $busyMap = [];
    if ($doctorIds) {
      $busySql = sprintf(
        "SELECT doctor_id, slot_start, slot_end
         FROM appointments
         WHERE doctor_id IN (%s)
           AND status IN ('pending','approved')
           AND slot_start < ?
           AND slot_end > ?",
        $placeholders
      );
      $busyStmt = $pdo->prepare($busySql);
      $busyStmt->execute(array_merge($doctorIds, [$slotEndFormatted, $slotStartFormatted]));
      foreach ($busyStmt->fetchAll(PDO::FETCH_ASSOC) as $row) {
        $docId = (int)$row['doctor_id'];
        if (!isset($busyMap[$docId]) || $row['slot_end'] < $busyMap[$docId]['slot_end']) {
          $busyMap[$docId] = $row;
        }
      }
    }

    $response = [];
    foreach ($doctorRows as $doc) {
      $docId = (int)$doc['doctor_id'];
      $hasSchedule = isset($scheduleMatches[$docId]);
      $conflict = $busyMap[$docId] ?? null;

      if (!$hasSchedule) {
        $status = 'unscheduled';
        $message = 'Not rostered for the chosen time.';
        $nextAvailable = null;
      } elseif ($conflict) {
        $status = 'busy';
        $message = 'Already booked for another appointment.';
        $nextAvailable = $conflict['slot_end'];
      } else {
        $status = 'available';
        $message = 'Available for the chosen time.';
        $nextAvailable = null;
      }

      $response[] = [
        'doctor_id' => $docId,
        'full_name' => $doc['full_name'],
        'specialty' => $doc['specialty'],
        'status' => $status,
        'message' => $message,
        'next_available' => $nextAvailable,
      ];
    }

    return [
      'slot_start' => $slotStartFormatted,
      'slot_end' => $slotEndFormatted,
      'weekday' => $weekday,
      'doctors' => $response,
    ];
  }

  private function requireAdmin(): void {
    if ((int)($_SESSION['role_id'] ?? 0) !== 1) {
      http_response_code(403);
      echo json_encode(['message' => 'Forbidden']);
      exit;
    }
  }

  private function requireDoctor(): int {
    $roleId = (int)($_SESSION['role_id'] ?? 0);
    $userId = (int)($_SESSION['uid'] ?? 0);
    if ($roleId !== 2 || $userId <= 0) {
      http_response_code(403);
      echo json_encode(['message' => 'Forbidden']);
      exit;
    }
    return $userId;
  }

  private function resolveDoctorId(PDO $pdo, int $userId, bool $createIfMissing = true): ?int {
    $stmt = $pdo->prepare("SELECT id FROM doctors WHERE user_id = ? LIMIT 1");
    $stmt->execute([$userId]);
    $doctorId = $stmt->fetchColumn();
    if ($doctorId) {
      return (int)$doctorId;
    }
    if (!$createIfMissing) {
      return null;
    }
    $staffStmt = $pdo->prepare("SELECT role_title, bio FROM staff WHERE user_id = ? LIMIT 1");
    $staffStmt->execute([$userId]);
    $staffRow = $staffStmt->fetch(PDO::FETCH_ASSOC);
    if ($staffRow) {
      $insert = $pdo->prepare("INSERT INTO doctors (user_id, specialty, bio) VALUES (?,?,?)");
      $insert->execute([$userId, $staffRow['role_title'] ?: 'Specialist', $staffRow['bio'] ?: null]);
      return (int)$pdo->lastInsertId();
    }
    return null;
  }
}
