<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// ─── DB CONFIG ────────────────────────────────────────────────────────────────
define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'taskmanager');

// ─── DB CONNECTION ────────────────────────────────────────────────────────────
function getDB(): mysqli {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    if ($conn->connect_error) {
        sendError(500, "Database connection failed: " . $conn->connect_error);
    }
    return $conn;
}

// ─── RESPONSE HELPERS ─────────────────────────────────────────────────────────
function sendJSON(int $status, $data): void {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function sendError(int $status, string $message): void {
    sendJSON($status, ["error" => $message]);
}

// ─── ROUTER ───────────────────────────────────────────────────────────────────
$method = $_SERVER['REQUEST_METHOD'];
// Works whether the file is accessed as:
//   /taskmanager/backend/tasks.php        (list)
//   /taskmanager/backend/tasks.php/42     (single task via PATH_INFO)
//   /taskmanager/backend/tasks            (via mod_rewrite, if available)
$pathInfo = $_SERVER['PATH_INFO'] ?? '';
$id = null;
if ($pathInfo !== '' && $pathInfo !== '/') {
    $segment = trim($pathInfo, '/');
    if (is_numeric($segment)) {
        $id = (int)$segment;
    }
}

switch ($method) {
    case 'GET':
        getTasks();
        break;
    case 'POST':
        createTask();
        break;
    case 'PATCH':
        if (!$id) sendError(400, "Task ID required");
        updateTask($id);
        break;
    case 'DELETE':
        if (!$id) sendError(400, "Task ID required");
        deleteTask($id);
        break;
    default:
        sendError(405, "Method not allowed");
}

// ─── HANDLERS ────────────────────────────────────────────────────────────────
function getTasks(): void {
    $db = getDB();
    $result = $db->query("SELECT * FROM tasks ORDER BY createdAt DESC");
    $tasks = [];
    while ($row = $result->fetch_assoc()) {
        $row['completed'] = (bool)$row['completed'];
        $tasks[] = $row;
    }
    $db->close();
    sendJSON(200, $tasks);
}

function createTask(): void {
    $body = json_decode(file_get_contents("php://input"), true);
    $title = trim($body['title'] ?? '');

    if ($title === '') {
        sendError(400, "Title is required");
    }
    if (strlen($title) > 255) {
        sendError(400, "Title must be 255 characters or fewer");
    }

    $db = getDB();
    $stmt = $db->prepare("INSERT INTO tasks (title, completed, createdAt) VALUES (?, 0, NOW())");
    $stmt->bind_param("s", $title);
    $stmt->execute();
    $newId = $stmt->insert_id;
    $stmt->close();

    $row = $db->query("SELECT * FROM tasks WHERE id = $newId")->fetch_assoc();
    $row['completed'] = (bool)$row['completed'];
    $db->close();
    sendJSON(201, $row);
}

function updateTask(int $id): void {
    $body = json_decode(file_get_contents("php://input"), true);

    $db = getDB();
    $task = $db->query("SELECT * FROM tasks WHERE id = $id")->fetch_assoc();
    if (!$task) {
        $db->close();
        sendError(404, "Task not found");
    }

    // Support updating completed and/or title
    $completed = isset($body['completed']) ? (int)(bool)$body['completed'] : (int)$task['completed'];
    $title     = isset($body['title']) ? trim($body['title']) : $task['title'];

    if ($title === '') sendError(400, "Title cannot be empty");

    $stmt = $db->prepare("UPDATE tasks SET completed = ?, title = ? WHERE id = ?");
    $stmt->bind_param("isi", $completed, $title, $id);
    $stmt->execute();
    $stmt->close();

    $row = $db->query("SELECT * FROM tasks WHERE id = $id")->fetch_assoc();
    $row['completed'] = (bool)$row['completed'];
    $db->close();
    sendJSON(200, $row);
}

function deleteTask(int $id): void {
    $db = getDB();
    $task = $db->query("SELECT id FROM tasks WHERE id = $id")->fetch_assoc();
    if (!$task) {
        $db->close();
        sendError(404, "Task not found");
    }
    $db->query("DELETE FROM tasks WHERE id = $id");
    $db->close();
    sendJSON(200, ["message" => "Task deleted"]);
}