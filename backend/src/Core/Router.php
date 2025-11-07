<?php
namespace Core;
class Router {
  private array $routes = ['GET'=>[], 'POST'=>[]];
  public function get($path,$handler){ $this->routes['GET'][$path]=$handler; }
  public function post($path,$handler){ $this->routes['POST'][$path]=$handler; }
  public function dispatch(){
    $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
    $uri = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
    header('Content-Type: application/json');
    if (isset($this->routes[$method][$uri])) {
      $h = $this->routes[$method][$uri];
      echo json_encode((new $h[0])->{$h[1]}());
      return;
    }
    http_response_code(404);
    echo json_encode(['message'=>'Not found']);
  }
}
