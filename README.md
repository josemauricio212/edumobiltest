# Sistema de Gerenciamento de Transporte Escolar

O **EduMobil** é uma solução voltada para a organização, 
cadastro e otimização operacional do transporte escolar. O sistema permite registrar motoristas, 
veículos e alunos, além de calcular rotas otimizadas e provendo autonomia do usuario para definir paradas e o veiculo a ser utilizado,
estimativa de distância, tempo e custos de combustível.

---

## Visão Geral

O projeto é estruturado separando estritamente **dados cadastrais** de **dados operacionais**:
- **Dados Cadastrais:** Registro de motoristas, veículos e alunos.
- **Dados Operacionais:** Rotas, ordenação de paradas, associação de alunos por trajeto,
cálculo de distância, tempo e custos de combustível.


---

## Fluxo de Funcionamento

1. **Cadastros Iniciais:** Registro de motoristas, veículos, e alunos (com latitude e longitude).
2. **Seleção de Alunos:** Definição dos alunos que participarão da rota.
3. **Otimização de Rota:** O sistema processa as coordenadas, determina o melhor caminho baseado na localização de cada aluno e o consumo:
   - Distância total.
   - Tempo estimado.
   - Litros e custo de combustível.
4. **Usuário pode definir paradas e veículo á ser usado**

---

## Estrutura do Projeto

A organização dos diretórios e arquivos no repositório segue o padrão abaixo:

```text
.
├── .vscode/                 # Configurações do ambiente de desenvolvimento no VS Code
├── src/                     # Código-fonte principal da aplicação
├── .env                     # Variáveis de ambiente (local/segredo - não versionado)
├── .env.example             # Exemplo e modelo das variáveis de ambiente necessárias
├── .gitignore               # Arquivos e pastas ignorados pelo Git
├── .pre-commit-config.yaml  # Hooks do pre-commit (formatadores, linters e checagens automáticas)
├── .python-version          # Versão do Python utilizada no projeto (ex: pyenv/uv)
├── README.md                # Documentação principal do projeto
├── docker-compose.yml       # Orquestração dos serviços Docker (ex: Banco de Dados, Aplicação)
├── pyproject.toml           # Configuração do projeto Python e suas dependências
└── uv.lock                  # Lockfile para gerenciamento preciso de dependências via uv

```

### Tecnologias e Ferramentas

* **Linguagem & Pacotes:** Desenvolvido em **Python**, gerenciado via **[uv](https://github.com/astral-sh/uv)** (`pyproject.toml` / `uv.lock`).
* **Containerização:** **Docker Compose** para orquestração do ambiente de desenvolvimento e banco de dados.
* **Qualidade de Código:** **Pre-commit hooks** configurados para garantia de padrão de código e checagens automáticas antes dos commits.
* **Ambiente:** Gestão de variáveis via `.env`.

---

## Modelagem do Banco de Dados

A versão MVP foi projetada contendo **6 tabelas essenciais**:

### 1. `veiculos`

Armazena os veículos utilizados no transporte.

* `id` (UUID/INT) - PK
* `placa` (VARCHAR)
* `modelo` (VARCHAR) / `marca` (VARCHAR) / `ano` (INT) / `cor` (VARCHAR)
* `capacidade` (INT) - Quantidade máxima de passageiros
* `combustivel` (VARCHAR) - Tipo de combustível
* `consumo_medio` (DECIMAL) - Km por litro
* `status` (VARCHAR) - Ativo, manutenção, inativo
* `created_at` / `updated_at` (DATETIME)

### 2. `motoristas`

Armazena o cadastro dos motoristas. *(A relação com veículos ocorre na rota)*.

* `id` (UUID/INT) - PK
* `nome` (VARCHAR) / `cpf` (VARCHAR)
* `telefone` (VARCHAR) / `email` (VARCHAR)
* `cnh` (VARCHAR) / `categoria_cnh` (VARCHAR) / `validade_cnh` (DATE)
* `endereco` (VARCHAR)
* `status` (VARCHAR) - Ativo/Inativo
* `created_at` / `updated_at` (DATETIME)

### 3. `alunos`

Contém os dados dos estudantes e suas coordenadas geográficas para cálculo do trajeto.

* `id` (UUID/INT) - PK
* `nome` (VARCHAR) / `data_nascimento` (DATE)
* `matricula` (VARCHAR)
* `escola_id` (FK -> `escolas.id`)
* `serie` (VARCHAR) / `turno` (VARCHAR)
* `endereco` (VARCHAR)
* `latitude` (DECIMAL) / `longitude` (DECIMAL)
* `status` (VARCHAR) - Ativo/Inativo
* `created_at` / `updated_at` (DATETIME)

> **Nota sobre Alunos:** É fundamental armazenar a latitude e longitude juntamente com o endereço textual para
> viabilizar a integração direta com APIs de mapas.

### 4. `rotas`

Centraliza a operação, associando motorista, veículo, escola e parâmetros de custo/tempo.

* `id` (UUID/INT) - PK
* `nome` (VARCHAR)
* `motorista_id` (FK -> `motoristas.id`)
* `veiculo_id` (FK -> `veiculos.id`)
* `escola_id` (FK -> `escolas.id`)
* `tipo` (VARCHAR) - Ida / Volta
* `data` (DATE) / `horario_saida` (TIME) / `horario_chegada` (TIME)
* `distancia_total` (DECIMAL) - Em km
* `tempo_estimado` (INT) - Em minutos
* `litros_estimados` (DECIMAL) / `preco_combustivel` (DECIMAL) / `custo_combustivel` (DECIMAL)
* `status` (VARCHAR) - Planejada, em andamento, concluída
* `created_at` / `updated_at` (DATETIME)

### 6. `rota_alunos`

Tabela associativa entre rotas e alunos, definindo a ordem de parada e acompanhamento de embarque.

---

## 7. `paradas`


