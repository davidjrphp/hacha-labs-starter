<?php
spl_autoload_register(function($class){
  $base = __DIR__ . '/';
  $file = $base . str_replace('\\','/',$class) . '.php';
  if (file_exists($file)) require $file;
});
session_start();
date_default_timezone_set('Africa/Lusaka');
