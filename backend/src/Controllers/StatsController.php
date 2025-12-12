<?php
// WRITTEN BY DAVID MWELWA
// EVEN IF YOU KNOW WHAT YOU"RE DOING, LEAVE THIS CODE ALONE, IT'S NONE OF YOUR DAME BUSINESS
// THIS IS NOT YOUR MOTHER'S CODE, DON"T TOUCH ANYTHING HERE
// DON'T EXPERIMENT YOUR SKILLS ON THIS SCRIPT, GO TO YOUTUBE AND LEARN AND DEVELOP YOUR OWN SCRIPT FOR EXPERIMENTS
// REMEMBER, IF IT WORKS DON'T TOUCH IT, DON'T TRY TO INVESTIGATE WHY AND HOW IT WORKS 

namespace Controllers;

use Core\DB;

class StatsController
{
    public function overview()
    {
        $this->requireAdmin();
        $pdo = DB::conn();

        $totalAppointments   = (int)$pdo->query("SELECT COUNT(*) FROM appointments")->fetchColumn();
        $newAppointments     = (int)$pdo->query("SELECT COUNT(*) FROM appointments WHERE type='new'")->fetchColumn();
        $approvedAppointments= (int)$pdo->query("SELECT COUNT(*) FROM appointments WHERE status='approved'")->fetchColumn();
        $rejectedAppointments= (int)$pdo->query("SELECT COUNT(*) FROM appointments WHERE status='declined'")->fetchColumn();
        $closedAppointments  = (int)$pdo->query("SELECT COUNT(*) FROM appointments WHERE status='completed'")->fetchColumn();
        $totalStaff          = (int)$pdo->query("SELECT COUNT(*) FROM staff")->fetchColumn();

        return [
            'total_appointments'    => $totalAppointments,
            'new_appointments'      => $newAppointments,
            'approved_appointments' => $approvedAppointments,
            'rejected_appointments' => $rejectedAppointments,
            'closed_appointments'   => $closedAppointments,
            'total_staff'           => $totalStaff,
        ];
    }

    private function requireAdmin(): void
    {
        if ((int)($_SESSION['role_id'] ?? 0) !== 1) {
            http_response_code(403);
            echo json_encode(['message' => 'Forbidden']);
            exit;
        }
    }
}
