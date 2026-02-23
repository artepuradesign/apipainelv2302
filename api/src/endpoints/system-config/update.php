<?php
// src/endpoints/system-config/update.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../utils/Response.php';
require_once __DIR__ . '/../../services/SystemConfigService.php';

try {
    $db = getDBConnection();
    
    if (!$db) {
        Response::error('Erro de conexão com o banco de dados', 500);
        exit;
    }
    
    // Verify admin authorization (you can implement your auth logic here)
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? '';
    
    if (!$authHeader || !str_starts_with($authHeader, 'Bearer ')) {
        Response::error('Token de autorização necessário', 401);
        exit;
    }
    
    $token = substr($authHeader, 7);
    
    // Verify admin token/session
    $query = "SELECT u.user_id, u.user_role FROM user_sessions us 
              JOIN users u ON us.user_id = u.user_id 
              WHERE us.session_token = ? AND us.expires_at > NOW() AND us.status = 'active'";
    $stmt = $db->prepare($query);
    $stmt->execute([$token]);
    $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || $user['user_role'] !== 'admin') {
        Response::error('Acesso negado - apenas administradores', 403);
        exit;
    }
    
    // Get request data
    $input = json_decode(file_get_contents('php://input'), true);
    
    if (!$input || !isset($input['config_key']) || !isset($input['config_value'])) {
        Response::error('Dados inválidos - config_key e config_value são obrigatórios', 400);
        exit;
    }
    
    $systemConfigService = new SystemConfigService($db);
    
    $success = $systemConfigService->updateConfig(
        $input['config_key'], 
        $input['config_value'],
        $input['config_type'] ?? null
    );
    
    if ($success) {
        // Clear cache
        $systemConfigService->clearCache($input['config_key']);
        
        Response::success([
            'config_key' => $input['config_key'],
            'config_value' => $input['config_value']
        ], 'Configuração atualizada com sucesso');
    } else {
        Response::error('Erro ao atualizar configuração', 500);
    }
    
} catch (Exception $e) {
    error_log("SYSTEM_CONFIG_UPDATE ERROR: " . $e->getMessage());
    Response::error('Erro interno do servidor', 500);
}