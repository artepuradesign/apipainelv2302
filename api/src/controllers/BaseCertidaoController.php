<?php
// src/controllers/BaseCertidaoController.php

require_once __DIR__ . '/../models/BaseCertidao.php';
require_once __DIR__ . '/../utils/Response.php';

class BaseCertidaoController {
    private $db;
    private $model;

    public function __construct($db) {
        $this->db = $db;
        $this->model = new BaseCertidao($db);
    }

    public function getByCpfId() {
        try {
            $cpfId = $_GET['cpf_id'] ?? null;

            if (!$cpfId) {
                Response::error('CPF ID é obrigatório', 400);
                return;
            }

            $data = $this->model->getByCpfId($cpfId);

            // Pode retornar null (sem registro) ou o objeto da certidão
            Response::success($data, 'Certidão carregada com sucesso');
        } catch (Exception $e) {
            Response::error('Erro ao carregar certidão: ' . $e->getMessage(), 500);
        }
    }
}
