-- =============================================================================
-- 05_dados_teste_e_batalha.sql
-- Inserção de Todos os Treinadores Icônicos de FireRed (8 Líderes de Ginásio, 
-- Elite dos Quatro e Campeões), Criação de seus times oficiais canônicos,
-- e Views Práticas para Acompanhamento no MySQL Workbench e Aplicação Web.
-- =============================================================================
USE pokemon_firered;

-- Limpeza prévia para garantir idempotência sem duplicar instâncias
UPDATE batalha SET pokemon_ativo_jogador_id = NULL, pokemon_ativo_oponente_id = NULL;
DELETE FROM log_batalha;
DELETE FROM batalha;
DELETE FROM pokemon_movimento_ativo;
DELETE FROM pokemon_instancia;

-- 1. Treinadores Oficiais de Kanto
INSERT INTO treinador (id, nome, classe, eh_jogador) VALUES
(1, 'Red', 'Campeão', TRUE),
(2, 'Blue', 'Campeão', FALSE),
(3, 'Brock', 'Líder de Ginásio', FALSE),
(4, 'Misty', 'Líder de Ginásio', FALSE),
(5, 'Lt. Surge', 'Líder de Ginásio', FALSE),
(6, 'Erika', 'Líder de Ginásio', FALSE),
(7, 'Koga', 'Líder de Ginásio', FALSE),
(8, 'Sabrina', 'Líder de Ginásio', FALSE),
(9, 'Blaine', 'Líder de Ginásio', FALSE),
(10, 'Giovanni', 'Líder de Ginásio', FALSE),
(11, 'Lorelei', 'Elite dos Quatro', FALSE),
(12, 'Bruno', 'Elite dos Quatro', FALSE),
(13, 'Agatha', 'Elite dos Quatro', FALSE),
(14, 'Lance', 'Elite dos Quatro', FALSE)
ON DUPLICATE KEY UPDATE nome = VALUES(nome), classe = VALUES(classe), eh_jogador = VALUES(eh_jogador);

-- 2. Montando o Time do Red (Jogador - 6 Pokémons clássicos)
-- Red: Charizard (lvl 50), Pikachu (lvl 50), Lapras (lvl 50), Snorlax (lvl 50), Venusaur (lvl 50), Blastoise (lvl 50)
CALL sp_criar_pokemon_treinador(1, 6, 50, 'Charizard do Red', 1);
CALL sp_criar_pokemon_treinador(1, 25, 50, 'Pikachu do Red', 2);
CALL sp_criar_pokemon_treinador(1, 131, 50, 'Lapras do Red', 3);
CALL sp_criar_pokemon_treinador(1, 143, 50, 'Snorlax do Red', 4);
CALL sp_criar_pokemon_treinador(1, 3, 50, 'Venusaur do Red', 5);
CALL sp_criar_pokemon_treinador(1, 9, 50, 'Blastoise do Red', 6);

-- 3. Montando o Time do Blue (Campeão / Rival - 6 Pokémons)
-- Blue: Pidgeot (lvl 50), Alakazam (lvl 50), Rhydon (lvl 50), Exeggutor (lvl 50), Gyarados (lvl 50), Arcanine (lvl 50)
CALL sp_criar_pokemon_treinador(2, 18, 50, 'Pidgeot do Blue', 1);
CALL sp_criar_pokemon_treinador(2, 65, 50, 'Alakazam do Blue', 2);
CALL sp_criar_pokemon_treinador(2, 112, 50, 'Rhydon do Blue', 3);
CALL sp_criar_pokemon_treinador(2, 103, 50, 'Exeggutor do Blue', 4);
CALL sp_criar_pokemon_treinador(2, 130, 50, 'Gyarados do Blue', 5);
CALL sp_criar_pokemon_treinador(2, 59, 50, 'Arcanine do Blue', 6);

-- 4. Montando o Time do Brock (Líder 1 - Pewter - Pedra)
-- Brock: Geodude (lvl 12), Onix (lvl 14)
CALL sp_criar_pokemon_treinador(3, 74, 12, 'Geodude do Brock', 1);
CALL sp_criar_pokemon_treinador(3, 95, 14, 'Onix do Brock', 2);

-- 5. Montando o Time da Misty (Líder 2 - Cerulean - Água)
-- Misty: Staryu (lvl 18), Starmie (lvl 21)
CALL sp_criar_pokemon_treinador(4, 120, 18, 'Staryu da Misty', 1);
CALL sp_criar_pokemon_treinador(4, 121, 21, 'Starmie da Misty', 2);

-- 6. Montando o Time do Lt. Surge (Líder 3 - Vermilion - Elétrico)
-- Lt. Surge: Voltorb (lvl 21), Pikachu (lvl 18), Raichu (lvl 24)
CALL sp_criar_pokemon_treinador(5, 100, 21, 'Voltorb do Surge', 1);
CALL sp_criar_pokemon_treinador(5, 25, 18, 'Pikachu do Surge', 2);
CALL sp_criar_pokemon_treinador(5, 26, 24, 'Raichu do Surge', 3);

-- 7. Montando o Time da Erika (Líder 4 - Celadon - Planta)
-- Erika: Victreebel (lvl 29), Tangela (lvl 24), Vileplume (lvl 29)
CALL sp_criar_pokemon_treinador(6, 71, 29, 'Victreebel da Erika', 1);
CALL sp_criar_pokemon_treinador(6, 114, 24, 'Tangela da Erika', 2);
CALL sp_criar_pokemon_treinador(6, 45, 29, 'Vileplume da Erika', 3);

-- 8. Montando o Time do Koga (Líder 5 - Fuchsia - Veneno)
-- Koga: Koffing (lvl 37), Muk (lvl 39), Koffing (lvl 37), Weezing (lvl 43)
CALL sp_criar_pokemon_treinador(7, 109, 37, 'Koffing do Koga', 1);
CALL sp_criar_pokemon_treinador(7, 89, 39, 'Muk do Koga', 2);
CALL sp_criar_pokemon_treinador(7, 109, 37, 'Koffing 2 do Koga', 3);
CALL sp_criar_pokemon_treinador(7, 110, 43, 'Weezing do Koga', 4);

-- 9. Montando o Time da Sabrina (Líder 6 - Saffron - Psíquico)
-- Sabrina: Kadabra (lvl 38), Mr. Mime (lvl 37), Venomoth (lvl 38), Alakazam (lvl 43)
CALL sp_criar_pokemon_treinador(8, 64, 38, 'Kadabra da Sabrina', 1);
CALL sp_criar_pokemon_treinador(8, 122, 37, 'Mr. Mime da Sabrina', 2);
CALL sp_criar_pokemon_treinador(8, 49, 38, 'Venomoth da Sabrina', 3);
CALL sp_criar_pokemon_treinador(8, 65, 43, 'Alakazam da Sabrina', 4);

-- 10. Montando o Time do Blaine (Líder 7 - Cinnabar - Fogo)
-- Blaine: Growlithe (lvl 42), Ponyta (lvl 40), Rapidash (lvl 42), Arcanine (lvl 47)
CALL sp_criar_pokemon_treinador(9, 58, 42, 'Growlithe do Blaine', 1);
CALL sp_criar_pokemon_treinador(9, 77, 40, 'Ponyta do Blaine', 2);
CALL sp_criar_pokemon_treinador(9, 78, 42, 'Rapidash do Blaine', 3);
CALL sp_criar_pokemon_treinador(9, 59, 47, 'Arcanine do Blaine', 4);

-- 11. Montando o Time do Giovanni (Líder 8 - Viridian - Terra / Chefe Rocket)
-- Giovanni: Rhyhorn (lvl 45), Dugtrio (lvl 42), Nidoqueen (lvl 44), Nidoking (lvl 45), Rhydon (lvl 50)
CALL sp_criar_pokemon_treinador(10, 111, 45, 'Rhyhorn do Giovanni', 1);
CALL sp_criar_pokemon_treinador(10, 51, 42, 'Dugtrio do Giovanni', 2);
CALL sp_criar_pokemon_treinador(10, 31, 44, 'Nidoqueen do Giovanni', 3);
CALL sp_criar_pokemon_treinador(10, 34, 45, 'Nidoking do Giovanni', 4);
CALL sp_criar_pokemon_treinador(10, 112, 50, 'Rhydon do Giovanni', 5);

-- 12. Montando o Time da Lorelei (Elite 1 - Indigo Plateau - Gelo/Água)
-- Lorelei: Dewgong (lvl 52), Cloyster (lvl 51), Slowbro (lvl 52), Jynx (lvl 54), Lapras (lvl 54)
CALL sp_criar_pokemon_treinador(11, 87, 52, 'Dewgong da Lorelei', 1);
CALL sp_criar_pokemon_treinador(11, 91, 51, 'Cloyster da Lorelei', 2);
CALL sp_criar_pokemon_treinador(11, 80, 52, 'Slowbro da Lorelei', 3);
CALL sp_criar_pokemon_treinador(11, 124, 54, 'Jynx da Lorelei', 4);
CALL sp_criar_pokemon_treinador(11, 131, 54, 'Lapras da Lorelei', 5);

-- 13. Montando o Time do Bruno (Elite 2 - Indigo Plateau - Lutador/Pedra)
-- Bruno: Onix (lvl 51), Hitmonchan (lvl 53), Hitmonlee (lvl 53), Onix (lvl 54), Machamp (lvl 56)
CALL sp_criar_pokemon_treinador(12, 95, 51, 'Onix do Bruno', 1);
CALL sp_criar_pokemon_treinador(12, 107, 53, 'Hitmonchan do Bruno', 2);
CALL sp_criar_pokemon_treinador(12, 106, 53, 'Hitmonlee do Bruno', 3);
CALL sp_criar_pokemon_treinador(12, 95, 54, 'Onix 2 do Bruno', 4);
CALL sp_criar_pokemon_treinador(12, 68, 56, 'Machamp do Bruno', 5);

-- 14. Montando o Time da Agatha (Elite 3 - Indigo Plateau - Fantasma/Veneno)
-- Agatha: Gengar (lvl 54), Golbat (lvl 54), Haunter (lvl 53), Arbok (lvl 56), Gengar (lvl 58)
CALL sp_criar_pokemon_treinador(13, 94, 54, 'Gengar da Agatha', 1);
CALL sp_criar_pokemon_treinador(13, 42, 54, 'Golbat da Agatha', 2);
CALL sp_criar_pokemon_treinador(13, 93, 53, 'Haunter da Agatha', 3);
CALL sp_criar_pokemon_treinador(13, 24, 56, 'Arbok da Agatha', 4);
CALL sp_criar_pokemon_treinador(13, 94, 58, 'Gengar 2 da Agatha', 5);

-- 15. Montando o Time do Lance (Elite 4 - Indigo Plateau - Dragão/Voador)
-- Lance: Gyarados (lvl 56), Dragonair (lvl 54), Dragonair (lvl 54), Aerodactyl (lvl 58), Dragonite (lvl 60)
CALL sp_criar_pokemon_treinador(14, 130, 56, 'Gyarados do Lance', 1);
CALL sp_criar_pokemon_treinador(14, 148, 54, 'Dragonair do Lance', 2);
CALL sp_criar_pokemon_treinador(14, 148, 54, 'Dragonair 2 do Lance', 3);
CALL sp_criar_pokemon_treinador(14, 142, 58, 'Aerodactyl do Lance', 4);
CALL sp_criar_pokemon_treinador(14, 149, 60, 'Dragonite do Lance', 5);

-- =============================================================================
-- 16. Views Práticas para Consulta e Acompanhamento no Workbench e Web
-- =============================================================================
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
