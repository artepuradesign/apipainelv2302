<?php
// src/endpoints/system-config/get.php

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
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
    
    $systemConfigService = new SystemConfigService($db);
    
    // Check if specific config key is requested
    $configKey = $_GET['key'] ?? null;
    $category = $_GET['category'] ?? null;
    
    if ($configKey) {
        // Get specific config value
        $value = $systemConfigService->getConfigValue($configKey);
        
        if ($value !== null) {
            Response::success([
                'config_key' => $configKey,
                'config_value' => $value
            ], 'Configuração obtida com sucesso');
        } else {
            Response::error('Configuração não encontrada', 404);
        }
    } else {
        // Get all configs or by category
        $configs = $systemConfigService->getAllConfigs($category);
        
        Response::success($configs, 'Configurações obtidas com sucesso');
    }
    
} catch (Exception $e) {
    error_log("SYSTEM_CONFIG_GET ERROR: " . $e->getMessage());
    Response::error('Erro interno do servidor', 500);
}