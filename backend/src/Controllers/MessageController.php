<?php
namespace Controllers;

use Core\DB;
use PDO;

class MessageController {
  private function requireAuth(): int {
    $uid = (int)($_SESSION['uid'] ?? 0);
    if ($uid <= 0) {
      http_response_code(401);
      echo json_encode(['message' => 'auth']);
      exit;
    }
    return $uid;
  }

  public function contacts() {
    $uid = $this->requireAuth();
    $pdo = DB::conn();

    $stmt = $pdo->prepare("
      SELECT m.*, u.full_name, u.role_id
      FROM messages m
      JOIN users u ON u.id = CASE WHEN m.sender_id = :uid THEN m.receiver_id ELSE m.sender_id END
      WHERE m.sender_id = :uid OR m.receiver_id = :uid
      ORDER BY m.created_at DESC
      LIMIT 200
    ");
    $stmt->bindValue(':uid', $uid, PDO::PARAM_INT);
    $stmt->execute();
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $contacts = [];
    foreach ($rows as $row) {
      $otherId = ($row['sender_id'] == $uid) ? (int)$row['receiver_id'] : (int)$row['sender_id'];
      if (!isset($contacts[$otherId])) {
        $contacts[$otherId] = [
          'user_id' => $otherId,
          'name' => $row['full_name'] ?? 'Unknown',
          'role_id' => (int)$row['role_id'],
          'last_message' => $row['body'],
          'last_at' => $row['created_at'],
          'unread' => 0,
        ];
      }
      if ((int)$row['receiver_id'] === $uid && (int)$row['is_read'] === 0) {
        $contacts[$otherId]['unread']++;
      }
    }

    return array_values($contacts);
  }

  public function thread() {
    $uid = $this->requireAuth();
    $peerId = (int)($_GET['user_id'] ?? 0);
    if ($peerId <= 0) {
      http_response_code(422);
      return ['message' => 'Invalid user'];
    }
    $pdo = DB::conn();
    $stmt = $pdo->prepare("
      SELECT id, sender_id, receiver_id, body, created_at, is_read
      FROM messages
      WHERE (sender_id = :uid AND receiver_id = :peer)
         OR (sender_id = :peer AND receiver_id = :uid)
      ORDER BY created_at ASC, id ASC
      LIMIT 500
    ");
    $stmt->bindValue(':uid', $uid, PDO::PARAM_INT);
    $stmt->bindValue(':peer', $peerId, PDO::PARAM_INT);
    $stmt->execute();
    $messages = $stmt->fetchAll(PDO::FETCH_ASSOC);

    $mark = $pdo->prepare("UPDATE messages SET is_read = 1 WHERE receiver_id = :uid AND sender_id = :peer AND is_read = 0");
    $mark->bindValue(':uid', $uid, PDO::PARAM_INT);
    $mark->bindValue(':peer', $peerId, PDO::PARAM_INT);
    $mark->execute();

    return [
      'messages' => $messages,
      'peer_id' => $peerId,
    ];
  }

  public function send() {
    $uid = $this->requireAuth();
    $peerId = (int)($_POST['to'] ?? 0);
    $body = trim($_POST['body'] ?? '');
    if ($peerId <= 0 || $body === '') {
      http_response_code(422);
      return ['message' => 'Recipient and message are required'];
    }
    $pdo = DB::conn();
    $stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, body, created_at, is_read) VALUES (?, ?, ?, NOW(), 0)");
    $stmt->execute([$uid, $peerId, $body]);
    return [
      'message' => 'sent',
      'id' => (int)$pdo->lastInsertId(),
      'payload' => [
        'id' => (int)$pdo->lastInsertId(),
        'sender_id' => $uid,
        'receiver_id' => $peerId,
        'body' => $body,
        'created_at' => date('Y-m-d H:i:s'),
        'is_read' => 0,
      ],
    ];
  }
}
