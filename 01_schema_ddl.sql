-- =============================================================================
-- PROJETO BANCO DE DADOS: POKÉMON FIRE RED ENGINE (GEN 3 / GBA)
-- Sistema completo de mecânicas de batalha em turnos, Pokédex de Kanto (1-151),
-- IVs e EVs, matriz de eficácia de tipos, aprendizado de golpes e evolução.
-- =============================================================================

DROP DATABASE IF EXISTS pokemon_firered;
CREATE DATABASE pokemon_firered CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE pokemon_firered;

-- -----------------------------------------------------------------------------
-- 1. TABELA DE TIPOS ELEMENTAIS (17 tipos da Gen 3)
-- -----------------------------------------------------------------------------
CREATE TABLE tipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(20) NOT NULL UNIQUE
);

-- -----------------------------------------------------------------------------
-- 2. MATRIZ DE EFICÁCIA DE TIPOS (Modificador de dano elemental: 0.0, 0.5, 1.0, 2.0)
-- -----------------------------------------------------------------------------
CREATE TABLE tipo_eficacia (
    tipo_ataque_id INT NOT NULL,
    tipo_defesa_id INT NOT NULL,
    multiplicador DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    PRIMARY KEY (tipo_ataque_id, tipo_defesa_id),
    CONSTRAINT fk_te_ataque FOREIGN KEY (tipo_ataque_id) REFERENCES tipo(id) ON DELETE CASCADE,
    CONSTRAINT fk_te_defesa FOREIGN KEY (tipo_defesa_id) REFERENCES tipo(id) ON DELETE CASCADE
);

-- -----------------------------------------------------------------------------
-- 3. ESPÉCIE POKÉMON (Pokédex 1 a 151 com Stats Base, Tipos, EXP Yield)
-- -----------------------------------------------------------------------------
CREATE TABLE especie_pokemon (
    id_pokedex INT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    tipo1_id INT NOT NULL,
    tipo2_id INT NULL,
    hp_base INT NOT NULL,
    ataque_base INT NOT NULL,
    defesa_base INT NOT NULL,
    sp_ataque_base INT NOT NULL,
    sp_defesa_base INT NOT NULL,
    velocidade_base INT NOT NULL,
    exp_base INT NOT NULL DEFAULT 64, -- Base EXP Yield para cálculo de XP
    ev_hp_yield INT NOT NULL DEFAULT 0,
    ev_ataque_yield INT NOT NULL DEFAULT 0,
    ev_defesa_yield INT NOT NULL DEFAULT 0,
    ev_sp_ataque_yield INT NOT NULL DEFAULT 0,
    ev_sp_defesa_yield INT NOT NULL DEFAULT 0,
    ev_velocidade_yield INT NOT NULL DEFAULT 0,
    CONSTRAINT fk_esp_tipo1 FOREIGN KEY (tipo1_id) REFERENCES tipo(id),
    CONSTRAINT fk_esp_tipo2 FOREIGN KEY (tipo2_id) REFERENCES tipo(id)
);

-- -----------------------------------------------------------------------------
-- 4. EVOLUÇÕES (Por nível, pedras evolutivas, trocas e felicidade)
-- -----------------------------------------------------------------------------
CREATE TABLE evolucao (
    id INT AUTO_INCREMENT PRIMARY KEY,
    especie_origem_id INT NOT NULL,
    especie_destino_id INT NOT NULL,
    metodo_evolucao ENUM('LEVEL_UP', 'USE_ITEM', 'TRADE', 'HAPPINESS') NOT NULL,
    parametro VARCHAR(50) NULL, -- ex: '16' (nível), 'Fire Stone', 'Moon Stone'
    CONSTRAINT fk_evo_origem FOREIGN KEY (especie_origem_id) REFERENCES especie_pokemon(id_pokedex),
    CONSTRAINT fk_evo_destino FOREIGN KEY (especie_destino_id) REFERENCES especie_pokemon(id_pokedex)
);

-- -----------------------------------------------------------------------------
-- 5. MOVIMENTOS / GOLPES
-- -----------------------------------------------------------------------------
CREATE TABLE movimento (
    id INT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    tipo_id INT NOT NULL,
    categoria ENUM('Physical', 'Special', 'Status') NOT NULL,
    poder INT NULL, -- NULL para golpes de status
    precisao INT NULL, -- NULL para golpes que não erram (Swift, etc.)
    pp_maximo INT NOT NULL,
    CONSTRAINT fk_mov_tipo FOREIGN KEY (tipo_id) REFERENCES tipo(id)
);

-- -----------------------------------------------------------------------------
-- 6. APRENDIZADO DE MOVIMENTOS POR NÍVEL
-- -----------------------------------------------------------------------------
CREATE TABLE especie_movimento_nivel (
    id INT AUTO_INCREMENT PRIMARY KEY,
    especie_id INT NOT NULL,
    movimento_id INT NOT NULL,
    nivel_aprendizado INT NOT NULL,
    CONSTRAINT fk_emn_esp FOREIGN KEY (especie_id) REFERENCES especie_pokemon(id_pokedex),
    CONSTRAINT fk_emn_mov FOREIGN KEY (movimento_id) REFERENCES movimento(id),
    UNIQUE KEY uq_esp_mov_lvl (especie_id, movimento_id, nivel_aprendizado)
);

-- -----------------------------------------------------------------------------
-- 7. MAPAS / CIDADES / ROTAS DE KANTO
-- -----------------------------------------------------------------------------
CREATE TABLE mapa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(80) NOT NULL UNIQUE,
    tipo_local ENUM('Cidade', 'Rota', 'Floresta', 'Caverna', 'Predio', 'Mar', 'Ginásio') NOT NULL
);

-- -----------------------------------------------------------------------------
-- 8. ENCONTROS SELVAGENS POR MAPA
-- -----------------------------------------------------------------------------
CREATE TABLE encontro_mapa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    mapa_id INT NOT NULL,
    especie_id INT NOT NULL,
    nivel_min INT NOT NULL,
    nivel_max INT NOT NULL,
    taxa_chance DECIMAL(5,2) NOT NULL, -- Porcentagem de chance de aparição (ex: 25.00%)
    CONSTRAINT fk_enc_mapa FOREIGN KEY (mapa_id) REFERENCES mapa(id),
    CONSTRAINT fk_enc_especie FOREIGN KEY (especie_id) REFERENCES especie_pokemon(id_pokedex)
);

-- -----------------------------------------------------------------------------
-- 9. TREINADORES (Jogador ou NPCs/Líderes)
-- -----------------------------------------------------------------------------
CREATE TABLE treinador (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL,
    classe VARCHAR(40) NOT NULL DEFAULT 'Treinador', -- ex: 'Campeão', 'Líder de Ginásio', 'Youngster', 'Jogador'
    eh_jogador BOOLEAN NOT NULL DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 10. HELD ITEMS (Itens Equipados / Segurados pelo Pokémon)
-- -----------------------------------------------------------------------------
CREATE TABLE held_item (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(150) NOT NULL,
    efeito_tipo ENUM('BOOST_TIPO', 'BOOST_ATK_FISICO', 'CURA_TURNO', 'CURA_HP_CRITICO', 'SOBREVIVENCIA_FATAL') NOT NULL,
    param_tipo_id INT NULL,
    valor_multiplicador DECIMAL(4,2) NOT NULL DEFAULT 1.00,
    valor_fixo INT NOT NULL DEFAULT 0,
    eh_consumivel BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_hi_tipo FOREIGN KEY (param_tipo_id) REFERENCES tipo(id)
);

-- -----------------------------------------------------------------------------
-- 11. ITENS DE INVENTÁRIO (Mochila de Batalha)
-- -----------------------------------------------------------------------------
CREATE TABLE item_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(150) NOT NULL,
    efeito_tipo ENUM('CURA_HP', 'REVIVE', 'RESTAURA_PP') NOT NULL,
    valor_efeito INT NOT NULL,
    eh_porcentagem BOOLEAN NOT NULL DEFAULT FALSE
);

-- -----------------------------------------------------------------------------
-- 12. MOCHILA DO TREINADOR (Inventário de Itens de Batalha)
-- -----------------------------------------------------------------------------
CREATE TABLE treinador_mochila (
    id INT AUTO_INCREMENT PRIMARY KEY,
    treinador_id INT NOT NULL,
    item_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_tm_treinador FOREIGN KEY (treinador_id) REFERENCES treinador(id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_item FOREIGN KEY (item_id) REFERENCES item_inventario(id),
    UNIQUE KEY uq_treinador_item (treinador_id, item_id)
);

-- -----------------------------------------------------------------------------
-- 13. INSTÂNCIAS DE POKÉMON (Atributos individuais, IVs [0-31], EVs [0-255], Nível, XP)
-- -----------------------------------------------------------------------------
CREATE TABLE pokemon_instancia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    treinador_id INT NOT NULL,
    especie_id INT NOT NULL,
    apelido VARCHAR(50) NULL,
    held_item_id INT NULL,
    nivel INT NOT NULL DEFAULT 5,
    experiencia_atual INT NOT NULL DEFAULT 0,
    posicao_time INT NOT NULL DEFAULT 1, -- 1 a 6 no time, > 6 no PC (Box)
    esta_desmaiado BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Atributos Atuais em Combate
    hp_atual INT NOT NULL,
    hp_max INT NOT NULL,
    ataque INT NOT NULL,
    defesa INT NOT NULL,
    sp_ataque INT NOT NULL,
    sp_defesa INT NOT NULL,
    velocidade INT NOT NULL,

    -- Valores Individuais (IVs: 0 a 31)
    iv_hp TINYINT NOT NULL DEFAULT 15,
    iv_ataque TINYINT NOT NULL DEFAULT 15,
    iv_defesa TINYINT NOT NULL DEFAULT 15,
    iv_sp_ataque TINYINT NOT NULL DEFAULT 15,
    iv_sp_defesa TINYINT NOT NULL DEFAULT 15,
    iv_velocidade TINYINT NOT NULL DEFAULT 15,

    -- Pontos de Esforço (EVs: 0 a 255, soma máxima 510)
    ev_hp SMALLINT NOT NULL DEFAULT 0,
    ev_ataque SMALLINT NOT NULL DEFAULT 0,
    ev_defesa SMALLINT NOT NULL DEFAULT 0,
    ev_sp_ataque SMALLINT NOT NULL DEFAULT 0,
    ev_sp_defesa SMALLINT NOT NULL DEFAULT 0,
    ev_velocidade SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT fk_pok_treinador FOREIGN KEY (treinador_id) REFERENCES treinador(id) ON DELETE CASCADE,
    CONSTRAINT fk_pok_especie FOREIGN KEY (especie_id) REFERENCES especie_pokemon(id_pokedex),
    CONSTRAINT fk_pi_held_item FOREIGN KEY (held_item_id) REFERENCES held_item(id)
);

-- -----------------------------------------------------------------------------
-- 14. GOLPES ATIVOS DO POKÉMON (Até 4 movimentos por instância)
-- -----------------------------------------------------------------------------
CREATE TABLE pokemon_movimento_ativo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pokemon_instancia_id INT NOT NULL,
    movimento_id INT NOT NULL,
    slot_numero TINYINT NOT NULL, -- 1, 2, 3 ou 4
    pp_atual INT NOT NULL,
    CONSTRAINT fk_pma_instancia FOREIGN KEY (pokemon_instancia_id) REFERENCES pokemon_instancia(id) ON DELETE CASCADE,
    CONSTRAINT fk_pma_movimento FOREIGN KEY (movimento_id) REFERENCES movimento(id),
    UNIQUE KEY uq_instancia_slot (pokemon_instancia_id, slot_numero),
    CHECK (slot_numero BETWEEN 1 AND 4)
);

-- -----------------------------------------------------------------------------
-- 12. BATALHAS (Simulação 6v6 por turnos)
-- -----------------------------------------------------------------------------
CREATE TABLE batalha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    treinador_jogador_id INT NOT NULL,
    treinador_oponente_id INT NOT NULL,
    data_inicio DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status ENUM('EM_ANDAMENTO', 'VITORIA_JOGADOR', 'DERROTA_JOGADOR', 'EMPATE') NOT NULL DEFAULT 'EM_ANDAMENTO',
    pokemon_ativo_jogador_id INT NULL,
    pokemon_ativo_oponente_id INT NULL,
    vencedor_id INT NULL,
    turno_atual INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_bat_jogador FOREIGN KEY (treinador_jogador_id) REFERENCES treinador(id),
    CONSTRAINT fk_bat_oponente FOREIGN KEY (treinador_oponente_id) REFERENCES treinador(id),
    CONSTRAINT fk_bat_vencedor FOREIGN KEY (vencedor_id) REFERENCES treinador(id),
    CONSTRAINT fk_bat_pok_jog FOREIGN KEY (pokemon_ativo_jogador_id) REFERENCES pokemon_instancia(id),
    CONSTRAINT fk_bat_pok_opo FOREIGN KEY (pokemon_ativo_oponente_id) REFERENCES pokemon_instancia(id)
);

-- -----------------------------------------------------------------------------
-- 13. LOG DE TURNOS E EVENTOS DA BATALHA
-- -----------------------------------------------------------------------------
CREATE TABLE log_batalha (
    id INT AUTO_INCREMENT PRIMARY KEY,
    batalha_id INT NOT NULL,
    numero_turno INT NOT NULL,
    ordem_acao INT NOT NULL, -- 1 = primeiro a atacar, 2 = segundo a atacar
    pokemon_atacante_id INT NOT NULL,
    pokemon_defensor_id INT NOT NULL,
    movimento_id INT NULL,
    dano_causado INT NOT NULL DEFAULT 0,
    houve_acerto BOOLEAN NOT NULL DEFAULT TRUE,
    multiplicador_tipo DECIMAL(3,2) NOT NULL DEFAULT 1.00,
    foi_critico BOOLEAN NOT NULL DEFAULT FALSE,
    hp_restante_defensor INT NOT NULL,
    mensagem TEXT NOT NULL,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_lb_batalha FOREIGN KEY (batalha_id) REFERENCES batalha(id) ON DELETE CASCADE,
    CONSTRAINT fk_lb_atacante FOREIGN KEY (pokemon_atacante_id) REFERENCES pokemon_instancia(id),
    CONSTRAINT fk_lb_defensor FOREIGN KEY (pokemon_defensor_id) REFERENCES pokemon_instancia(id)
);
