<?php
namespace Controllers;

use Core\DB;
use Helpers\Validator;
use PDO;

class AuthController
{
    public function register()
    {
        $data = json_decode(file_get_contents('php://input'), true) ?? [];

        if (!Validator::name($data['full_name'] ?? '')) {
            http_response_code(422);
            return ['message' => 'Invalid name'];
        }
        if (!Validator::email($data['email'] ?? '')) {
            http_response_code(422);
            return ['message' => 'Invalid email'];
        }
        if (!Validator::strongPassword($data['password'] ?? '')) {
            http_response_code(422);
            return ['message' => 'Weak password'];
        }

        $pdo = DB::conn();
        $stmt = $pdo->prepare("INSERT INTO users(role_id,full_name,email,password_hash) VALUES(3,?,?,?)");

        try {
            $stmt->execute([
                $data['full_name'],
                $data['email'],
                password_hash($data['password'], PASSWORD_DEFAULT),
            ]);
            return ['message' => 'Registered'];
        } catch (\PDOException $e) {
            http_response_code(400);
            return ['message' => 'Email already exists'];
        }
    }

    public function login()
    {
        $credentials = json_decode(file_get_contents('php://input'), true) ?? [];

        $pdo = DB::conn();
        $stmt = $pdo->prepare("SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE email=? LIMIT 1");
        $stmt->execute([$credentials['email'] ?? '']);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user || !password_verify($credentials['password'] ?? '', $user['password_hash'])) {
            http_response_code(401);
            return ['message' => 'Invalid credentials'];
        }

        session_regenerate_id(true);
        $_SESSION['uid'] = (int)$user['id'];
        $_SESSION['role_id'] = (int)$user['role_id'];

        return [
            'message' => 'ok',
            'user'    => $this->publicUser($user),
        ];
    }

    public function me()
    {
        if (!isset($_SESSION['uid'])) {
            http_response_code(401);
            return ['message' => 'Not authenticated'];
        }

        $pdo = DB::conn();
        $stmt = $pdo->prepare("SELECT u.*, r.name AS role_name FROM users u JOIN roles r ON r.id = u.role_id WHERE u.id=? LIMIT 1");
        $stmt->execute([$_SESSION['uid']]);
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$user) {
            http_response_code(401);
            return ['message' => 'Not authenticated'];
        }

        return [
            'user' => $this->publicUser($user),
        ];
    }

    public function logout()
    {
        $_SESSION = [];
        if (ini_get('session.use_cookies')) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
        }
        session_destroy();

        return ['message' => 'bye'];
    }

    private function publicUser(array $row): array
    {
        return [
            'id'        =>(int)$row['id'],
            'full_name' => $row['full_name'],
            'email'     => $row['email'],
            'role_id'   => (int)$row['role_id'],
            'role'      => $row['role_name'],
            'status'    => $row['status'],
        ];
    }
}
