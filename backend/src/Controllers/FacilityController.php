<?php
namespace Controllers;

use Core\DB;
use PDO;

class FacilityController
{
    public function list()
    {
        $sql = "SELECT hf.id,hf.name,hf.city,hf.address,hf.phone,hf.hmis_code,hf.mfl_code,
                       hf.province_id,hf.district_id,
                       p.name AS province_name, d.name AS district_name
                FROM healthcare_facilities hf
                LEFT JOIN provinces p ON p.id = hf.province_id
                LEFT JOIN districts d ON d.id = hf.district_id
                ORDER BY hf.name ASC";
        $rows = DB::conn()->query($sql)->fetchAll(PDO::FETCH_ASSOC);
        return $rows;
    }

    public function providers()
    {
        $facilityId = (int)($_GET['facility_id'] ?? 0);
        if ($facilityId <= 0) {
            http_response_code(422);
            return ['message' => 'facility_id is required'];
        }
        $stmt = DB::conn()->prepare("SELECT id,provider_name,title,phone FROM facility_providers WHERE facility_id=? ORDER BY provider_name ASC");
        $stmt->execute([$facilityId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function provinces()
    {
        return DB::conn()->query("SELECT id,name FROM provinces ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function districts()
    {
        $provinceId = isset($_GET['province_id']) ? (int)$_GET['province_id'] : 0;
        if ($provinceId > 0) {
            $stmt = DB::conn()->prepare("SELECT id,province_id,name FROM districts WHERE province_id=? ORDER BY name ASC");
            $stmt->execute([$provinceId]);
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
        return DB::conn()->query("SELECT id,province_id,name FROM districts ORDER BY name ASC")->fetchAll(PDO::FETCH_ASSOC);
    }

    public function storeProvince()
    {
        $this->requireAdmin();
        $name = trim($_POST['name'] ?? '');
        if ($name === '') {
            http_response_code(422);
            return ['message' => 'Province name is required'];
        }
        $pdo = DB::conn();
        $stmt = $pdo->prepare("INSERT INTO provinces (name) VALUES (?)");
        $stmt->execute([$name]);
        return ['message' => 'Province created', 'province_id' => (int)$pdo->lastInsertId()];
    }

    public function storeDistrict()
    {
        $this->requireAdmin();
        $provinceId = (int)($_POST['province_id'] ?? 0);
        $name = trim($_POST['name'] ?? '');
        if ($provinceId <= 0 || $name === '') {
            http_response_code(422);
            return ['message' => 'Province and district name are required'];
        }
        $pdo = DB::conn();
        $stmt = $pdo->prepare("INSERT INTO districts (province_id,name) VALUES (?,?)");
        $stmt->execute([$provinceId, $name]);
        return ['message' => 'District created', 'district_id' => (int)$pdo->lastInsertId()];
    }

    public function store()
    {
        $this->requireAdmin();
        $name = trim($_POST['name'] ?? '');
        $districtId = (int)($_POST['district_id'] ?? 0);
        $provinceId = (int)($_POST['province_id'] ?? 0);
        if ($name === '' || $districtId <= 0) {
            http_response_code(422);
            return ['message' => 'Facility name and district are required'];
        }
        $pdo = DB::conn();
        $stmt = $pdo->prepare("SELECT province_id FROM districts WHERE id=? LIMIT 1");
        $stmt->execute([$districtId]);
        $district = $stmt->fetch(PDO::FETCH_ASSOC);
        if (!$district) {
            http_response_code(404);
            return ['message' => 'District not found'];
        }
        $resolvedProvince = (int)$district['province_id'];
        if ($provinceId > 0 && $provinceId !== $resolvedProvince) {
            http_response_code(422);
            return ['message' => 'District does not belong to selected province'];
        }

        $city = trim($_POST['city'] ?? '');
        $address = trim($_POST['address'] ?? '');
        $phone = trim($_POST['phone'] ?? '');
        $hmis = trim($_POST['hmis_code'] ?? '');
        $mfl = trim($_POST['mfl_code'] ?? '');

        $insert = $pdo->prepare("INSERT INTO healthcare_facilities
            (name,province_id,district_id,city,address,phone,hmis_code,mfl_code)
            VALUES (?,?,?,?,?,?,?,?)");
        $insert->execute([
            $name,
            $resolvedProvince,
            $districtId,
            $city ?: null,
            $address ?: null,
            $phone ?: null,
            $hmis ?: null,
            $mfl ?: null,
        ]);

        return ['message' => 'Facility created', 'facility_id' => (int)$pdo->lastInsertId()];
    }

    public function storeProvider()
    {
        $this->requireAdmin();
        $facilityId = (int)($_POST['facility_id'] ?? 0);
        $name = trim($_POST['provider_name'] ?? '');
        if ($facilityId <= 0 || $name === '') {
            http_response_code(422);
            return ['message' => 'Facility and provider name are required'];
        }
        $title = trim($_POST['title'] ?? '');
        $phone = trim($_POST['phone'] ?? '');

        $pdo = DB::conn();
        $stmt = $pdo->prepare("INSERT INTO facility_providers (facility_id,provider_name,title,phone) VALUES (?,?,?,?)");
        $stmt->execute([$facilityId, $name, $title ?: null, $phone ?: null]);

        return ['message' => 'Provider added', 'provider_id' => (int)$pdo->lastInsertId()];
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
