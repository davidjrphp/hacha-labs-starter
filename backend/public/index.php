<?php
require __DIR__ . '/../src/bootstrap.php';
use Core\Router;
$router = new Router();

$router->post('/api/auth/register', [Controllers\AuthController::class,'register']);
$router->post('/api/auth/login',    [Controllers\AuthController::class,'login']);
$router->get('/api/auth/me',        [Controllers\AuthController::class,'me']);
$router->post('/api/auth/logout',   [Controllers\AuthController::class,'logout']);

$router->get('/api/staff',      [Controllers\StaffController::class,'list']);
$router->get('/api/media/hero', [Controllers\MediaController::class,'hero']);
$router->post('/api/admin/media', [Controllers\MediaController::class,'store']);
$router->get('/api/news',       [Controllers\NewsController::class,'latest']);
$router->post('/api/admin/news',[Controllers\NewsController::class,'store']);

$router->get('/api/doctors/availability', [Controllers\AppointmentController::class,'availability']);
$router->post('/api/appointments',        [Controllers\AppointmentController::class,'create']);
$router->get('/api/appointments/me',      [Controllers\AppointmentController::class,'mine']);

$router->dispatch();
