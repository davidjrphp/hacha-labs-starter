<?php
// backend/config.php

return [
    'db' => [

        // If PHP is running inside Docker and MySQL is on Windows host:
        // use host.docker.internal
        'host'     => getenv('DB_HOST') ?: '127.0.0.1',
        'port'     => getenv('DB_PORT') ?: '3306',
        'database' => getenv('DB_NAME') ?: 'hacha_labs',
        'username' => getenv('DB_USER') ?: 'root',
        'password' => getenv('DB_PASS') ?: 'D3vP@$$vvorD',
        'charset'  => 'utf8mb4',
    ],
];
