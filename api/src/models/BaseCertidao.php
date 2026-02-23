<?php
// src/models/BaseCertidao.php

class BaseCertidao {
    private $db;
    private $table = 'base_certidao';

    public function __construct($db) {
        $this->db = $db;
    }

    public function getByCpfId($cpfId) {
        $query = "SELECT * FROM {$this->table} WHERE cpf_id = ? LIMIT 1";
        $stmt = $this->db->prepare($query);
        $stmt->execute([$cpfId]);

        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }
}
