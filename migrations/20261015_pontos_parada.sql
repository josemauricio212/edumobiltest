-- Executar uma vez em bancos existentes quando AUTO_CREATE_TABLES=false.
-- Para ambiente de desenvolvimento com AUTO_CREATE_TABLES=true,
-- o SQLAlchemy criará a nova tabela automaticamente na inicialização.
CREATE TABLE IF NOT EXISTS rota_pontos_parada (
    id UUID PRIMARY KEY,
    rota_id UUID NOT NULL REFERENCES rotas(id) ON DELETE CASCADE,
    ordem INTEGER NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    aluno_ids JSON NOT NULL
);

CREATE INDEX IF NOT EXISTS ix_rota_pontos_parada_rota_id
    ON rota_pontos_parada (rota_id);
