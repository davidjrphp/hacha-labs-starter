<?php
namespace Controllers;
use Core\DB;
class NewsController {
  public function latest(){
    $pdo = DB::conn();
    return $pdo->query("SELECT id,title,cover_path,LEFT(body,220) AS excerpt,created_at FROM news WHERE is_published=1 ORDER BY created_at DESC LIMIT 6")->fetchAll();
  }
}
