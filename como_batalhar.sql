-- =============================================================================
-- GUIA DE COMANDOS: COMO BATALHAR NO MYSQL WORKBENCH
-- Execute os comandos abaixo na aba SQL do MySQL Workbench!
-- =============================================================================
USE pokemon_firered;

-- -----------------------------------------------------------------------------
-- 1. CONSULTAR O STATUS ATUAL DA BATALHA EM ANDAMENTO (RED vs BLUE - ID = 2)
-- -----------------------------------------------------------------------------
SELECT 
    b.id AS batalha_id,
    b.status,
    b.turno_atual,
    pj.apelido AS seu_pokemon_ativo,
    CONCAT(pj.hp_atual, ' / ', pj.hp_max) AS seu_hp,
    po.apelido AS pokemon_oponente_ativo,
    CONCAT(po.hp_atual, ' / ', po.hp_max) AS hp_oponente
FROM batalha b
JOIN pokemon_instancia pj ON b.pokemon_ativo_jogador_id = pj.id
JOIN pokemon_instancia po ON b.pokemon_ativo_oponente_id = po.id
WHERE b.id = 2;


-- -----------------------------------------------------------------------------
-- 2. VER TODOS OS POKÉMONS DO SEU TIME (PARA ESCOLHER TROCAR OU VER O HP)
-- -----------------------------------------------------------------------------
SELECT 
    pi.id AS id_para_trocar,
    pi.posicao_time,
    pi.apelido,
    ep.nome AS especie,
    CONCAT(pi.hp_atual, ' / ', pi.hp_max) AS hp,
    CASE 
        WHEN pi.id = b.pokemon_ativo_jogador_id THEN 'EM CAMPO (ATIVO)'
        WHEN pi.esta_desmaiado = 1 THEN 'DESMAIADO (NÃO PODE ENTRAR)'
        ELSE 'DISPONÍVEL NO BANCO'
    END AS situacao
FROM pokemon_instancia pi
JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
JOIN batalha b ON b.id = 2 AND pi.treinador_id = b.treinador_jogador_id
WHERE pi.posicao_time <= 6
ORDER BY pi.posicao_time;


-- -----------------------------------------------------------------------------
-- 3. VER OS GOLPES DO POKÉMON QUE ESTÁ EM CAMPO AGORA (COM PP E PRIORIDADE)
-- -----------------------------------------------------------------------------
SELECT 
    pma.slot_numero,
    m.id AS id_para_usar_no_comando,
    m.nome AS nome_golpe,
    tp.nome AS tipo,
    m.categoria,
    m.poder,
    m.prioridade,
    CONCAT(pma.pp_atual, ' / ', m.pp_maximo) AS pp
FROM pokemon_movimento_ativo pma
JOIN movimento m ON pma.movimento_id = m.id
JOIN tipo tp ON m.tipo_id = tp.id
WHERE pma.pokemon_instancia_id = (SELECT pokemon_ativo_jogador_id FROM batalha WHERE id = 2)
ORDER BY pma.slot_numero;


-- -----------------------------------------------------------------------------
-- 4. AÇÃO A: ATACAR COM UM GOLPE NESTE TURNO
-- CALL sp_executar_turno_batalha(ID_DA_BATALHA, ID_DO_GOLPE);
-- -----------------------------------------------------------------------------
-- Exemplo: atacar com Flamethrower (ID 53)
-- CALL sp_executar_turno_batalha(4, 53);


-- -----------------------------------------------------------------------------
-- 5. AÇÃO B: TROCAR DE POKÉMON VOLUNTARIAMENTE DURANTE A BATALHA!
-- CALL sp_trocar_pokemon_batalha(ID_DA_BATALHA, ID_DO_NOVO_POKEMON);
-- (Mecânica oficial: o novo pokémon entra e o adversário ataca quem acabou de entrar!)
-- -----------------------------------------------------------------------------
-- Exemplo: Trocar para o Lapras (ID 18)
-- CALL sp_trocar_pokemon_batalha(4, 18);


-- -----------------------------------------------------------------------------
-- 6. AÇÃO C: USAR ITEM DA MOCHILA NA BATALHA (POTIONS, REVIVES, ETHERS)!
-- CALL sp_usar_item_batalha(ID_DA_BATALHA, ID_DO_ITEM, ID_DO_POKEMON_ALVO);
-- (Mecânica oficial: usar item consome a ação do turno e o oponente ataca!)
-- -----------------------------------------------------------------------------
-- Consultar itens disponíveis na mochila do Red:
SELECT tm.item_id, i.nome, i.descricao, tm.quantidade, i.efeito_tipo, i.valor_efeito
FROM treinador_mochila tm
JOIN item_inventario i ON tm.item_id = i.id
WHERE tm.treinador_id = 1;

-- Exemplo: Usar Super Potion (Item ID 2) no Charizard do Red (Pokémon ID 16):
-- CALL sp_usar_item_batalha(4, 2, 16);

-- Exemplo: Usar Revive (Item ID 5) em um Pokémon desmaiado do seu time:
-- CALL sp_usar_item_batalha(4, 5, ID_POKEMON_DESMAIADO);


-- -----------------------------------------------------------------------------
-- 7. VER O LOG DO QUE ACONTECEU NO TURNO (ATAQUE, TROCA, ITENS, DANO, LEFTOVERS)
-- -----------------------------------------------------------------------------
SELECT 
    numero_turno AS turno,
    ordem_acao AS ordem,
    mensagem,
    dano_causado,
    multiplicador_tipo,
    hp_restante_defensor,
    batalha_id
FROM log_batalha
WHERE batalha_id = 4
ORDER BY id DESC
LIMIT 6;


-- -----------------------------------------------------------------------------
-- 8. 🛡️ HELD ITEMS (ITENS SEGURADOS PELOS POKÉMONS)
-- REGRA MANDATÓRIA: SÓ PODEM SER EQUIPADOS OU REMOVIDOS FORA DE BATALHA!
-- Se tentar alterar enquanto uma batalha estiver 'EM_ANDAMENTO', gerará ERRO 45000!
-- -----------------------------------------------------------------------------
-- Catálogo de Held Items disponíveis:
SELECT id, nome, descricao, efeito_tipo, valor_multiplicador FROM held_item;

-- Ver qual item cada Pokémon do Red está segurando:
SELECT pi.id, pi.apelido, hi.nome AS item_segurado, hi.descricao
FROM pokemon_instancia pi
LEFT JOIN held_item hi ON pi.held_item_id = hi.id
WHERE pi.treinador_id = 1 AND pi.posicao_time <= 6;

-- Equipar Leftovers (Item ID 1) no Charizard (Pokémon ID 16) [FORA DE BATALHA]:
-- CALL sp_equipar_held_item(16, 1);

-- Equipar Charcoal (Item ID 3 - +10% Fogo) no Charizard [FORA DE BATALHA]:
-- CALL sp_equipar_held_item(16, 3);

-- Remover o Held Item do Charizard [FORA DE BATALHA]:
-- CALL sp_remover_held_item(16);


-- -----------------------------------------------------------------------------
-- 9. 🏥 ENFERMEIRA JOY (CENTRO POKÉMON)
-- Restaura 100% da vida de todos os pokémons do treinador, revive os desmaiados
-- e recupera todos os PPs dos golpes! Bloqueada se o treinador estiver em batalha!
-- CALL sp_enfermeira_joy(ID_DO_TREINADOR);
-- -----------------------------------------------------------------------------
-- Curar o time do Red (Treinador ID 1):
CALL sp_enfermeira_joy(1);


-- -----------------------------------------------------------------------------
-- 10. 🔄 TROCADOR / LEMBRADOR DE MOVIMENTOS
-- Substitui um golpe equipado por um novo golpe compatível com a espécie e nível:
-- CALL sp_trocar_movimento_pokemon(ID_POKEMON, ID_GOLPE_ATUAL, ID_NOVO_GOLPE);
-- -----------------------------------------------------------------------------
-- Consultar quais golpes o Charizard do Red (ID 16) pode aprender no nível dele:
SELECT emn.movimento_id, m.nome, m.poder, tp.nome AS tipo, emn.nivel_aprendizado
FROM especie_movimento_nivel emn
JOIN movimento m ON emn.movimento_id = m.id
JOIN tipo tp ON m.tipo_id = tp.id
WHERE emn.especie_id = (SELECT especie_id FROM pokemon_instancia WHERE id = 16)
  AND emn.nivel_aprendizado <= (SELECT nivel FROM pokemon_instancia WHERE id = 16)
ORDER BY emn.nivel_aprendizado DESC;

-- Exemplo: Ensinar 'Heat Wave' (ID 257) no lugar de 'Slash' (ID 163):
-- CALL sp_trocar_movimento_pokemon(16, 163, 257);

