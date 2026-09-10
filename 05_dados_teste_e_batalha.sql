-- =============================================================================
-- 05_dados_teste_e_batalha.sql
-- Inserção de Treinadores Icônicos de FireRed, Criação de seus times completos (até 6 pokémons),
-- Simulação de Batalhas por Turno, Subida de Nível e Evolução no Banco de Dados.
-- =============================================================================
USE pokemon_firered;

-- 1. Treinadores
INSERT INTO treinador (id, nome, classe, eh_jogador) VALUES
(1, 'Red', 'Campeão', TRUE),
(2, 'Blue', 'Rival', FALSE),
(3, 'Brock', 'Líder de Ginásio', FALSE),
(4, 'Misty', 'Líder de Ginásio', FALSE),
(5, 'Lt. Surge', 'Líder de Ginásio', FALSE);

-- 2. Montando o Time do Red (Jogador - 6 Pokémons clássicos)
-- Red: Charizard (lvl 50), Pikachu (lvl 50), Lapras (lvl 50), Snorlax (lvl 50), Venusaur (lvl 50), Blastoise (lvl 50)
CALL sp_criar_pokemon_treinador(1, 6, 50, 'Charizard do Red', 1);
CALL sp_criar_pokemon_treinador(1, 25, 50, 'Pikachu do Red', 2);
CALL sp_criar_pokemon_treinador(1, 131, 50, 'Lapras do Red', 3);
CALL sp_criar_pokemon_treinador(1, 143, 50, 'Snorlax do Red', 4);
CALL sp_criar_pokemon_treinador(1, 3, 50, 'Venusaur do Red', 5);
CALL sp_criar_pokemon_treinador(1, 9, 50, 'Blastoise do Red', 6);

-- 3. Montando o Time do Blue (Rival - 6 Pokémons)
-- Blue: Pidgeot (lvl 50), Alakazam (lvl 50), Rhydon (lvl 50), Exeggutor (lvl 50), Gyarados (lvl 50), Arcanine (lvl 50)
CALL sp_criar_pokemon_treinador(2, 18, 50, 'Pidgeot do Blue', 1);
CALL sp_criar_pokemon_treinador(2, 65, 50, 'Alakazam do Blue', 2);
CALL sp_criar_pokemon_treinador(2, 112, 50, 'Rhydon do Blue', 3);
CALL sp_criar_pokemon_treinador(2, 103, 50, 'Exeggutor do Blue', 4);
CALL sp_criar_pokemon_treinador(2, 130, 50, 'Gyarados do Blue', 5);
CALL sp_criar_pokemon_treinador(2, 59, 50, 'Arcanine do Blue', 6);

-- 4. Montando o Time do Brock (Líder de Pewter)
-- Brock: Geodude (lvl 12), Onix (lvl 14)
CALL sp_criar_pokemon_treinador(3, 74, 12, 'Geodude do Brock', 1);
CALL sp_criar_pokemon_treinador(3, 95, 14, 'Onix do Brock', 2);

-- 5. Views Práticas para Consulta e Acompanhamento no Workbench
CREATE OR REPLACE VIEW vw_pokedex_kanto AS
SELECT ep.id_pokedex,
       ep.nome,
       t1.nome AS tipo1,
       IFNULL(t2.nome, '-') AS tipo2,
       ep.hp_base, ep.ataque_base, ep.defesa_base, ep.sp_ataque_base, ep.sp_defesa_base, ep.velocidade_base,
       (ep.hp_base + ep.ataque_base + ep.defesa_base + ep.sp_ataque_base + ep.sp_defesa_base + ep.velocidade_base) AS total_stats,
       ep.exp_base
FROM especie_pokemon ep
JOIN tipo t1 ON ep.tipo1_id = t1.id
LEFT JOIN tipo t2 ON ep.tipo2_id = t2.id
ORDER BY ep.id_pokedex;

CREATE OR REPLACE VIEW vw_time_treinadores AS
SELECT t.nome AS treinador,
       t.classe,
       pi.posicao_time,
       pi.apelido,
       ep.nome AS especie,
       pi.nivel,
       pi.hp_atual,
       pi.hp_max,
       pi.ataque,
       pi.defesa,
       pi.sp_ataque,
       pi.sp_defesa,
       pi.velocidade,
       pi.esta_desmaiado,
       pi.experiencia_atual
FROM treinador t
JOIN pokemon_instancia pi ON t.id = pi.treinador_id
JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
ORDER BY t.id, pi.posicao_time;

CREATE OR REPLACE VIEW vw_golpes_pokemon_ativos AS
SELECT pi.id AS pokemon_instancia_id,
       t.nome AS treinador,
       pi.apelido,
       pma.slot_numero,
       m.nome AS golpe,
       tp.nome AS tipo_golpe,
       m.categoria,
       m.poder,
       m.precisao,
       pma.pp_atual,
       m.pp_maximo
FROM pokemon_movimento_ativo pma
JOIN pokemon_instancia pi ON pma.pokemon_instancia_id = pi.id
JOIN treinador t ON pi.treinador_id = t.id
JOIN movimento m ON pma.movimento_id = m.id
JOIN tipo tp ON m.tipo_id = tp.id
ORDER BY pi.id, pma.slot_numero;
