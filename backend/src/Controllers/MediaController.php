<?php
namespace Controllers;
use Core\DB;
class MediaController {
  public function hero(){
    $pdo = DB::conn();
    return $pdo->query("SELECT id,type,path,caption FROM media WHERE is_hero=1 ORDER BY created_at DESC LIMIT 6")->fetchAll();
  }
}
