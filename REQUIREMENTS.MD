# Modelagem do Banco de Dados — App de Transporte Escolar

> Stack: PostgreSQL (com PostGIS opcional para os campos de geolocalização)
> Sistema sem multi-tenant — uma única escola por instância.

---

## 1. `users` 

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| name | varchar | |
| email | varchar unique | |
| role | enum |
| password_hash | varchar | |
| is_active | boolean | |
| created_at | timestamp | |
| updated_at | timestamp | |


---

enum

Admin

user_chefe_transporte

user_cadastral

## 2. `drivers` (dado cadastral, sem login)

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| name | varchar | |
| phone | varchar | |
| license_number | varchar | |
| license_category | varchar | |
| license_expiry | date | |
| status | enum('disponivel', 'em_rota', 'inativo') | |

---

## 3. `vehicles`

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| plate | varchar unique | |
| model | varchar | |
| capacity | int | |
| status | enum('ativo', 'manutencao', 'inativo') | |
| last_lat | numeric(9,6) ou geography(Point) | |
| last_lng | numeric(9,6) ou geography(Point) | |
| last_position_at | timestamp | |

consumo


---

## 4. `students`

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| external_id | varchar, nullable | id no sistema externo, se `source='api'` |
| source | enum('manual', 'api') | |
| name | varchar | |
| birth_date | date | |
| shift | enum('manha', 'tarde', 'integral') | |
| responsible_name | varchar | dado cadastral, sem vínculo com usuário |
| responsible_phone | varchar | |
| pickup_lat | numeric(9,6) ou geography(Point) | |
| pickup_lng | numeric(9,6) ou geography(Point) | |
| pickup_address | text | |
| status | enum('ativo', 'inativo') | |
| synced_at | timestamp, nullable | última sincronização, se via API |

---

## 5. `routes`

| Campo | Tipo | Observação |
|---|---|---|
| id | UUID PK | |
| vehicle_id | UUID FK → vehicles | |
| driver_id | UUID FK → drivers | |
| shift | enum('manha', 'tarde', 'integral') | |
| status | enum('planejada', 'em_andamento', 'concluida', 'cancelada') | |
| optimized_at | timestamp | |
| total_distance_km | numeric | |
| estimated_duration_min | int | |
| created_at | timestamp | |

need a stops table

---

## 6. `school_location` (singleton — 1 única linha)

| Campo | Tipo | Observação |
|---|---|---|
| id | smallint PK, `CHECK (id = 1)` | trava em 1 registro |
| address | text | |
| lat | numeric(9,6) ou geography(Point) | |
| lng | numeric(9,6) ou geography(Point) | |
| entry_time | time | |
| exit_time | time | |
| updated_at | timestamp | |

---

## Observações

- **Único usuário do sistema é o gestor**: `users` não tem mais `role`, pois motorista e responsável não fazem login — são apenas dados cadastrados pelo gestor em `drivers` e nos campos `responsible_*` de `students`.
- **Sem tabela de escola tradicional**: os dados fixos da escola vivem em `school_location`, uma tabela travada em 1 única linha via `CHECK (id = 1)`.
- **`students.source`** permite abstrair a origem do cadastro (manual ou API externa) sem alterar o restante do sistema — o serviço de rotas e otimização sempre lê de `students`, independente da origem.
- **`vehicle_positions`** deve ser avaliada para particionamento por data (ex: partição mensal) devido ao alto volume de inserções em tempo real.

**Total: 9 tabelas.**


# Funcionalidades, Requisitos e Fluxo — App de Transporte Escolar

> Complementa o documento `modelagem-banco-dados.md`.

---

## 1. Usuário do sistema

Único usuário autenticado: **o gestor**. Não há login de motorista nem de responsável — ambos são apenas dados cadastrados e gerenciados pelo gestor. Isso mantém a aplicação simples: uma API + um painel, sem múltiplos apps ou camadas de permissão.

Motorista e responsável podem, no máximo, ter acesso a uma **visão pública/limitada** (ex: link de acompanhamento da rota do dia, sem senha), caso vocês queiram oferecer isso depois — mas isso é opcional e fica fora do core inicial.

---

## 2. Funcionalidades

- Cadastrar, editar e inativar veículos
- Cadastrar, editar e inativar motoristas (dado cadastral, sem login)
- Vincular motorista a veículo
- Cadastrar, editar e inativar alunos (quando `source = manual`), incluindo nome e telefone do responsável
- Configurar sincronização de alunos via API externa (quando `source = api`)
- Configurar localização da escola (`school_location`)
- Configurar parâmetros de otimização (`optimization_settings`): distância máxima de caminhada, buffer de tempo, duração máxima de rota
- Disparar o cálculo de rota 
- Visualizar rotas geradas antes de confirmar (revisão manual opcional)
- Acompanhar rotas em andamento no mapa (se houver algum dispositivo enviando localização — ex: celular do motorista via link simples, sem login)
- Consultar histórico de rotas e relatórios (pontualidade, distância percorrida, ausências)

---

## 3. Requisitos funcionais (RF)

| Código | Requisito |
|---|---|
| RF01 | O sistema deve permitir cadastro de veículos com placa, modelo e capacidade. |
| RF02 | O sistema deve permitir cadastro de motoristas com CNH e categoria. |
| RF03 | O sistema deve permitir vincular um motorista a um veículo. |
| RF04 | O sistema deve permitir cadastro manual de alunos com endereço de embarque geocodificado. |
| RF05 | O sistema deve permitir sincronização automática de alunos via API externa, sem sobrescrever alunos cadastrados manualmente. |
| RF06 | O sistema deve calcular a rota ótima por turno, considerando capacidade dos veículos e localização dos alunos. |
| RF07 | O sistema deve permitir que o gestor revise e ajuste manualmente uma rota antes de confirmá-la. |
| RF08 | O sistema deve exibir a sequência de paradas da rota do dia (visão do gestor, e visão simplificada opcional para o motorista sem login). |
| RF09 | O sistema deve permitir marcar o status de cada aluno na parada (embarcado/não compareceu). |
| RF10 | O sistema deve capturar e armazenar a localização do veículo em intervalos regulares durante a rota, caso haja envio de localização disponível. |
| RF11 | O sistema deve permitir consultar/exibir a rota em andamento (ex: link de acompanhamento, sem exigir login do responsável). |
| RF12 | O sistema deve permitir consulta de histórico de rotas e relatórios de desempenho. |
| RF13 | O sistema deve permitir configuração dos parâmetros de otimização pelo gestor, sem necessidade de alteração de código. |
| RF14 | O sistema deve permitir configuração da localização única da escola. |

---

## 4. Requisitos não funcionais (RNF)

| Código | Requisito |
|---|---|
| RNF01 | O sistema não deve ser multi-tenant — atende a uma única escola por instância. |
| RNF02 | O sistema deve ter um único usuário autenticado (gestor) — sem camadas de permissão por perfil. |
| RNF03 | O cálculo de rota deve ser assíncrono (fila), sem bloquear a API durante o processamento. |
| RNF04 | Caso haja envio de localização em tempo real, a transmissão deve ter latência aceitável (poucos segundos), via WebSocket ou polling simples. |
| RNF05 | O sistema deve suportar alunos cadastrados via API externa e manualmente de forma transparente para os módulos de rota e otimização. |
| RNF06 | Dados sensíveis de alunos e responsáveis devem ser protegidos (LGPD): criptografia de senha do gestor, HTTPS obrigatório, mesmo sem múltiplos perfis de acesso. |
| RNF07 | O histórico de posições (`vehicle_positions`) deve suportar volume de escrita sem degradar performance (particionamento por data, se necessário). |
| RNF08 | O sistema deve ter autonomia de configuração pelo gestor, sem dependência de suporte técnico para ajustes operacionais do dia a dia. |
| RNF09 | A API deve ser documentada (OpenAPI/Swagger, nativo do FastAPI). |
| RNF10 | A arquitetura deve permanecer simples — evitar complexidade desnecessária (ex: múltiplos apps, filas complexas) dado o escopo enxuto do projeto. |

---

## 5. Fluxo da aplicação

### 5.1 Configuração inicial (gestor)
1. Gestor cria conta e acessa o sistema.
2. Configura a localização da escola (`school_location`).
3. Define os parâmetros de otimização (`optimization_settings`).
4. Cadastra veículos.
5. Cadastra motoristas e vincula a veículos.

### 5.2 Entrada de alunos
- **Manual**: gestor ou responsável cadastra o aluno informando endereço → sistema geocodifica o endereço em lat/lng → aluno salvo com `source = manual`.
- **Via API**: job assíncrono periódico consulta a API externa → faz upsert nos alunos com `source = api` → geocodifica se necessário → atualiza `synced_at`. Alunos manuais nunca são sobrescritos por esse job.

### 5.3 Disparo da otimização de rota
1. Gestor seleciona o turno (manhã, tarde ou integral).
2. Sistema reúne os alunos ativos daquele turno.
3. Sistema reúne os veículos disponíveis com seus respectivos motoristas.
4. Sistema envia os dados (alunos, veículos, ponto fixo da escola, parâmetros de otimização) para a fila assíncrona.
5. O worker executa o solver de roteirização (ex: OR-Tools) e calcula a sequência ótima de paradas por veículo.
6. Resultado é salvo em `routes` e `route_stops`.
7. Gestor pode revisar e ajustar manualmente antes de confirmar (opcional).

### 5.4 Execução da rota
1. Gestor (ou uma tela simplificada acessada sem login, ex: link enviado ao celular do motorista) inicia a rota — status muda para `em_andamento`.
2. Se houver envio de localização (via link simples no celular do motorista, sem necessidade de conta), o sistema grava em `vehicle_positions` e atualiza `vehicles.last_lat/last_lng`.
3. Ao chegar em cada ponto, o status do aluno é marcado como `embarcado` ou `nao_compareceu` (pelo gestor ou pela mesma tela simplificada do motorista).

### 5.5 Conclusão da rota
1. Veículo chega ao ponto final.
2. Rota é finalizada — status muda para `concluida`.
3. Dados ficam disponíveis para relatórios: pontualidade, distância percorrida, ausências, tempo total.

### 5.6 Fluxo de exceção
- Se um aluno não é encontrado no ponto de embarque, marca-se `nao_compareceu` e a rota segue sem recalcular (a menos que configurado para recalcular automaticamente).
- Se um veículo tem problema durante a rota, o gestor pode reatribuir os alunos restantes a outro veículo disponível (fluxo manual ou re-otimização parcial).

> **Nota de escopo:** como não há autenticação de motorista/responsável, a "visão de execução da rota" pode ser resolvida com uma URL simples e não-listada (ex: `/rota/{route_id}/track`) que qualquer um com o link acessa — suficiente para o escopo enxuto do projeto, sem exigir criação de contas.

---

## 6. Fora de escopo (a definir futuramente)

- Multi-tenant (suporte a múltiplas escolas na mesma instância)
- Pagamento/cobrança de mensalidades de transporte
- Integração com sistemas de frequência escolar
- Recalculo automático de rota em tempo real por trânsito