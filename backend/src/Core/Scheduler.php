<?php
namespace Core;
class Scheduler {
  public static function run(){
    // stub: production can send emails via SMTP using MAIL_* envs
    echo "Scheduler ran at ".date('c')."\n";
  }
}
