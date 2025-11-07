<?php
namespace Core;
use PDO;
class DB {
  private static ?PDO $pdo = null;
  public static function conn(): PDO {
    if (!self::$pdo) {
      $dsn = "mysql:host=mysql;dbname=" . getenv('MYSQL_DATABASE') . ";charset=utf8mb4";
      self::$pdo = new PDO($dsn, getenv('MYSQL_USER'), getenv('MYSQL_PASSWORD'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
      ]);
    }
    return self::$pdo;
  }
}
