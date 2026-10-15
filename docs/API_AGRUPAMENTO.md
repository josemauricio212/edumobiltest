# Contrato de agrupamento de alunos — EduMobil

## O que mudou

- `POST /api/rotas`: cria a rota, suas `paradas` individuais e seus
  `pontos_parada` compartilhados, já persistidos (sem depender do OSRM).
- `PATCH /api/rotas/{id}` quando `aluno_ids` é modificado: refaz os
  agrupamentos e invalida métricas antigas da rota.
- `POST /api/rotas/{id}/agrupar`: recalcula e salva as paradas de
  uma rota planejada, mesmo que o OSRM esteja indisponível.
- `POST /api/rotas/{id}/otimizar`: envia ao OSRM **um ponto por grupo**
  mais a escola e persiste a ordem, distância, duração e geometria.
- `GET /api/rotas` e `GET /api/rotas/{id}`: retornam
  `pontos_parada` sem retirar os campos existentes.

Todos os endpoints de escrita preservam o controle de acesso existente:
apenas `chefetransporte` pode operá-los.

## Resposta de exemplo (trecho)

```json
{
  "id": "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
  "paradas": [
    {
      "id": "parada-uuid",
      "ordem": 1,
      "status": "pendente",
      "aluno": {"id": "aluno-uuid-1", "nome": "Aluno A"}
    }
  ],
  "pontos_parada": [
    {
      "id": "ponto-uuid",
      "ordem": 1,
      "latitude": -5.08001,
      "longitude": -42.80001,
      "aluno_ids": ["aluno-uuid-1", "aluno-uuid-2"]
    }
  ]
}
```

O exemplo é ilustrativo: os UUIDs abreviados não devem ser usados em requisições.

### Uso pelo frontend

- Renderizar **marcadores** e sequência da rota a partir de
  `pontos_parada`. A mesma parada pode reunir vários alunos.
- Usar `aluno_ids` para vincular os participantes a cada ponto
  (`paradas[].aluno.id` fornece as informações individuais).
- Continuar atualizando embarque/ausência por `paradas[].id`, nunca
  por `pontos_parada[].id`. Não houve alteração do contrato de embarque.
- Se uma rota antiga vier com `pontos_parada: []`, executar
  `POST /api/rotas/{id}/agrupar` antes de exibir agrupamentos.
- A localização sugerida é um endereço existente de um aluno, limitada
  a 250 m em linha reta dos outros membros; **não** comprova que exista
  calçada, travessia ou local seguro para embarque. A validação operacional
  de cada ponto é necessária antes do uso real.

## Banco existente

Com `AUTO_CREATE_TABLES=true`, a tabela nova é criada no startup em desenvolvimento.
Em ambientes sem criação automática, aplicar `migrations/20261015_pontos_parada.sql`
antes de iniciar a versão atualizada. A alteração é aditiva: nenhuma
coluna de `rota_paradas` ou `rotas` é removida ou modificada.

## Dependências e testes

O agrupamento usa apenas a biblioteca padrão (Haversine), **não importa
scikit-learn**. Portanto `pyproject.toml` e `uv.lock` continuam consistentes.
Se houver import de `scikit-learn` em uma outra branch, remova ou substitua
esse código durante a integração; caso contrário, o erro de inicialização
pode persistir naquela branch.

```bash
uv sync --dev
uv run pytest tests/test_agrupamento.py
uv run python -c "from app.main import app; print(app.title)"
```

Antes de liberar o frontend, validar também o ciclo real com PostgreSQL e OSRM
mockado: criar 3 alunos próximos/distantes, criar rota, ler agrupamentos,
chamar `/otimizar`, consultar novamente e confirmar grupos e ordens persistidos.
