<?php
namespace Helpers;
class Validator {
  public static function email(string $v): bool { return filter_var($v, FILTER_VALIDATE_EMAIL) !== false; }
  public static function strongPassword(string $v): bool {
    return strlen($v)>=8 && preg_match('/[A-Z]/',$v) && preg_match('/[a-z]/',$v) && preg_match('/\d/',$v);
  }
  public static function name(string $v): bool { return (bool)preg_match('/^[A-Za-z0-9 \'._-]{2,120}$/',$v); }
}
