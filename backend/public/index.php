<?php
require __DIR__ . '/../src/bootstrap.php';
use Core\Router;
$router = new Router();

$router->post('/api/auth/register', [Controllers\AuthController::class,'register']);
$router->post('/api/auth/login',    [Controllers\AuthController::class,'login']);
$router->get('/api/auth/me',        [Controllers\AuthController::class,'me']);
$router->post('/api/auth/logout',   [Controllers\AuthController::class,'logout']);

$router->get('/api/staff',      [Controllers\StaffController::class,'list']);
$router->post('/api/admin/staff', [Controllers\StaffController::class,'store']);
$router->get('/api/admin/staff',  [Controllers\StaffController::class,'adminList']);
$router->post('/api/admin/staff/update', [Controllers\StaffController::class,'update']);
$router->post('/api/admin/staff/delete', [Controllers\StaffController::class,'delete']);
$router->get('/api/admin/staff/titles', [Controllers\StaffController::class,'titles']);
$router->post('/api/admin/staff/titles', [Controllers\StaffController::class,'storeTitle']);
$router->get('/api/admin/stats', [Controllers\StatsController::class,'overview']);
$router->get('/api/provinces', [Controllers\FacilityController::class,'provinces']);
$router->post('/api/admin/provinces', [Controllers\FacilityController::class,'storeProvince']);
$router->get('/api/districts', [Controllers\FacilityController::class,'districts']);
$router->post('/api/admin/districts', [Controllers\FacilityController::class,'storeDistrict']);
$router->get('/api/facilities', [Controllers\FacilityController::class,'list']);
$router->get('/api/facilities/providers', [Controllers\FacilityController::class,'providers']);
$router->post('/api/admin/facilities', [Controllers\FacilityController::class,'store']);
$router->post('/api/admin/facilities/providers', [Controllers\FacilityController::class,'storeProvider']);
$router->get('/api/media/hero', [Controllers\MediaController::class,'hero']);
$router->post('/api/admin/media', [Controllers\MediaController::class,'store']);
$router->get('/api/admin/media',  [Controllers\MediaController::class,'adminList']);
$router->post('/api/admin/media/update', [Controllers\MediaController::class,'update']);
$router->post('/api/admin/media/delete', [Controllers\MediaController::class,'delete']);
$router->get('/api/news',       [Controllers\NewsController::class,'latest']);
$router->get('/api/news/show',  [Controllers\NewsController::class,'show']);
$router->post('/api/admin/news',[Controllers\NewsController::class,'store']);
$router->get('/api/admin/news', [Controllers\NewsController::class,'adminList']);
$router->post('/api/admin/news/update',[Controllers\NewsController::class,'update']);
$router->post('/api/admin/news/delete',[Controllers\NewsController::class,'delete']);

$router->get('/api/agri', [Controllers\AgriController::class,'listPublic']);
$router->get('/api/admin/agri', [Controllers\AgriController::class,'adminList']);
$router->post('/api/admin/agri', [Controllers\AgriController::class,'store']);
$router->post('/api/admin/agri/update', [Controllers\AgriController::class,'update']);
$router->post('/api/admin/agri/delete', [Controllers\AgriController::class,'delete']);

$router->get('/api/doctors/availability', [Controllers\AppointmentController::class,'availability']);
$router->get('/api/appointments/check', [Controllers\AppointmentController::class,'checkAvailability']);
$router->get('/api/admin/appointments/latest', [Controllers\AppointmentController::class,'adminLatest']);
$router->get('/api/doctor/appointments', [Controllers\AppointmentController::class,'doctorSchedule']);
$router->get('/api/doctor/appointments/list', [Controllers\AppointmentController::class,'doctorAppointmentsList']);
$router->get('/api/doctor/appointments/show', [Controllers\AppointmentController::class,'doctorAppointmentShow']);
$router->post('/api/doctor/appointments/respond', [Controllers\AppointmentController::class,'doctorRespond']);
$router->get('/api/doctor/notifications', [Controllers\AppointmentController::class,'doctorNotifications']);
$router->get('/api/appointments/summary', [Controllers\AppointmentController::class,'summary']);
$router->post('/api/appointments',        [Controllers\AppointmentController::class,'create']);
$router->get('/api/appointments/me',      [Controllers\AppointmentController::class,'mine']);

$router->dispatch();
