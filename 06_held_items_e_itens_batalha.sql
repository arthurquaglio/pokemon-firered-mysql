-- =============================================================================
-- 06_held_items_e_itens_batalha.sql
-- Modelagem e Carga de Held Items (Itens Segurados) e Itens de Batalha (Mochila)
-- =============================================================================
USE pokemon_firered;

-- 1. Catálogo de Held Items (Itens Segurados pelo Pokémon)
CREATE TABLE IF NOT EXISTS held_item (
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

-- 2. Catálogo de Itens de Batalha / Inventário (Mochila)
CREATE TABLE IF NOT EXISTS item_inventario (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(150) NOT NULL,
    efeito_tipo ENUM('CURA_HP', 'REVIVE', 'RESTAURA_PP') NOT NULL,
    valor_efeito INT NOT NULL,
    eh_porcentagem BOOLEAN NOT NULL DEFAULT FALSE
);

-- 3. Mochila de Itens do Treinador
CREATE TABLE IF NOT EXISTS treinador_mochila (
    id INT AUTO_INCREMENT PRIMARY KEY,
    treinador_id INT NOT NULL,
    item_id INT NOT NULL,
    quantidade INT NOT NULL DEFAULT 1,
    CONSTRAINT fk_tm_treinador FOREIGN KEY (treinador_id) REFERENCES treinador(id) ON DELETE CASCADE,
    CONSTRAINT fk_tm_item FOREIGN KEY (item_id) REFERENCES item_inventario(id),
    UNIQUE KEY uq_treinador_item (treinador_id, item_id)
);

-- 4. Adicionar coluna held_item_id em pokemon_instancia se não existir
DROP PROCEDURE IF EXISTS sp_adicionar_coluna_held_item;
DELIMITER $$
CREATE PROCEDURE sp_adicionar_coluna_held_item()
BEGIN
    DECLARE v_existe INT;
    SELECT COUNT(*) INTO v_existe FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA='pokemon_firered' AND TABLE_NAME='pokemon_instancia' AND COLUMN_NAME='held_item_id';
    
    IF v_existe = 0 THEN
        ALTER TABLE pokemon_instancia 
        ADD COLUMN held_item_id INT NULL AFTER apelido,
        ADD CONSTRAINT fk_pi_held_item FOREIGN KEY (held_item_id) REFERENCES held_item(id);
    END IF;
END$$
DELIMITER ;
CALL sp_adicionar_coluna_held_item();
DROP PROCEDURE sp_adicionar_coluna_held_item;

-- 5. Carga de Held Items Oficiais de Gen 3
INSERT INTO held_item (id, nome, descricao, efeito_tipo, param_tipo_id, valor_multiplicador, valor_fixo, eh_consumivel) VALUES
(1, 'Leftovers', 'Restaura 1/16 do HP máximo ao final de cada turno.', 'CURA_TURNO', NULL, 0.06, 0, FALSE),
(2, 'Choice Band', 'Aumenta o Ataque Físico em 50%.', 'BOOST_ATK_FISICO', NULL, 1.50, 0, FALSE),
(3, 'Charcoal', 'Aumenta o poder dos golpes tipo Fogo em 10%.', 'BOOST_TIPO', 10, 1.10, 0, FALSE),
(4, 'Mystic Water', 'Aumenta o poder dos golpes tipo Água em 10%.', 'BOOST_TIPO', 11, 1.10, 0, FALSE),
(5, 'Miracle Seed', 'Aumenta o poder dos golpes tipo Planta em 10%.', 'BOOST_TIPO', 12, 1.10, 0, FALSE),
(6, 'Magnet', 'Aumenta o poder dos golpes tipo Elétrico em 10%.', 'BOOST_TIPO', 13, 1.10, 0, FALSE),
(7, 'Sitrus Berry', 'Restaura 30 de HP quando a vida cai abaixo de 50%.', 'CURA_HP_CRITICO', NULL, 1.00, 30, TRUE),
(8, 'Focus Band', 'Dá 10% de chance de sobreviver com 1 HP a um golpe fatal.', 'SOBREVIVENCIA_FATAL', NULL, 1.00, 1, FALSE)
ON DUPLICATE KEY UPDATE nome = VALUES(nome), descricao = VALUES(descricao);

-- 6. Carga de Itens de Inventário da Mochila
INSERT INTO item_inventario (id, nome, descricao, efeito_tipo, valor_efeito, eh_porcentagem) VALUES
(1, 'Potion', 'Restaura 20 de HP de um pokémon.', 'CURA_HP', 20, FALSE),
(2, 'Super Potion', 'Restaura 50 de HP de um pokémon.', 'CURA_HP', 50, FALSE),
(3, 'Hyper Potion', 'Restaura 200 de HP de um pokémon.', 'CURA_HP', 200, FALSE),
(4, 'Max Potion', 'Restaura 100% do HP de um pokémon.', 'CURA_HP', 100, TRUE),
(5, 'Revive', 'Revive um pokémon desmaiado com 50% de seu HP máximo.', 'REVIVE', 50, TRUE),
(6, 'Max Revive', 'Revive um pokémon desmaiado com 100% de seu HP máximo.', 'REVIVE', 100, TRUE),
(7, 'Ether', 'Restaura 10 PP de um movimento selecionado.', 'RESTAURA_PP', 10, FALSE),
(8, 'Max Elixir', 'Restaura todos os PPs de todos os movimentos.', 'RESTAURA_PP', 99, FALSE)
ON DUPLICATE KEY UPDATE nome = VALUES(nome), descricao = VALUES(descricao);

-- 7. Distribuir Itens para o Red (Jogador 1)
INSERT INTO treinador_mochila (treinador_id, item_id, quantidade) VALUES
(1, 2, 5), -- 5 Super Potions
(1, 3, 3), -- 3 Hyper Potions
(1, 5, 2), -- 2 Revives
(1, 7, 2)  -- 2 Ethers
ON DUPLICATE KEY UPDATE quantidade = VALUES(quantidade);
