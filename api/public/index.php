
<?php
// public/index.php

// Iniciar sessão PHP no início
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-API-Key, Accept');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Carregar configurações centralizadas
require_once __DIR__ . '/../config/conexao.php';

// Error reporting usando constantes
error_reporting(E_ALL);
ini_set('display_errors', APP_DEBUG ? 1 : 0);

// Log da requisição
error_log("===== NEW REQUEST =====");
error_log("METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("URI: " . $_SERVER['REQUEST_URI']);
error_log("QUERY: " . ($_SERVER['QUERY_STRING'] ?? ''));
error_log("HEADERS: " . json_encode(getallheaders()));

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../src/utils/Response.php';

try {
    // Conectar ao banco usando conexao.php
    $db = getDBConnection();
    
    if (!$db) {
        error_log("ERRO: Falha na conexão com o banco de dados");
        Response::error('Erro de conexão com o banco de dados', 500);
        exit;
    }
    
    error_log("SUCCESS: Conexão com banco estabelecida");
    
    // Executar seed de dados iniciais
    require_once __DIR__ . '/../src/migrations/seed_initial_data.php';
    seedInitialData($db);
    
    // Obter a URI e remover query parameters
    $uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri = str_replace('/api', '', $uri); // Remove prefixo /api
    
    error_log("PROCESSED URI: " . $uri);
    
    // Roteamento - AUTH TEM PRIORIDADE
    if (strpos($uri, '/auth') === 0) {
        error_log("ROUTING: Direcionando para autenticação");
        require_once __DIR__ . '/../src/routes/auth.php';
    } elseif (strpos($uri, '/wallet') === 0) {
        error_log("ROUTING: Direcionando para carteira");
        require_once __DIR__ . '/../src/routes/wallet.php';
    } elseif (strpos($uri, '/modules') === 0) {
        error_log("ROUTING: Direcionando para módulos");
        require_once __DIR__ . '/../src/routes/modules.php';
    } elseif (strpos($uri, '/panels') === 0) {
        error_log("ROUTING: Direcionando para painéis");
        require_once __DIR__ . '/../src/routes/panels.php';
    } elseif (strpos($uri, '/user/premium-status') !== false) {
        error_log("ROUTING: Direcionando para premium-status");
        require_once __DIR__ . '/../routes/user-premium-status.php';
    } elseif (strpos($uri, '/plan/purchase') !== false || strpos($uri, '/user/active-plan') !== false || strpos($uri, '/user/plan-usage') !== false) {
        error_log("ROUTING: Direcionando para compra de planos");
        require_once __DIR__ . '/../src/routes/plan-purchase.php';
    } elseif (strpos($uri, '/plans') === 0) {
        error_log("ROUTING: Direcionando para planos");
        require_once __DIR__ . '/../src/routes/plans.php';
    } elseif (strpos($uri, '/n8n') === 0) {
        error_log("ROUTING: Direcionando para N8N/Telegram");
        require_once __DIR__ . '/../src/routes/n8n.php';
    } elseif (strpos($uri, '/dashboard-admin') === 0) {
        error_log("ROUTING: Direcionando para dashboard administrativo");
        require_once __DIR__ . '/../src/routes/dashboard_admin.php';
    } elseif (strpos($uri, '/notifications') === 0) {
        error_log("ROUTING: Direcionando para notificações");
        require_once __DIR__ . '/../src/routes/notifications.php';
    } elseif (strpos($uri, '/access-logs') === 0 || strpos($uri, '/user-audit') === 0) {
        error_log("ROUTING: Direcionando para auditoria de usuário");
        require_once __DIR__ . '/../src/routes/user-audit.php';
    } elseif (strpos($uri, '/testimonials') === 0) {
        error_log("ROUTING: Direcionando para depoimentos");
        require_once __DIR__ . '/../src/routes/testimonials.php';
    } elseif (strpos($uri, '/newsletter') === 0) {
        error_log("ROUTING: Direcionando para newsletter");
        require_once __DIR__ . '/../src/routes/newsletter.php';
    } elseif (strpos($uri, '/src/endpoints/') !== false && (strpos($uri, 'cupom') !== false || strpos($uri, '/cupons') !== false)) {
        error_log("ROUTING: Direcionando para cupons");
        require_once __DIR__ . '/../src/routes/cupons.php';
    } elseif (strpos($uri, '/cupons') !== false || strpos($uri, '/validate-cupom') !== false || strpos($uri, '/use-cupom') !== false || strpos($uri, '/cupom-historico') !== false) {
        error_log("ROUTING: Direcionando para cupons (endpoints diretos)");
        require_once __DIR__ . '/../src/routes/cupons.php';
    } elseif (strpos($uri, '/consultas-nome') === 0) {
        // IMPORTANTE: precisa vir antes de /consultas, pois /consultas-nome também começa com /consultas
        error_log("ROUTING: Direcionando para consultas por nome");
        require_once __DIR__ . '/../src/routes/consultas-nome.php';
    } elseif (strpos($uri, '/consultas') === 0 || strpos($uri, '/cpf/cadastrar') !== false) {
        error_log("ROUTING: Direcionando para consultas");
        require_once __DIR__ . '/../src/routes/consultas.php';
    } elseif (strpos($uri, '/base-cpf') === 0) {
        error_log("ROUTING: Direcionando para base CPF");
        require_once __DIR__ . '/../src/routes/base_cpf.php';
    } elseif (strpos($uri, '/base-telefone') === 0) {
        error_log("ROUTING: Direcionando para base Telefone");
        require_once __DIR__ . '/../src/routes/base_telefone.php';
    } elseif (strpos($uri, '/base-rg') === 0) {
        error_log("ROUTING: Direcionando para base RG");
        require_once __DIR__ . '/../src/routes/base_rg.php';
    } elseif (strpos($uri, '/rg-2026') === 0) {
        error_log("ROUTING: Direcionando para RG 2026");
        require_once __DIR__ . '/../src/routes/rg_2026.php';
    } elseif (strpos($uri, '/base-cnh') === 0) {
        error_log("ROUTING: Direcionando para base CNH");
        require_once __DIR__ . '/../src/routes/base_cnh.php';
    } elseif (strpos($uri, '/base-email') === 0) {
        error_log("ROUTING: Direcionando para base Email");
        require_once __DIR__ . '/../src/routes/base_email.php';
    } elseif (strpos($uri, '/base-parente') === 0) {
        error_log("ROUTING: Direcionando para base Parente");
        require_once __DIR__ . '/../src/routes/base_parente.php';
    } elseif (strpos($uri, '/base-empresa-socio') === 0) {
        error_log("ROUTING: Direcionando para base Empresa Sócio");
        require_once __DIR__ . '/../src/routes/base_empresa_socio.php';
    } elseif (strpos($uri, '/base-endereco') === 0) {
        error_log("ROUTING: Direcionando para base Endereço");
        require_once __DIR__ . '/../src/routes/base_endereco.php';
    } elseif (strpos($uri, '/base-certidao') === 0) {
        error_log("ROUTING: Direcionando para base Certidão");
        $routeFile = __DIR__ . '/../src/routes/base_certidao.php';
        error_log("ROUTING: base_certidao file={$routeFile}, exists=" . (file_exists($routeFile) ? 'SIM' : 'NÃO'));
        require_once $routeFile;
    } elseif (strpos($uri, '/base-cns') === 0) {
        error_log("ROUTING: Direcionando para base CNS");
        $routeFile = __DIR__ . '/../src/routes/base_cns.php';
        error_log("ROUTING: base_cns file={$routeFile}, exists=" . (file_exists($routeFile) ? 'SIM' : 'NÃO'));
        require_once $routeFile;
    } elseif (strpos($uri, '/base-documento') === 0) {
        error_log("ROUTING: Direcionando para base Documento");
        $routeFile = __DIR__ . '/../routes/base-documento.php';
        error_log("ROUTING: base_documento file={$routeFile}, exists=" . (file_exists($routeFile) ? 'SIM' : 'NÃO'));
        require_once $routeFile;
    } elseif (strpos($uri, '/base-gestao') === 0) {
        error_log("ROUTING: Direcionando para base Gestão Cadastral");
        $routeFile = __DIR__ . '/../src/routes/base_gestao.php';
        error_log("ROUTING: base_gestao file={$routeFile}, exists=" . (file_exists($routeFile) ? 'SIM' : 'NÃO'));
        require_once $routeFile;
    } elseif (strpos($uri, '/base-foto') === 0) {
        error_log("ROUTING: Direcionando para base Foto");
        require_once __DIR__ . '/../src/routes/base_foto.php';
    } elseif (strpos($uri, '/base-credilink') === 0) {
        error_log("ROUTING: Direcionando para base Credilink");
        require_once __DIR__ . '/../src/endpoints/base-credilink.php';
    } elseif (strpos($uri, '/base-vacina') === 0) {
        error_log("ROUTING: Direcionando para base Vacina");
        require_once __DIR__ . '/../src/endpoints/base-vacina.php';
    } elseif (strpos($uri, '/base-receita') === 0) {
        error_log("ROUTING: Direcionando para base Receita Federal");
        require_once __DIR__ . '/../routes/base-receita.php';
    } elseif (strpos($uri, '/base-dividas-ativas') === 0) {
        error_log("ROUTING: Direcionando para base Dívidas Ativas");
        require_once __DIR__ . '/../routes/base-dividas-ativas.php';
    } elseif (strpos($uri, '/base-cnpj-mei') === 0) {
        error_log("ROUTING: Direcionando para base CNPJ MEI");
        require_once __DIR__ . '/../routes/base-cnpj-mei.php';
    } elseif (strpos($uri, '/base-rais') === 0) {
        // Roteamento para base_rais (RAIS - Histórico de Emprego)
        error_log("ROUTING: Direcionando para base RAIS");
        require_once __DIR__ . '/../src/routes/base_rais.php';
    } elseif (strpos($uri, '/base-auxilio-emergencial') === 0) {
        // Rota mais específica DEVE vir primeiro
        error_log("ROUTING: Direcionando para base Auxílio Emergencial");
        require_once __DIR__ . '/../routes/base-auxilio-emergencial.php';
    } elseif (strpos($uri, '/base-auxilio') === 0) {
        // Rota genérica vem depois
        error_log("ROUTING: Direcionando para base Auxílio (base_auxilio)");
        require_once __DIR__ . '/../src/routes/base_auxilio.php';
    } elseif (strpos($uri, '/base-inss') === 0) {
        error_log("ROUTING: Direcionando para base INSS");
        require_once __DIR__ . '/../routes/base-inss.php';
    } elseif (strpos($uri, '/base-vivo') === 0) {
        error_log("ROUTING: Direcionando para base Vivo");
        require_once __DIR__ . '/../src/routes/base_vivo.php';
    } elseif (strpos($uri, '/base-claro') === 0) {
        error_log("ROUTING: Direcionando para base Claro");
        require_once __DIR__ . '/../src/routes/base_claro.php';
    } elseif (strpos($uri, '/base-tim') === 0) {
        error_log("ROUTING: Direcionando para base TIM");
        require_once __DIR__ . '/../src/routes/base_tim.php';
    } elseif (strpos($uri, '/base-operadora-oi') === 0) {
        error_log("ROUTING: Direcionando para base Operadora OI");
        require_once __DIR__ . '/../routes/base-operadora-oi.php';
    } elseif (strpos($uri, '/base-operadora-tim') === 0) {
        error_log("ROUTING: Direcionando para base Operadora TIM");
        // Padronizado para usar /routes (igual OI) para facilitar deploy
        require_once __DIR__ . '/../routes/base-operadora-tim.php';
    } elseif (strpos($uri, '/base-senha-cpf') === 0) {
        error_log("ROUTING: Direcionando para base Senha CPF");
        require_once __DIR__ . '/../routes/base-senha-cpf.php';
    } elseif (strpos($uri, '/base-senha-email') === 0) {
        error_log("ROUTING: Direcionando para base Senha Email");
        require_once __DIR__ . '/../routes/base-senha-email.php';
    } elseif (strpos($uri, '/base-historico-veiculo') === 0) {
        error_log("ROUTING: Direcionando para base Histórico de Veículo");
        require_once __DIR__ . '/../endpoints/base-historico-veiculo.php';
    } elseif (strpos($uri, '/consultas-cpf-history') === 0) {
        error_log("ROUTING: Direcionando para histórico de consultas CPF");
        require_once __DIR__ . '/../src/routes/consultas_cpf_history.php';
    } elseif (strpos($uri, '/historico') === 0) {
        error_log("ROUTING: Direcionando para histórico completo");
        require_once __DIR__ . '/../src/routes/historico.php';
    } elseif (strpos($uri, '/consultas-cpf') === 0) {
        error_log("ROUTING: Direcionando para consultas CPF");
        require_once __DIR__ . '/../src/routes/consultas_cpf.php';
    } elseif (strpos($uri, '/upload-photo') === 0 || strpos($uri, '/upload-photo.php') === 0) {
        error_log("ROUTING: Direcionando para upload de foto");
        require_once __DIR__ . '/upload-photo.php';
    } elseif (strpos($uri, '/fotos') === 0) {
        error_log("ROUTING: Direcionando para fotos");
        require_once __DIR__ . '/fotos.php';
    } elseif (strpos($uri, '/mercadopago') === 0) {
        error_log("ROUTING: Direcionando para Mercado Pago");
        // Mapear endpoints específicos do Mercado Pago
        if ($uri === '/mercadopago/test-credentials' || $uri === '/mercadopago/test-credentials.php') {
            require_once __DIR__ . '/../mercadopago/test-credentials.php';
        } elseif ($uri === '/mercadopago/document-types' || $uri === '/mercadopago/document-types.php') {
            require_once __DIR__ . '/../mercadopago/document-types.php';
        } elseif ($uri === '/mercadopago/create-pix-payment' || $uri === '/mercadopago/create-pix-payment.php') {
            require_once __DIR__ . '/../mercadopago/create-pix-payment.php';
        } elseif ($uri === '/mercadopago/webhook' || $uri === '/mercadopago/webhook.php') {
            require_once __DIR__ . '/../src/routes/mercadopago-webhook.php';
        } elseif ($uri === '/mercadopago/check-payment-status-live' || $uri === '/mercadopago/check-payment-status-live.php') {
            require_once __DIR__ . '/../mercadopago/check-payment-status-live.php';
        } elseif ($uri === '/mercadopago/list-payments' || $uri === '/mercadopago/list-payments.php') {
            error_log("ROUTING: Direcionando para list-payments do Mercado Pago");
            require_once __DIR__ . '/../mercadopago/list-payments.php';
        } else {
            Response::error('Endpoint Mercado Pago não encontrado: ' . $uri, 404);
        }
    } elseif (strpos($uri, '/editaveis-rg') === 0) {
        error_log("ROUTING: Direcionando para Editáveis RG");
        require_once __DIR__ . '/../src/routes/editaveis_rg.php';
    } elseif (strpos($uri, '/revendas') === 0) {
        error_log("ROUTING: Direcionando para revendas");
        require_once __DIR__ . '/../src/routes/revendas.php';
    } elseif (strpos($uri, '/proxy-busca-nome') === 0) {
        error_log("ROUTING: Direcionando para proxy busca-nome");
        require_once __DIR__ . '/../src/routes/proxy-busca-nome.php';
    } elseif (strpos($uri, '/module-history') === 0) {
        error_log("ROUTING: Direcionando para module-history");
        require_once __DIR__ . '/../src/routes/module-history.php';
    } elseif (strpos($uri, '/pix-payments') === 0) {
        error_log("ROUTING: Direcionando para PIX Payments");
        require_once __DIR__ . '/../pix-payments.php';
    } elseif ($uri === '/update-expiry' || $uri === '/update_expiry') {
        error_log("ROUTING: Direcionando para Update Expiry (Reativar QR Code)");
        require_once __DIR__ . '/../update_expiry.php';
    } elseif ($uri === '/' || $uri === '') {
        error_log("ROUTING: Endpoint raiz");
        Response::success([
            'message' => 'API Externa funcionando',
            // Marcador para confirmar qual index.php está respondendo em produção
            'router_version' => 'public-index-2026-01-28-base-documento',
            'version' => '1.0',
            'timestamp' => date('Y-m-d H:i:s'),
            'app_url' => APP_URL,
            'app_env' => APP_ENV,
            'endpoints' => [
                'auth' => '/auth',
                'wallet' => '/wallet',
                'modules' => '/modules',
                'panels' => '/panels', 
                'plans' => '/plans',
                'plan-purchase' => '/plan/purchase',
                'user-active-plan' => '/user/active-plan',
                'user-plan-usage' => '/user/plan-usage',
                'dashboard-admin' => '/dashboard-admin',
                'notifications' => '/notifications',
                'testimonials' => '/testimonials',
                'testimonials-active' => '/testimonials/active',
                'access-logs' => '/access-logs',
                'user-audit' => '/user-audit',
                'newsletter' => '/newsletter',
                'cupons' => '/cupons',
                'validate-cupom' => '/validate-cupom',
                'use-cupom' => '/use-cupom',
                'consultas' => '/consultas',
                'base-cpf' => '/base-cpf',
                'base-telefone' => '/base-telefone',
                'base-rg' => '/base-rg',
                'rg-2026' => '/rg-2026',
                'base-cnh' => '/base-cnh',
                'base-email' => '/base-email',
                'base-endereco' => '/base-endereco',
                'base-certidao' => '/base-certidao',
                'base-cns' => '/base-cns',
                'base-documento' => '/base-documento',
                'base-gestao' => '/base-gestao',
                'base-credilink' => '/base-credilink',
                'base-vacina' => '/base-vacina',
                'base-receita' => '/base-receita',
                'base-dividas-ativas' => '/base-dividas-ativas',
                'base-cnpj-mei' => '/base-cnpj-mei',
                'base-auxilio-emergencial' => '/base-auxilio-emergencial',
                'base-inss' => '/base-inss',
                 'base-operadora-oi' => '/base-operadora-oi',
                 'base-operadora-tim' => '/base-operadora-tim',
                'base-senha-cpf' => '/base-senha-cpf',
                'base-senha-email' => '/base-senha-email',
                'consultas-cpf' => '/consultas-cpf',
                'upload-photo' => '/upload-photo',
                'fotos' => '/fotos/{arquivo}.jpg',
                'historico' => '/historico/completo',
                'historico-stats' => '/historico/estatisticas',
                'base-historico-veiculo' => '/base-historico-veiculo',
                'pix-payments' => '/pix-payments',
                'mercadopago-list-payments' => '/mercadopago/list-payments',
                'editaveis-rg' => '/editaveis-rg'
            ]
        ], 'API Externa operacional');
    } else {
        error_log("ROUTING: Endpoint não encontrado: " . $uri);
        Response::error('[public-index-2026-01-25] Endpoint não encontrado: ' . $uri, 404);
    }
    
} catch (Exception $e) {
    error_log("FATAL ERROR: " . $e->getMessage());
    error_log("TRACE: " . $e->getTraceAsString());
    Response::error('Erro interno do servidor: ' . $e->getMessage(), 500);
}
?>
