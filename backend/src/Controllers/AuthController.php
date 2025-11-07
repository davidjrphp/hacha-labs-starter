<?php
namespace Controllers;
use Core\DB;
use Helpers\Validator;
class AuthController {
  public function register(){
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    if(!Validator::name($data['full_name'] ?? '')) return ['message'=>'Invalid name'];
    if(!Validator::email($data['email'] ?? '')) return ['message'=>'Invalid email'];
    if(!Validator::strongPassword($data['password'] ?? '')) return ['message'=>'Weak password'];
    $pdo = DB::conn();
    $stmt=$pdo->prepare("INSERT INTO users(role_id,full_name,email,password_hash) VALUES(3,?,?,?)");
    try {
      $stmt->execute([$data['full_name'],$data['email'],password_hash($data['password'], PASSWORD_DEFAULT)]);
      return ['message'=>'Registered'];
    } catch(\PDOException $e){ http_response_code(400); return ['message'=>'Email already exists']; }
  }
  public function login(){
    $data = json_decode(file_get_contents('php://input'), true) ?? [];
    $pdo = DB::conn();
    $stmt=$pdo->prepare("SELECT * FROM users WHERE email=? LIMIT 1");
    $stmt->execute([$data['email'] ?? '']);
    $u = $stmt->fetch();
    if(!$u || !password_verify($data['password'] ?? '', $u['password_hash'])){
      http_response_code(401); return ['message'=>'Invalid credentials'];
    }
    $_SESSION['uid'] = $u['id']; $_SESSION['role_id']=$u['role_id'];
    return ['message'=>'ok'];
  }
  public function logout(){ session_destroy(); return ['message'=>'bye']; }
}
