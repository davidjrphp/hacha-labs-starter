<?php
namespace Controllers;
use Core\DB;
use DateTime;
use DateTimeImmutable;
use DateTimeZone;
use PDO;

class AppointmentController {
  public function availability(){
    $sql="SELECT d.id AS doctor_id, u.full_name, d.specialty, s.weekday, s.start_time, s.end_time, s.available
          FROM doctors d JOIN users u ON u.id=d.user_id JOIN schedules s ON s.doctor_id=d.id WHERE s.available=1
          ORDER BY d.id, s.weekday, s.start_time";
    return DB::conn()->query($sql)->fetchAll(PDO::FETCH_ASSOC);
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
}
