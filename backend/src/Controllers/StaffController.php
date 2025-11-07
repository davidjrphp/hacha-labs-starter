<?php
namespace Controllers;
use Core\DB;
class StaffController {
  public function list(){
    $pdo = DB::conn();
    return $pdo->query("SELECT id,name,role_title,photo_path,bio FROM staff WHERE is_visible=1 ORDER BY sort_order,id")->fetchAll();
  }
}
