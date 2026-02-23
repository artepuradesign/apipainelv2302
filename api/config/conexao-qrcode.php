<?php
// ==================== CONFIGURAÇÃO BANCO DE DADOS QRCODES ====================
$host = "212.85.3.226";
$username = "u617342185_qrcode";
$password = "Acerola@2026";
$database = "u617342185_qrcode";

// Criar conexão
$conn = new mysqli($host, $username, $password, $database);

// Verificar conexão
if ($conn->connect_error) {
    http_response_code(500);
    echo json_encode([
        "error" => "Database connection failed"
    ]);
    exit;
}
?>