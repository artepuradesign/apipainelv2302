<?php
// src/services/SystemConfigService.php

class SystemConfigService {
    private $db;
    private $cache = [];
    
    public function __construct($db) {
        $this->db = $db;
    }
    
    /**
     * Get a specific configuration value by key
     */
    public function getConfigValue($key, $default = null) {
        try {
            // Check cache first
            if (isset($this->cache[$key])) {
                return $this->cache[$key];
            }
            
            $query = "SELECT config_value, config_type FROM system_config WHERE config_key = ?";
            $stmt = $this->db->prepare($query);
            $stmt->execute([$key]);
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                $value = $this->castValue($result['config_value'], $result['config_type']);
                
                // Cache the result
                $this->cache[$key] = $value;
                
                return $value;
            }
            
            return $default;
            
        } catch (Exception $e) {
            error_log("SystemConfigService::getConfigValue error for key {$key}: " . $e->getMessage());
            return $default;
        }
    }
    
    /**
     * Get referral bonus amount from bonus.php file
     */
    public function getReferralBonusAmount() {
        $bonusConfigService = BonusConfigService::getInstance();
        return $bonusConfigService->getBonusAmount();
    }
    
    /**
     * Get multiple config values
     */
    public function getMultipleConfigs($keys) {
        try {
            $placeholders = str_repeat('?,', count($keys) - 1) . '?';
            $query = "SELECT config_key, config_value, config_type FROM system_config WHERE config_key IN ($placeholders)";
            $stmt = $this->db->prepare($query);
            $stmt->execute($keys);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $configs = [];
            foreach ($results as $row) {
                $configs[$row['config_key']] = $this->castValue($row['config_value'], $row['config_type']);
            }
            
            return $configs;
            
        } catch (Exception $e) {
            error_log("SystemConfigService::getMultipleConfigs error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Get all system configurations
     */
    public function getAllConfigs($category = null) {
        try {
            $query = "SELECT config_key, config_value, config_type, category, description, is_public FROM system_config";
            $params = [];
            
            if ($category) {
                $query .= " WHERE category = ?";
                $params[] = $category;
            }
            
            $query .= " ORDER BY category, config_key";
            
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $results = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            $configs = [];
            foreach ($results as $row) {
                $configs[] = [
                    'config_key' => $row['config_key'],
                    'config_value' => $this->castValue($row['config_value'], $row['config_type']),
                    'config_type' => $row['config_type'],
                    'category' => $row['category'],
                    'description' => $row['description'],
                    'is_public' => (bool)$row['is_public']
                ];
            }
            
            return $configs;
            
        } catch (Exception $e) {
            error_log("SystemConfigService::getAllConfigs error: " . $e->getMessage());
            return [];
        }
    }
    
    /**
     * Update a configuration value
     */
    public function updateConfig($key, $value, $type = null) {
        try {
            // Clear cache
            unset($this->cache[$key]);
            
            if ($type === null) {
                // Get current type
                $query = "SELECT config_type FROM system_config WHERE config_key = ?";
                $stmt = $this->db->prepare($query);
                $stmt->execute([$key]);
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                $type = $result ? $result['config_type'] : 'string';
            }
            
            // Convert value to string for storage
            $stringValue = $this->valueToString($value, $type);
            
            $query = "UPDATE system_config SET config_value = ?, updated_at = NOW() WHERE config_key = ?";
            $stmt = $this->db->prepare($query);
            return $stmt->execute([$stringValue, $key]);
            
        } catch (Exception $e) {
            error_log("SystemConfigService::updateConfig error for key {$key}: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Clear cache
     */
    public function clearCache($key = null) {
        if ($key) {
            unset($this->cache[$key]);
        } else {
            $this->cache = [];
        }
    }
    
    /**
     * Cast string value to appropriate type
     */
    private function castValue($value, $type) {
        switch ($type) {
            case 'boolean':
                return filter_var($value, FILTER_VALIDATE_BOOLEAN);
            case 'number':
                return strpos($value, '.') !== false ? (float) $value : (int) $value;
            case 'json':
                return json_decode($value, true);
            default:
                return $value;
        }
    }
    
    /**
     * Convert value to string for storage
     */
    private function valueToString($value, $type) {
        switch ($type) {
            case 'boolean':
                return $value ? 'true' : 'false';
            case 'json':
                return json_encode($value);
            default:
                return (string) $value;
        }
    }
}