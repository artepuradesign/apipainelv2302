
# Plano de Correção: Criação/Edição de Usuários - Dias, Desconto, CPF e Notificações

## Problemas Identificados

1. **Erro 500 na criação**: O PUT de atualização envia `plan_discount` no corpo da requisição, mas esse campo nao existe na tabela `users`. O backend tenta fazer `SET plan_discount = ?` e gera erro SQL `Column not found: 1054`. Isso faz o passo 2 inteiro falhar, perdendo saldo, dias e desconto.

2. **CPF sem validação**: Aceita qualquer caractere. Deve aceitar apenas numeros, maximo 11 digitos.

3. **Notas/Observações**: O campo `notes` nao e enviado no payload de criação (passo 2), então a notificação nunca e gerada para o usuario.

4. **Mensagem de erro generica**: Quando falha, mostra "alguns dados não foram salvos" sem dizer quais campos falharam.

---

## Solução

### 1. Frontend - GestaoUsuarios.tsx (handleAddUser)

- Remover `plan_discount` do payload do PUT (passo 2). Enviar apenas campos que existem na tabela `users`.
- Adicionar `notes` ao payload para que o backend gere a notificação.
- Após o PUT, fazer uma chamada separada para atualizar o desconto via `updatePlanDiscount` se necessario (ou incluir no payload como campo que o backend trata separadamente - ja funciona assim no `updateUser`).
- Melhorar a mensagem de erro para incluir o detalhe retornado pela API.

Mudancas especificas:
```typescript
// Antes (linha 149-164):
const updatePayload: any = {
  tipoplano: newUser.plan,
  saldo: newUser.balance,
  saldo_plano: extraData.planBalance,
  cpf: newUser.cpf,
  telefone: newUser.phone,
  endereco: newUser.address,
  plan_discount: extraData.planDiscount, // CAUSA O ERRO 500
};

// Depois:
const updatePayload: any = {
  tipoplano: newUser.plan,
  saldo: newUser.balance,
  saldo_plano: extraData.planBalance,
  cpf: newUser.cpf,
  telefone: newUser.phone,
  endereco: newUser.address,
  plan_discount: extraData.planDiscount, // mantido - backend trata separadamente via updatePlanDiscount()
  notes: newUser.notes, // ADICIONADO para gerar notificação
};
```

A causa raiz e que o backend precisa NÃO incluir `plan_discount` no `$allowedFields` do SQL UPDATE (ja corrigido no diff anterior), mas ainda precisa aceita-lo para processar via `updatePlanDiscount()`.

- Melhorar a mensagem de warning (linha 171):
```typescript
toast.warning(`Usuário criado, mas houve erro ao salvar dados complementares: ${updateResult.error}`);
```

### 2. Frontend - AddUserModal.tsx (campo CPF)

- Adicionar validação para aceitar apenas numeros, maximo 11 digitos.

```tsx
// CPF - apenas numeros, max 11
<Input
  id="add-cpf"
  className="h-9 text-sm"
  value={newUser.cpf}
  onChange={(e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 11);
    setNewUser({ ...newUser, cpf: value });
  }}
  placeholder="Ex: 12345678900"
  maxLength={11}
/>
```

### 3. Frontend - EditUserModal.tsx (campo CPF)

- Mesma validação de CPF numerico, max 11 digitos.

### 4. Backend - DashboardAdminController.php (createUser)

Adicionar `data_inicio` e `data_fim` ao array `$optionalFields` do metodo `createUser` (linha 569):

```php
$optionalFields = ['cpf', 'cnpj', 'telefone', 'endereco', 'cep', 'cidade', 'estado', 'data_inicio', 'data_fim'];
```

Apos a criação do usuario, chamar `updatePlanDiscount()` e `sendUpdateNotifications()` para tratar desconto e notas:

```php
// Após commit, tratar plan_discount separadamente
if (isset($data['plan_discount']) && $data['plan_discount'] > 0) {
    $this->updatePlanDiscount($userId, $data);
}

// Enviar notificação de notas se houver
if (isset($data['notes']) && !empty(trim($data['notes']))) {
    $this->sendCreateNotifications($userId, $data);
}
```

### 5. Backend - DashboardAdminController.php (updateUser)

Garantir que `plan_discount` NÃO esta no `$allowedFields` (ja corrigido), mas que `updatePlanDiscount()` continua sendo chamado (ja funciona, linha 649).

---

## Resumo das Alterações

| Arquivo | Mudança |
|---------|---------|
| `src/pages/dashboard/GestaoUsuarios.tsx` | Adicionar `notes` ao payload de criação; melhorar mensagem de erro |
| `src/components/dashboard/users/AddUserModal.tsx` | CPF numerico, max 11 digitos |
| `src/components/dashboard/users/EditUserModal.tsx` | CPF numerico, max 11 digitos |
| `api/src/controllers/DashboardAdminController.php` | Adicionar `data_inicio`/`data_fim` em `$optionalFields` do `createUser`; chamar `updatePlanDiscount` e notificação de notas apos criação; garantir `plan_discount` fora do `$allowedFields` |
