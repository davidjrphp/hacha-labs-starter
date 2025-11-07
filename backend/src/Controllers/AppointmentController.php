<?php
namespace Controllers;
use Core\DB;
class AppointmentController {
  public function availability(){
    $pdo = DB::conn();
    $sql="SELECT d.id AS doctor_id, u.full_name, d.specialty, s.weekday, s.start_time, s.end_time, s.available
          FROM doctors d JOIN users u ON u.id=d.user_id JOIN schedules s ON s.doctor_id=d.id WHERE s.available=1
          ORDER BY d.id, s.weekday, s.start_time";
    return DB::conn()->query($sql)->fetchAll();
  }
  public function create(){
    if(!isset($_SESSION['uid'])){ http_response_code(401); return ['message'=>'auth'];}
    $data = $_POST + [];
    $pdo = DB::conn();
    $stmt = $pdo->prepare("INSERT INTO appointments(patient_id,doctor_id,requested_at,slot_start,slot_end,type,referral_note,referral_file)
                           VALUES(?, ?, NOW(), ?, ?, ?, ?, ?)");
    $filePath = null;
    if(isset($_FILES['attachment']) && $_FILES['attachment']['error']===UPLOAD_ERR_OK){
      $ext = strtolower(pathinfo($_FILES['attachment']['name'], PATHINFO_EXTENSION));
      if(!in_array($ext,['pdf','png','jpg','jpeg'])){ http_response_code(400); return ['message'=>'Invalid file']; }
      $dir = '/var/www/storage/uploads/attachments/';
      if(!is_dir($dir)) mkdir($dir,0777,true);
      $filePath = $dir . uniqid('ref_') . '.' . $ext;
      move_uploaded_file($_FILES['attachment']['tmp_name'],$filePath);
      $filePath = str_replace('/var/www/public','',$filePath);
    }
    $stmt->execute([$_SESSION['uid'],$data['doctor_id'],$data['slot_start'],$data['slot_end'],$data['type'] ?? 'new',$data['referral_note'] ?? null,$filePath]);
    return ['message'=>'requested'];
  }
  public function mine(){
    if(!isset($_SESSION['uid'])){ http_response_code(401); return ['message'=>'auth'];}
    $stmt = DB::conn()->prepare("SELECT * FROM appointments WHERE patient_id=? ORDER BY created_at DESC");
    $stmt->execute([$_SESSION['uid']]);
    return $stmt->fetchAll();
  }
}
