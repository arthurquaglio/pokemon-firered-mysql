USE pokemon_firered;

-- 1. Inserir Tipos Canônicos (Gen 3)
INSERT INTO tipo (id, nome) VALUES
(1, 'Normal'),
(2, 'Fighting'),
(3, 'Flying'),
(4, 'Poison'),
(5, 'Ground'),
(6, 'Rock'),
(7, 'Bug'),
(8, 'Ghost'),
(9, 'Steel'),
(10, 'Fire'),
(11, 'Water'),
(12, 'Grass'),
(13, 'Electric'),
(14, 'Psychic'),
(15, 'Ice'),
(16, 'Dragon'),
(17, 'Dark');

-- 2. Tabela de Eficácia de Tipos (Gen 3: 17 Tipos)
-- Multiplicador padrão é 1.0 (neutro). Inserimos apenas as exceções (0x, 0.5x, 2.0x)

-- Normal
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(1, 6, 0.50),  -- Normal vs Rock
(1, 8, 0.00),  -- Normal vs Ghost
(1, 9, 0.50);  -- Normal vs Steel

-- Fighting
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(2, 1, 2.00),  -- Fighting vs Normal
(2, 3, 0.50),  -- Fighting vs Flying
(2, 4, 0.50),  -- Fighting vs Poison
(2, 6, 2.00),  -- Fighting vs Rock
(2, 7, 0.50),  -- Fighting vs Bug
(2, 8, 0.00),  -- Fighting vs Ghost
(2, 9, 2.00),  -- Fighting vs Steel
(2, 14, 0.50), -- Fighting vs Psychic
(2, 15, 2.00), -- Fighting vs Ice
(2, 17, 2.00); -- Fighting vs Dark

-- Flying
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(3, 2, 2.00),  -- Flying vs Fighting
(3, 6, 0.50),  -- Flying vs Rock
(3, 7, 2.00),  -- Flying vs Bug
(3, 9, 0.50),  -- Flying vs Steel
(3, 12, 2.00), -- Flying vs Grass
(3, 13, 0.50); -- Flying vs Electric

-- Poison
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(4, 4, 0.50),  -- Poison vs Poison
(4, 5, 0.50),  -- Poison vs Ground
(4, 6, 0.50),  -- Poison vs Rock
(4, 8, 0.50),  -- Poison vs Ghost
(4, 9, 0.00),  -- Poison vs Steel
(4, 12, 2.00); -- Poison vs Grass

-- Ground
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(5, 3, 0.00),  -- Ground vs Flying
(5, 4, 2.00),  -- Ground vs Poison
(5, 6, 2.00),  -- Ground vs Rock
(5, 7, 0.50),  -- Ground vs Bug
(5, 9, 2.00),  -- Ground vs Steel
(5, 10, 2.00), -- Ground vs Fire
(5, 12, 0.50), -- Ground vs Grass
(5, 13, 2.00); -- Ground vs Electric

-- Rock
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(6, 2, 0.50),  -- Rock vs Fighting
(6, 3, 2.00),  -- Rock vs Flying
(6, 5, 0.50),  -- Rock vs Ground
(6, 7, 2.00),  -- Rock vs Bug
(6, 9, 0.50),  -- Rock vs Steel
(6, 10, 2.00), -- Rock vs Fire
(6, 15, 2.00); -- Rock vs Ice

-- Bug
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(7, 2, 0.50),  -- Bug vs Fighting
(7, 3, 0.50),  -- Bug vs Flying
(7, 4, 0.50),  -- Bug vs Poison
(7, 8, 0.50),  -- Bug vs Ghost
(7, 9, 0.50),  -- Bug vs Steel
(7, 10, 0.50), -- Bug vs Fire
(7, 12, 2.00), -- Bug vs Grass
(7, 14, 2.00), -- Bug vs Psychic
(7, 17, 2.00); -- Bug vs Dark

-- Ghost
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(8, 1, 0.00),  -- Ghost vs Normal
(8, 8, 2.00),  -- Ghost vs Ghost
(8, 9, 0.50),  -- Ghost vs Steel
(8, 14, 2.00), -- Ghost vs Psychic
(8, 17, 0.50); -- Ghost vs Dark

-- Steel
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(9, 6, 2.00),  -- Steel vs Rock
(9, 9, 0.50),  -- Steel vs Steel
(9, 10, 0.50), -- Steel vs Fire
(9, 11, 0.50), -- Steel vs Water
(9, 13, 0.50), -- Steel vs Electric
(9, 15, 2.00); -- Steel vs Ice

-- Fire
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(10, 6, 0.50),  -- Fire vs Rock
(10, 7, 2.00),  -- Fire vs Bug
(10, 9, 2.00),  -- Fire vs Steel
(10, 10, 0.50), -- Fire vs Fire
(10, 11, 0.50), -- Fire vs Water
(10, 12, 2.00), -- Fire vs Grass
(10, 15, 2.00), -- Fire vs Ice
(10, 16, 0.50); -- Fire vs Dragon

-- Water
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(11, 5, 2.00),  -- Water vs Ground
(11, 6, 2.00),  -- Water vs Rock
(11, 10, 2.00), -- Water vs Fire
(11, 11, 0.50), -- Water vs Water
(11, 12, 0.50), -- Water vs Grass
(11, 16, 0.50); -- Water vs Dragon

-- Grass
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(12, 3, 0.50),  -- Grass vs Flying
(12, 4, 0.50),  -- Grass vs Poison
(12, 5, 2.00),  -- Grass vs Ground
(12, 6, 2.00),  -- Grass vs Rock
(12, 7, 0.50),  -- Grass vs Bug
(12, 9, 0.50),  -- Grass vs Steel
(12, 10, 0.50), -- Grass vs Fire
(12, 11, 2.00), -- Grass vs Water
(12, 12, 0.50), -- Grass vs Grass
(12, 16, 0.50); -- Grass vs Dragon

-- Electric
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(13, 3, 2.00),  -- Electric vs Flying
(13, 5, 0.00),  -- Electric vs Ground
(13, 11, 2.00), -- Electric vs Water
(13, 12, 0.50), -- Electric vs Grass
(13, 13, 0.50), -- Electric vs Electric
(13, 16, 0.50); -- Electric vs Dragon

-- Psychic
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(14, 2, 2.00),  -- Psychic vs Fighting
(14, 4, 2.00),  -- Psychic vs Poison
(14, 9, 0.50),  -- Psychic vs Steel
(14, 14, 0.50), -- Psychic vs Psychic
(14, 17, 0.00); -- Psychic vs Dark

-- Ice
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(15, 3, 2.00),  -- Ice vs Flying
(15, 5, 2.00),  -- Ice vs Ground
(15, 9, 0.50),  -- Ice vs Steel
(15, 10, 0.50), -- Ice vs Fire
(15, 11, 0.50), -- Ice vs Water
(15, 12, 2.00), -- Ice vs Grass
(15, 15, 0.50), -- Ice vs Ice
(15, 16, 2.00); -- Ice vs Dragon

-- Dragon
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(16, 9, 0.50),  -- Dragon vs Steel
(16, 16, 2.00); -- Dragon vs Dragon

-- Dark
INSERT INTO tipo_eficacia (tipo_ataque_id, tipo_defesa_id, multiplicador) VALUES
(17, 2, 0.50),  -- Dark vs Fighting
(17, 8, 2.00),  -- Dark vs Ghost
(17, 9, 0.50),  -- Dark vs Steel
(17, 14, 2.00), -- Dark vs Psychic
(17, 17, 0.50); -- Dark vs Dark
