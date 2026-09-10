-- =============================================================================
-- 04_procedures_batalha_e_mecanicas.sql
-- LÓGICA COMPLETA DE COMBATE, CÁLCULOS E NÍVEIS NO BANCO DE DADOS
-- =============================================================================
USE pokemon_firered;

DELIMITER $$

-- -----------------------------------------------------------------------------
-- 1. FUNÇÃO AUXILIAR: CALCULAR STAT INDIVIDUAL PELA FÓRMULA OFICIAL GEN 3
-- HP   = FLOOR(((2 * Base + IV + FLOOR(EV / 4)) * Level) / 100) + Level + 10
-- STAT = FLOOR(((2 * Base + IV + FLOOR(EV / 4)) * Level) / 100) + 5
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_calcular_hp_max$$
CREATE FUNCTION fn_calcular_hp_max(p_base INT, p_iv INT, p_ev INT, p_nivel INT)
RETURNS INT DETERMINISTIC
BEGIN
    RETURN FLOOR(((2 * p_base + p_iv + FLOOR(p_ev / 4)) * p_nivel) / 100) + p_nivel + 10;
END$$

DROP FUNCTION IF EXISTS fn_calcular_stat$$
CREATE FUNCTION fn_calcular_stat(p_base INT, p_iv INT, p_ev INT, p_nivel INT)
RETURNS INT DETERMINISTIC
BEGIN
    RETURN FLOOR(((2 * p_base + p_iv + FLOOR(p_ev / 4)) * p_nivel) / 100) + 5;
END$$

-- -----------------------------------------------------------------------------
-- 2. FUNÇÃO: OBTER MULTIPLICADOR DE TIPO ELEMENTAL (TIPO_GOLPE VS POKEMON DEFENSOR)
-- -----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_obter_multiplicador_tipo$$
CREATE FUNCTION fn_obter_multiplicador_tipo(p_tipo_ataque_id INT, p_pokemon_defensor_id INT)
RETURNS DECIMAL(4,2) READS SQL DATA
BEGIN
    DECLARE v_tipo1_def INT;
    DECLARE v_tipo2_def INT;
    DECLARE v_mult1 DECIMAL(3,2) DEFAULT 1.00;
    DECLARE v_mult2 DECIMAL(3,2) DEFAULT 1.00;

    SELECT ep.tipo1_id, ep.tipo2_id
    INTO v_tipo1_def, v_tipo2_def
    FROM pokemon_instancia pi
    JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
    WHERE pi.id = p_pokemon_defensor_id;

    -- Efeito contra o primeiro tipo
    SELECT IFNULL(multiplicador, 1.00) INTO v_mult1
    FROM tipo_eficacia
    WHERE tipo_ataque_id = p_tipo_ataque_id AND tipo_defesa_id = v_tipo1_def;

    -- Efeito contra o segundo tipo (se existir)
    IF v_tipo2_def IS NOT NULL THEN
        SELECT IFNULL(multiplicador, 1.00) INTO v_mult2
        FROM tipo_eficacia
        WHERE tipo_ataque_id = p_tipo_ataque_id AND tipo_defesa_id = v_tipo2_def;
    END IF;

    RETURN (v_mult1 * v_mult2);
END$$

-- -----------------------------------------------------------------------------
-- 3. PROCEDURE: RECALCULAR STATUS DE UMA INSTÂNCIA
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_recalcular_status_pokemon$$
CREATE PROCEDURE sp_recalcular_status_pokemon(IN p_instancia_id INT)
BEGIN
    DECLARE v_base_hp, v_base_atk, v_base_def, v_base_sp_atk, v_base_sp_def, v_base_spd INT;
    DECLARE v_iv_hp, v_iv_atk, v_iv_def, v_iv_sp_atk, v_iv_sp_def, v_iv_spd INT;
    DECLARE v_ev_hp, v_ev_atk, v_ev_def, v_ev_sp_atk, v_ev_sp_def, v_ev_spd INT;
    DECLARE v_nivel INT;
    DECLARE v_hp_max_antigo, v_novo_hp_max, v_hp_atual INT;

    SELECT ep.hp_base, ep.ataque_base, ep.defesa_base, ep.sp_ataque_base, ep.sp_defesa_base, ep.velocidade_base,
           pi.iv_hp, pi.iv_ataque, pi.iv_defesa, pi.iv_sp_ataque, pi.iv_sp_defesa, pi.iv_velocidade,
           pi.ev_hp, pi.ev_ataque, pi.ev_defesa, pi.ev_sp_ataque, pi.ev_sp_defesa, pi.ev_velocidade,
           pi.nivel, pi.hp_max, pi.hp_atual
    INTO v_base_hp, v_base_atk, v_base_def, v_base_sp_atk, v_base_sp_def, v_base_spd,
         v_iv_hp, v_iv_atk, v_iv_def, v_iv_sp_atk, v_iv_sp_def, v_iv_spd,
         v_ev_hp, v_ev_atk, v_ev_def, v_ev_sp_atk, v_ev_sp_def, v_ev_spd,
         v_nivel, v_hp_max_antigo, v_hp_atual
    FROM pokemon_instancia pi
    JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
    WHERE pi.id = p_instancia_id;

    SET v_novo_hp_max = fn_calcular_hp_max(v_base_hp, v_iv_hp, v_ev_hp, v_nivel);

    UPDATE pokemon_instancia
    SET hp_max = v_novo_hp_max,
        hp_atual = CASE WHEN v_hp_atual <= 0 THEN 0 ELSE (v_hp_atual + (v_novo_hp_max - v_hp_max_antigo)) END,
        ataque = fn_calcular_stat(v_base_atk, v_iv_atk, v_ev_atk, v_nivel),
        defesa = fn_calcular_stat(v_base_def, v_iv_def, v_ev_def, v_nivel),
        sp_ataque = fn_calcular_stat(v_base_sp_atk, v_iv_sp_atk, v_ev_sp_atk, v_nivel),
        sp_defesa = fn_calcular_stat(v_base_sp_def, v_iv_sp_def, v_ev_sp_def, v_nivel),
        velocidade = fn_calcular_stat(v_base_spd, v_iv_spd, v_ev_spd, v_nivel)
    WHERE id = p_instancia_id;
END$$

-- -----------------------------------------------------------------------------
-- 4. PROCEDURE: SUBIR DE NÍVEL (LEVEL UP) & CHECAR EVOLUÇÃO / NOVOS GOLPES
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_subir_nivel$$
CREATE PROCEDURE sp_subir_nivel(IN p_instancia_id INT)
BEGIN
    DECLARE v_especie_atual INT;
    DECLARE v_novo_nivel INT;
    DECLARE v_especie_destino INT;
    DECLARE v_nome_especie_origem VARCHAR(50);
    DECLARE v_nome_especie_destino VARCHAR(50);

    -- Incrementa o nível
    UPDATE pokemon_instancia
    SET nivel = nivel + 1
    WHERE id = p_instancia_id;

    SELECT pi.especie_id, pi.nivel, ep.nome
    INTO v_especie_atual, v_novo_nivel, v_nome_especie_origem
    FROM pokemon_instancia pi
    JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
    WHERE pi.id = p_instancia_id;

    -- Recalcula atributos com o novo nível
    CALL sp_recalcular_status_pokemon(p_instancia_id);

    -- Verificar se atinge evolução por nível
    SELECT especie_destino_id INTO v_especie_destino
    FROM evolucao
    WHERE especie_origem_id = v_especie_atual
      AND metodo_evolucao = 'LEVEL_UP'
      AND CAST(parametro AS UNSIGNED) <= v_novo_nivel
    LIMIT 1;

    IF v_especie_destino IS NOT NULL THEN
        SELECT nome INTO v_nome_especie_destino FROM especie_pokemon WHERE id_pokedex = v_especie_destino;
        UPDATE pokemon_instancia SET especie_id = v_especie_destino WHERE id = p_instancia_id;
        CALL sp_recalcular_status_pokemon(p_instancia_id);
        SELECT CONCAT('Parabéns! Seu ', v_nome_especie_origem, ' subiu para o nível ', v_novo_nivel, ' e evoluiu para ', v_nome_especie_destino, '!') AS evento_evolucao;
    ELSE
        SELECT CONCAT(v_nome_especie_origem, ' subiu para o nível ', v_novo_nivel, '!') AS evento_nivel;
    END IF;

    -- Exibir movimentos que são desbloqueados neste nível
    SELECT m.id AS movimento_id, m.nome, m.poder, m.precisao, m.pp_maximo, m.categoria
    FROM especie_movimento_nivel emn
    JOIN movimento m ON emn.movimento_id = m.id
    WHERE emn.especie_id = (SELECT especie_id FROM pokemon_instancia WHERE id = p_instancia_id)
      AND emn.nivel_aprendizado = v_novo_nivel;
END$$

-- -----------------------------------------------------------------------------
-- 5. PROCEDURE: CRIAR/INICIALIZAR INSTÂNCIA DE POKÉMON COM GOLPES AUTOMÁTICOS
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_criar_pokemon_treinador$$
CREATE PROCEDURE sp_criar_pokemon_treinador(
    IN p_treinador_id INT,
    IN p_especie_id INT,
    IN p_nivel INT,
    IN p_apelido VARCHAR(50),
    IN p_posicao_time INT
)
BEGIN
    DECLARE v_instancia_id INT;
    DECLARE v_base_hp, v_base_atk, v_base_def, v_base_sp_atk, v_base_sp_def, v_base_spd INT;
    DECLARE v_iv_hp, v_iv_atk, v_iv_def, v_iv_sp_atk, v_iv_sp_def, v_iv_spd INT;
    DECLARE v_calc_hp_max INT;

    -- Gerar IVs aleatórios (0 a 31)
    SET v_iv_hp = FLOOR(RAND() * 32);
    SET v_iv_atk = FLOOR(RAND() * 32);
    SET v_iv_def = FLOOR(RAND() * 32);
    SET v_iv_sp_atk = FLOOR(RAND() * 32);
    SET v_iv_sp_def = FLOOR(RAND() * 32);
    SET v_iv_spd = FLOOR(RAND() * 32);

    SELECT hp_base, ataque_base, defesa_base, sp_ataque_base, sp_defesa_base, velocidade_base
    INTO v_base_hp, v_base_atk, v_base_def, v_base_sp_atk, v_base_sp_def, v_base_spd
    FROM especie_pokemon WHERE id_pokedex = p_especie_id;

    SET v_calc_hp_max = fn_calcular_hp_max(v_base_hp, v_iv_hp, 0, p_nivel);

    INSERT INTO pokemon_instancia (
        treinador_id, especie_id, apelido, nivel, experiencia_atual, posicao_time, esta_desmaiado,
        hp_atual, hp_max, ataque, defesa, sp_ataque, sp_defesa, velocidade,
        iv_hp, iv_ataque, iv_defesa, iv_sp_ataque, iv_sp_defesa, iv_velocidade,
        ev_hp, ev_ataque, ev_defesa, ev_sp_ataque, ev_sp_defesa, ev_velocidade
    ) VALUES (
        p_treinador_id, p_especie_id, p_apelido, p_nivel, 0, p_posicao_time, FALSE,
        v_calc_hp_max, v_calc_hp_max,
        fn_calcular_stat(v_base_atk, v_iv_atk, 0, p_nivel),
        fn_calcular_stat(v_base_def, v_iv_def, 0, p_nivel),
        fn_calcular_stat(v_base_sp_atk, v_iv_sp_atk, 0, p_nivel),
        fn_calcular_stat(v_base_sp_def, v_iv_sp_def, 0, p_nivel),
        fn_calcular_stat(v_base_spd, v_iv_spd, 0, p_nivel),
        v_iv_hp, v_iv_atk, v_iv_def, v_iv_sp_atk, v_iv_sp_def, v_iv_spd,
        0, 0, 0, 0, 0, 0
    );

    SET v_instancia_id = LAST_INSERT_ID();

    -- Atribuir até 4 movimentos aprendidos até o nível informado
    INSERT INTO pokemon_movimento_ativo (pokemon_instancia_id, movimento_id, slot_numero, pp_atual)
    SELECT v_instancia_id, sub.movimento_id, (@slot := @slot + 1) AS slot_num, sub.pp_maximo
    FROM (
        SELECT emn.movimento_id, m.pp_maximo, MAX(emn.nivel_aprendizado) as max_lvl
        FROM especie_movimento_nivel emn
        JOIN movimento m ON emn.movimento_id = m.id
        WHERE emn.especie_id = p_especie_id AND emn.nivel_aprendizado <= p_nivel
        GROUP BY emn.movimento_id, m.pp_maximo
        ORDER BY max_lvl DESC, emn.movimento_id DESC
        LIMIT 4
    ) sub, (SELECT @slot := 0) r;

    SELECT v_instancia_id AS nova_instancia_id;
END$$

-- -----------------------------------------------------------------------------
-- 6. PROCEDURE: INICIAR BATALHA ENTRE DOIS TREINADORES (6v6)
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_iniciar_batalha$$
CREATE PROCEDURE sp_iniciar_batalha(
    IN p_treinador_jogador_id INT,
    IN p_treinador_oponente_id INT
)
BEGIN
    DECLARE v_batalha_id INT;
    DECLARE v_pok_jog_id INT;
    DECLARE v_pok_opo_id INT;

    DECLARE v_batalha_em_andamento INT;

    -- Validar se o jogador ou oponente já estão em uma batalha ativa
    SELECT COUNT(*) INTO v_batalha_em_andamento
    FROM batalha
    WHERE status = 'EM_ANDAMENTO'
      AND (treinador_jogador_id IN (p_treinador_jogador_id, p_treinador_oponente_id)
           OR treinador_oponente_id IN (p_treinador_jogador_id, p_treinador_oponente_id));

    IF v_batalha_em_andamento > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não é possível iniciar a batalha! Um dos treinadores já está participando de uma batalha em andamento.';
    END IF;

    -- Seleciona o primeiro pokémon não desmaiado de cada treinador
    SELECT id INTO v_pok_jog_id
    FROM pokemon_instancia
    WHERE treinador_id = p_treinador_jogador_id AND esta_desmaiado = FALSE AND posicao_time <= 6
    ORDER BY posicao_time ASC LIMIT 1;

    SELECT id INTO v_pok_opo_id
    FROM pokemon_instancia
    WHERE treinador_id = p_treinador_oponente_id AND esta_desmaiado = FALSE AND posicao_time <= 6
    ORDER BY posicao_time ASC LIMIT 1;

    IF v_pok_jog_id IS NULL OR v_pok_opo_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Ambos os treinadores precisam de pelo menos 1 pokémon apto para batalhar!';
    END IF;

    INSERT INTO batalha (treinador_jogador_id, treinador_oponente_id, status, pokemon_ativo_jogador_id, pokemon_ativo_oponente_id, turno_atual)
    VALUES (p_treinador_jogador_id, p_treinador_oponente_id, 'EM_ANDAMENTO', v_pok_jog_id, v_pok_opo_id, 1);

    SET v_batalha_id = LAST_INSERT_ID();

    SELECT v_batalha_id AS batalha_id,
           'Batalha iniciada com sucesso!' AS status,
           v_pok_jog_id AS pokemon_jogador_id,
           v_pok_opo_id AS pokemon_oponente_id;
END$$

-- -----------------------------------------------------------------------------
-- 7. PROCEDURE CENTRAL: EXECUTAR TURNO DA BATALHA ESPERANDO AÇÃO DO USUÁRIO
-- O usuário/treinador insere: (p_batalha_id, p_movimento_jogador_id)
-- O banco processa o turno completo: velocidade, dano oficial, STAB, fraquezas,
-- resposta do adversário, exp ganho, evolução, troca de pokémon desmaiado ou fim de jogo!
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_executar_turno_batalha$$
CREATE PROCEDURE sp_executar_turno_batalha(
    IN p_batalha_id INT,
    IN p_movimento_jogador_id INT
)
proc_label: BEGIN
    -- Variáveis de Estado da Batalha
    DECLARE v_status_batalha VARCHAR(30);
    DECLARE v_turno INT;
    DECLARE v_treinador_jog_id, v_treinador_opo_id INT;
    DECLARE v_pok_jog_id, v_pok_opo_id INT;
    DECLARE v_speed_jog, v_speed_opo INT;
    DECLARE v_mov_opo_id INT;

    -- Variáveis para Execução de Golpe
    DECLARE v_primeiro_atacante_id, v_segundo_atacante_id INT;
    DECLARE v_primeiro_defensor_id, v_segundo_defensor_id INT;
    DECLARE v_primeiro_mov_id, v_segundo_mov_id INT;

    -- Variáveis para Cálculo de Dano
    DECLARE v_poder, v_precisao, v_tipo_mov INT;
    DECLARE v_categoria VARCHAR(20);
    DECLARE v_atk_stat, v_def_stat, v_nivel_atk INT;
    DECLARE v_dano INT;
    DECLARE v_mult_tipo DECIMAL(4,2);
    DECLARE v_stab DECIMAL(3,2);
    DECLARE v_msg TEXT;
    DECLARE v_tipo1_atk, v_tipo2_atk INT;
    DECLARE v_exp_ganha INT;
    DECLARE v_base_exp_derrotado INT;
    DECLARE v_nivel_derrotado INT;
    DECLARE v_proximo_pok_id INT;
    DECLARE v_prio_jog, v_prio_opo INT DEFAULT 0;

    -- Validar Batalha
    SELECT status, turno_atual, treinador_jogador_id, treinador_oponente_id, pokemon_ativo_jogador_id, pokemon_ativo_oponente_id
    INTO v_status_batalha, v_turno, v_treinador_jog_id, v_treinador_opo_id, v_pok_jog_id, v_pok_opo_id
    FROM batalha WHERE id = p_batalha_id;

    IF v_status_batalha != 'EM_ANDAMENTO' THEN
        SELECT CONCAT('A batalha já terminou! Vencedor: ', IFNULL((SELECT nome FROM treinador WHERE id = (SELECT vencedor_id FROM batalha WHERE id = p_batalha_id)), 'Ninguém')) AS status;
        LEAVE proc_label;
    END IF;

    -- Selecionar golpe do adversário (um dos seus golpes com PP > 0)
    SELECT movimento_id INTO v_mov_opo_id
    FROM pokemon_movimento_ativo
    WHERE pokemon_instancia_id = v_pok_opo_id AND pp_atual > 0
    ORDER BY RAND() LIMIT 1;

    -- Se acabou o PP, fallback para Tackle (id 33)
    IF v_mov_opo_id IS NULL THEN
        SET v_mov_opo_id = 33;
    END IF;

    -- Obter Prioridade dos Golpes Escolhidos
    SELECT prioridade INTO v_prio_jog FROM movimento WHERE id = p_movimento_jogador_id;
    SELECT prioridade INTO v_prio_opo FROM movimento WHERE id = v_mov_opo_id;

    -- Obter Velocidades para desempate de prioridade
    SELECT velocidade INTO v_speed_jog FROM pokemon_instancia WHERE id = v_pok_jog_id;
    SELECT velocidade INTO v_speed_opo FROM pokemon_instancia WHERE id = v_pok_opo_id;

    -- Regra Oficial de Batalha Pokémon (Prioridade > Velocidade):
    -- Se um golpe tem maior prioridade (+1, +2, etc.), ataca primeiro. Se empatar a prioridade, decide na velocidade.
    IF (v_prio_jog > v_prio_opo) OR (v_prio_jog = v_prio_opo AND v_speed_jog >= v_speed_opo) THEN
        SET v_primeiro_atacante_id = v_pok_jog_id;
        SET v_primeiro_defensor_id = v_pok_opo_id;
        SET v_primeiro_mov_id = p_movimento_jogador_id;

        SET v_segundo_atacante_id = v_pok_opo_id;
        SET v_segundo_defensor_id = v_pok_jog_id;
        SET v_segundo_mov_id = v_mov_opo_id;
    ELSE
        SET v_primeiro_atacante_id = v_pok_opo_id;
        SET v_primeiro_defensor_id = v_pok_jog_id;
        SET v_primeiro_mov_id = v_mov_opo_id;

        SET v_segundo_atacante_id = v_pok_jog_id;
        SET v_segundo_defensor_id = v_pok_opo_id;
        SET v_segundo_mov_id = p_movimento_jogador_id;
    END IF;

    -- =========================================================================
    -- EXECUÇÃO DO 1º ATAQUE
    -- =========================================================================
    SELECT poder, precisao, tipo_id, categoria INTO v_poder, v_precisao, v_tipo_mov, v_categoria
    FROM movimento WHERE id = v_primeiro_mov_id;

    SELECT pi.nivel, ep.tipo1_id, ep.tipo2_id,
           CASE WHEN v_categoria = 'Special' THEN pi.sp_ataque ELSE pi.ataque END
    INTO v_nivel_atk, v_tipo1_atk, v_tipo2_atk, v_atk_stat
    FROM pokemon_instancia pi
    JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
    WHERE pi.id = v_primeiro_atacante_id;

    SELECT CASE WHEN v_categoria = 'Special' THEN pi.sp_defesa ELSE pi.defesa END
    INTO v_def_stat
    FROM pokemon_instancia pi
    WHERE pi.id = v_primeiro_defensor_id;

    -- Descontar PP
    UPDATE pokemon_movimento_ativo
    SET pp_atual = GREATEST(0, pp_atual - 1)
    WHERE pokemon_instancia_id = v_primeiro_atacante_id AND movimento_id = v_primeiro_mov_id;

    -- STAB (Same Type Attack Bonus: 1.5x)
    IF v_tipo_mov = v_tipo1_atk OR (v_tipo2_atk IS NOT NULL AND v_tipo_mov = v_tipo2_atk) THEN
        SET v_stab = 1.50;
    ELSE
        SET v_stab = 1.00;
    END IF;

    -- Multiplicador elemental
    SET v_mult_tipo = fn_obter_multiplicador_tipo(v_tipo_mov, v_primeiro_defensor_id);

    -- Efeito de Held Item do Atacante (ex: Charcoal, Mystic Water, Choice Band)
    IF (SELECT hi.efeito_tipo FROM pokemon_instancia pi JOIN held_item hi ON pi.held_item_id = hi.id WHERE pi.id = v_primeiro_atacante_id) = 'BOOST_TIPO'
       AND (SELECT hi.param_tipo_id FROM pokemon_instancia pi JOIN held_item hi ON pi.held_item_id = hi.id WHERE pi.id = v_primeiro_atacante_id) = v_tipo_mov THEN
        SET v_stab = v_stab * 1.10;
    END IF;

    -- Dano Físico/Especial Gen 3
    IF v_poder IS NOT NULL AND v_poder > 0 THEN
        SET v_dano = FLOOR((((((2 * v_nivel_atk) / 5) + 2) * v_poder * (v_atk_stat / v_def_stat)) / 50 + 2) * v_stab * v_mult_tipo);
        IF v_mult_tipo > 0 AND v_dano = 0 THEN SET v_dano = 1; END IF;
    ELSE
        SET v_dano = 0;
    END IF;

    -- Calcular novo HP e estado de desmaio do 1º ataque
    UPDATE pokemon_instancia
    SET esta_desmaiado = (hp_atual <= v_dano),
        hp_atual = GREATEST(0, hp_atual - v_dano)
    WHERE id = v_primeiro_defensor_id;

    SET v_msg = CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_primeiro_atacante_id), ' usou ',
                       (SELECT nome FROM movimento WHERE id = v_primeiro_mov_id), '! Dano: ', v_dano);
    IF v_mult_tipo >= 2.0 THEN SET v_msg = CONCAT(v_msg, ' (Super Efetivo!)'); END IF;
    IF v_mult_tipo <= 0.5 AND v_mult_tipo > 0 THEN SET v_msg = CONCAT(v_msg, ' (Não foi muito efetivo...)'); END IF;
    IF v_mult_tipo = 0 THEN SET v_msg = CONCAT(v_msg, ' (Não teve efeito!)'); END IF;

    INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
    VALUES (p_batalha_id, v_turno, 1, v_primeiro_atacante_id, v_primeiro_defensor_id, v_primeiro_mov_id, v_dano, v_mult_tipo, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_primeiro_defensor_id), v_msg);

    -- Se o defensor do 1º golpe desmaiou:
    IF (SELECT esta_desmaiado FROM pokemon_instancia WHERE id = v_primeiro_defensor_id) = TRUE THEN
        -- Calcular e distribuir EXP para o atacante
        SELECT ep.exp_base, pi.nivel INTO v_base_exp_derrotado, v_nivel_derrotado
        FROM pokemon_instancia pi
        JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
        WHERE pi.id = v_primeiro_defensor_id;

        -- EXP Batalha de Treinador: (1.5 * b * L) / 7
        SET v_exp_ganha = FLOOR((1.5 * v_base_exp_derrotado * v_nivel_derrotado) / 7);

        UPDATE pokemon_instancia
        SET experiencia_atual = experiencia_atual + v_exp_ganha
        WHERE id = v_primeiro_atacante_id;

        -- Verificar se o time derrotado possui outro pokémon vivo (até 6 pokémons)
        SELECT id INTO v_proximo_pok_id
        FROM pokemon_instancia
        WHERE treinador_id = (SELECT treinador_id FROM pokemon_instancia WHERE id = v_primeiro_defensor_id)
          AND esta_desmaiado = FALSE AND posicao_time <= 6
        ORDER BY posicao_time ASC LIMIT 1;

        IF v_proximo_pok_id IS NOT NULL THEN
            -- Coloca o próximo pokémon em campo
            IF v_primeiro_defensor_id = v_pok_jog_id THEN
                UPDATE batalha SET pokemon_ativo_jogador_id = v_proximo_pok_id, turno_atual = v_turno + 1 WHERE id = p_batalha_id;
            ELSE
                UPDATE batalha SET pokemon_ativo_oponente_id = v_proximo_pok_id, turno_atual = v_turno + 1 WHERE id = p_batalha_id;
            END IF;
            SELECT 'Pokemon desmaiou! Oponente enviou o próximo pokémon do time!' AS resultado_turno, v_msg AS acao;
            LEAVE proc_label;
        ELSE
            -- Time inteiro foi derrotado! Finalizar Batalha
            IF v_primeiro_defensor_id = v_pok_jog_id THEN
                UPDATE batalha SET status = 'DERROTA_JOGADOR', vencedor_id = v_treinador_opo_id WHERE id = p_batalha_id;
                SELECT 'Todos os seus pokemons foram derrotados! Fim da Batalha (Derrota).' AS resultado_batalha;
            ELSE
                UPDATE batalha SET status = 'VITORIA_JOGADOR', vencedor_id = v_treinador_jog_id WHERE id = p_batalha_id;
                SELECT 'Todos os pokemons do oponente foram derrotados! VOCÊ VENCEU A BATALHA!' AS resultado_batalha;
            END IF;
            LEAVE proc_label;
        END IF;
    END IF;

    -- =========================================================================
    -- EXECUÇÃO DO 2º ATAQUE (Se o defensor do 1º golpe sobreviveu)
    -- =========================================================================
    SELECT poder, precisao, tipo_id, categoria INTO v_poder, v_precisao, v_tipo_mov, v_categoria
    FROM movimento WHERE id = v_segundo_mov_id;

    SELECT pi.nivel, ep.tipo1_id, ep.tipo2_id,
           CASE WHEN v_categoria = 'Special' THEN pi.sp_ataque ELSE pi.ataque END
    INTO v_nivel_atk, v_tipo1_atk, v_tipo2_atk, v_atk_stat
    FROM pokemon_instancia pi
    JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
    WHERE pi.id = v_segundo_atacante_id;

    SELECT CASE WHEN v_categoria = 'Special' THEN pi.sp_defesa ELSE pi.defesa END
    INTO v_def_stat
    FROM pokemon_instancia pi
    WHERE pi.id = v_segundo_defensor_id;

    UPDATE pokemon_movimento_ativo
    SET pp_atual = GREATEST(0, pp_atual - 1)
    WHERE pokemon_instancia_id = v_segundo_atacante_id AND movimento_id = v_segundo_mov_id;

    IF v_tipo_mov = v_tipo1_atk OR (v_tipo2_atk IS NOT NULL AND v_tipo_mov = v_tipo2_atk) THEN
        SET v_stab = 1.50;
    ELSE
        SET v_stab = 1.00;
    END IF;

    SET v_mult_tipo = fn_obter_multiplicador_tipo(v_tipo_mov, v_segundo_defensor_id);

    -- Efeito de Held Item do Atacante (ex: Charcoal, Mystic Water)
    IF (SELECT hi.efeito_tipo FROM pokemon_instancia pi JOIN held_item hi ON pi.held_item_id = hi.id WHERE pi.id = v_segundo_atacante_id) = 'BOOST_TIPO'
       AND (SELECT hi.param_tipo_id FROM pokemon_instancia pi JOIN held_item hi ON pi.held_item_id = hi.id WHERE pi.id = v_segundo_atacante_id) = v_tipo_mov THEN
        SET v_stab = v_stab * 1.10;
    END IF;

    IF v_poder IS NOT NULL AND v_poder > 0 THEN
        SET v_dano = FLOOR((((((2 * v_nivel_atk) / 5) + 2) * v_poder * (v_atk_stat / v_def_stat)) / 50 + 2) * v_stab * v_mult_tipo);
        IF v_mult_tipo > 0 AND v_dano = 0 THEN SET v_dano = 1; END IF;
    ELSE
        SET v_dano = 0;
    END IF;

    -- Calcular novo HP e estado de desmaio do 2º ataque
    UPDATE pokemon_instancia
    SET esta_desmaiado = (hp_atual <= v_dano),
        hp_atual = GREATEST(0, hp_atual - v_dano)
    WHERE id = v_segundo_defensor_id;

    SET v_msg = CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_segundo_atacante_id), ' usou ',
                       (SELECT nome FROM movimento WHERE id = v_segundo_mov_id), '! Dano: ', v_dano);
    IF v_mult_tipo >= 2.0 THEN SET v_msg = CONCAT(v_msg, ' (Super Efetivo!)'); END IF;
    IF v_mult_tipo <= 0.5 AND v_mult_tipo > 0 THEN SET v_msg = CONCAT(v_msg, ' (Não foi muito efetivo...)'); END IF;
    IF v_mult_tipo = 0 THEN SET v_msg = CONCAT(v_msg, ' (Não teve efeito!)'); END IF;

    INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
    VALUES (p_batalha_id, v_turno, 2, v_segundo_atacante_id, v_segundo_defensor_id, v_segundo_mov_id, v_dano, v_mult_tipo, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_segundo_defensor_id), v_msg);

    -- Se o defensor do 2º golpe desmaiou:
    IF (SELECT esta_desmaiado FROM pokemon_instancia WHERE id = v_segundo_defensor_id) = TRUE THEN
        SELECT ep.exp_base, pi.nivel INTO v_base_exp_derrotado, v_nivel_derrotado
        FROM pokemon_instancia pi
        JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
        WHERE pi.id = v_segundo_defensor_id;

        SET v_exp_ganha = FLOOR((1.5 * v_base_exp_derrotado * v_nivel_derrotado) / 7);

        UPDATE pokemon_instancia
        SET experiencia_atual = experiencia_atual + v_exp_ganha
        WHERE id = v_segundo_atacante_id;

        SELECT id INTO v_proximo_pok_id
        FROM pokemon_instancia
        WHERE treinador_id = (SELECT treinador_id FROM pokemon_instancia WHERE id = v_segundo_defensor_id)
          AND esta_desmaiado = FALSE AND posicao_time <= 6
        ORDER BY posicao_time ASC LIMIT 1;

        IF v_proximo_pok_id IS NOT NULL THEN
            IF v_segundo_defensor_id = v_pok_jog_id THEN
                UPDATE batalha SET pokemon_ativo_jogador_id = v_proximo_pok_id, turno_atual = v_turno + 1 WHERE id = p_batalha_id;
            ELSE
                UPDATE batalha SET pokemon_ativo_oponente_id = v_proximo_pok_id, turno_atual = v_turno + 1 WHERE id = p_batalha_id;
            END IF;
            SELECT 'Pokemon desmaiou! Próximo pokémon enviado para batalha!' AS resultado_turno, v_msg AS acao;
            LEAVE proc_label;
        ELSE
            IF v_segundo_defensor_id = v_pok_jog_id THEN
                UPDATE batalha SET status = 'DERROTA_JOGADOR', vencedor_id = v_treinador_opo_id WHERE id = p_batalha_id;
                SELECT 'Todos os seus pokemons foram derrotados! Fim da Batalha (Derrota).' AS resultado_batalha;
            ELSE
                UPDATE batalha SET status = 'VITORIA_JOGADOR', vencedor_id = v_treinador_jog_id WHERE id = p_batalha_id;
                SELECT 'Todos os pokemons do oponente foram derrotados! VOCÊ VENCEU A BATALHA!' AS resultado_batalha;
            END IF;
            LEAVE proc_label;
        END IF;
    END IF;

    -- =========================================================================
    -- FIM DO TURNO: REGENERAÇÃO DE HELD ITEM (LEFTOVERS)
    -- =========================================================================
    IF (SELECT pi.held_item_id FROM pokemon_instancia pi WHERE pi.id = v_pok_jog_id) = 1 THEN
        UPDATE pokemon_instancia SET hp_atual = LEAST(hp_max, hp_atual + FLOOR(hp_max / 16)) WHERE id = v_pok_jog_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 3, v_pok_jog_id, v_pok_jog_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_jog_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_jog_id), ' recuperou um pouco de HP com Leftovers!'));
    END IF;

    IF (SELECT pi.held_item_id FROM pokemon_instancia pi WHERE pi.id = v_pok_opo_id) = 1 THEN
        UPDATE pokemon_instancia SET hp_atual = LEAST(hp_max, hp_atual + FLOOR(hp_max / 16)) WHERE id = v_pok_opo_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 4, v_pok_opo_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_opo_id), ' recuperou um pouco de HP com Leftovers!'));
    END IF;

    -- Ambos sobreviveram ao turno: avança contador de turno
    UPDATE batalha SET turno_atual = v_turno + 1 WHERE id = p_batalha_id;

    SELECT CONCAT('Turno ', v_turno, ' finalizado!') AS status,
           (SELECT CONCAT(apelido, ': ', hp_atual, '/', hp_max, ' HP') FROM pokemon_instancia WHERE id = v_pok_jog_id) AS pokemon_jogador,
           (SELECT CONCAT(apelido, ': ', hp_atual, '/', hp_max, ' HP') FROM pokemon_instancia WHERE id = v_pok_opo_id) AS pokemon_oponente;
END$$

-- -----------------------------------------------------------------------------
-- 9. PROCEDURE: TROCAR POKÉMON ATIVO NA BATALHA (TROCA VOLUNTÁRIA)
-- Mecânica oficial: trocar consome o turno do jogador. O novo pokémon entra e o
-- adversário tem direito ao ataque do turno contra o pokémon que acabou de entrar!
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_trocar_pokemon_batalha$$
CREATE PROCEDURE sp_trocar_pokemon_batalha(
    IN p_batalha_id INT,
    IN p_novo_pokemon_instancia_id INT
)
proc_troca: BEGIN
    DECLARE v_status_batalha VARCHAR(30);
    DECLARE v_turno INT;
    DECLARE v_treinador_jog_id, v_treinador_opo_id INT;
    DECLARE v_pok_antigo_id, v_pok_opo_id INT;
    DECLARE v_novo_dono_id INT;
    DECLARE v_esta_desmaiado BOOLEAN;
    DECLARE v_posicao_time INT;
    DECLARE v_nome_antigo, v_nome_novo VARCHAR(50);
    
    -- Variáveis para retaliação do oponente
    DECLARE v_mov_opo_id INT;
    DECLARE v_poder, v_tipo_mov INT;
    DECLARE v_categoria VARCHAR(20);
    DECLARE v_atk_stat, v_def_stat, v_nivel_atk INT;
    DECLARE v_dano INT;
    DECLARE v_mult_tipo DECIMAL(4,2);
    DECLARE v_stab DECIMAL(3,2);
    DECLARE v_tipo1_atk, v_tipo2_atk INT;
    DECLARE v_msg TEXT;
    DECLARE v_exp_ganha, v_base_exp_derrotado, v_nivel_derrotado INT;
    DECLARE v_proximo_pok_id INT;

    -- Validar batalha
    SELECT status, turno_atual, treinador_jogador_id, treinador_oponente_id, pokemon_ativo_jogador_id, pokemon_ativo_oponente_id
    INTO v_status_batalha, v_turno, v_treinador_jog_id, v_treinador_opo_id, v_pok_antigo_id, v_pok_opo_id
    FROM batalha WHERE id = p_batalha_id;

    IF v_status_batalha != 'EM_ANDAMENTO' THEN
        SELECT 'A batalha já foi finalizada!' AS erro;
        LEAVE proc_troca;
    END IF;

    -- Validar novo pokémon
    SELECT treinador_id, esta_desmaiado, posicao_time, apelido
    INTO v_novo_dono_id, v_esta_desmaiado, v_posicao_time, v_nome_novo
    FROM pokemon_instancia WHERE id = p_novo_pokemon_instancia_id;

    IF v_novo_dono_id IS NULL OR v_novo_dono_id != v_treinador_jog_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Esse pokémon não pertence a você!';
    END IF;

    IF p_novo_pokemon_instancia_id = v_pok_antigo_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Esse pokémon já é o pokémon ativo em campo!';
    END IF;

    IF v_posicao_time > 6 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Esse pokémon está no PC (Box), fora do seu time de 6!';
    END IF;

    IF v_esta_desmaiado = TRUE THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Esse pokémon está desmaiado e não pode entrar!';
    END IF;

    SELECT apelido INTO v_nome_antigo FROM pokemon_instancia WHERE id = v_pok_antigo_id;

    -- Efetua a troca no campo
    UPDATE batalha SET pokemon_ativo_jogador_id = p_novo_pokemon_instancia_id WHERE id = p_batalha_id;

    SET v_msg = CONCAT('Red recolheu ', v_nome_antigo, ' e enviou ', v_nome_novo, '!');
    INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
    VALUES (p_batalha_id, v_turno, 1, p_novo_pokemon_instancia_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = p_novo_pokemon_instancia_id), v_msg);

    -- Oponente ataca quem acabou de entrar (regra clássica dos jogos Pokémon)
    SELECT movimento_id INTO v_mov_opo_id
    FROM pokemon_movimento_ativo
    WHERE pokemon_instancia_id = v_pok_opo_id AND pp_atual > 0
    ORDER BY RAND() LIMIT 1;
    IF v_mov_opo_id IS NULL THEN SET v_mov_opo_id = 33; END IF;

    SELECT poder, tipo_id, categoria INTO v_poder, v_tipo_mov, v_categoria FROM movimento WHERE id = v_mov_opo_id;
    SELECT pi.nivel, ep.tipo1_id, ep.tipo2_id,
           CASE WHEN v_categoria = 'Special' THEN pi.sp_ataque ELSE pi.ataque END
    INTO v_nivel_atk, v_tipo1_atk, v_tipo2_atk, v_atk_stat
    FROM pokemon_instancia pi
    JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
    WHERE pi.id = v_pok_opo_id;

    SELECT CASE WHEN v_categoria = 'Special' THEN pi.sp_defesa ELSE pi.defesa END
    INTO v_def_stat
    FROM pokemon_instancia pi WHERE pi.id = p_novo_pokemon_instancia_id;

    UPDATE pokemon_movimento_ativo SET pp_atual = GREATEST(0, pp_atual - 1)
    WHERE pokemon_instancia_id = v_pok_opo_id AND movimento_id = v_mov_opo_id;

    IF v_tipo_mov = v_tipo1_atk OR (v_tipo2_atk IS NOT NULL AND v_tipo_mov = v_tipo2_atk) THEN SET v_stab = 1.50; ELSE SET v_stab = 1.00; END IF;
    SET v_mult_tipo = fn_obter_multiplicador_tipo(v_tipo_mov, p_novo_pokemon_instancia_id);

    IF v_poder IS NOT NULL AND v_poder > 0 THEN
        SET v_dano = FLOOR((((((2 * v_nivel_atk) / 5) + 2) * v_poder * (v_atk_stat / v_def_stat)) / 50 + 2) * v_stab * v_mult_tipo);
        IF v_mult_tipo > 0 AND v_dano = 0 THEN SET v_dano = 1; END IF;
    ELSE
        SET v_dano = 0;
    END IF;

    UPDATE pokemon_instancia
    SET esta_desmaiado = (hp_atual <= v_dano),
        hp_atual = GREATEST(0, hp_atual - v_dano)
    WHERE id = p_novo_pokemon_instancia_id;

    SET v_msg = CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_opo_id), ' atacou ', v_nome_novo,
                       ' com ', (SELECT nome FROM movimento WHERE id = v_mov_opo_id), '! Dano: ', v_dano);
    IF v_mult_tipo >= 2.0 THEN SET v_msg = CONCAT(v_msg, ' (Super Efetivo!)'); END IF;
    IF v_mult_tipo <= 0.5 AND v_mult_tipo > 0 THEN SET v_msg = CONCAT(v_msg, ' (Não foi muito efetivo...)'); END IF;

    INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
    VALUES (p_batalha_id, v_turno, 2, v_pok_opo_id, p_novo_pokemon_instancia_id, v_mov_opo_id, v_dano, v_mult_tipo, (SELECT hp_atual FROM pokemon_instancia WHERE id = p_novo_pokemon_instancia_id), v_msg);

    IF (SELECT esta_desmaiado FROM pokemon_instancia WHERE id = p_novo_pokemon_instancia_id) = TRUE THEN
        SELECT ep.exp_base, pi.nivel INTO v_base_exp_derrotado, v_nivel_derrotado
        FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
        WHERE pi.id = p_novo_pokemon_instancia_id;
        SET v_exp_ganha = FLOOR((1.5 * v_base_exp_derrotado * v_nivel_derrotado) / 7);
        UPDATE pokemon_instancia SET experiencia_atual = experiencia_atual + v_exp_ganha WHERE id = v_pok_opo_id;

        SELECT id INTO v_proximo_pok_id FROM pokemon_instancia
        WHERE treinador_id = v_treinador_jog_id AND esta_desmaiado = FALSE AND posicao_time <= 6 ORDER BY posicao_time ASC LIMIT 1;

        IF v_proximo_pok_id IS NOT NULL THEN
            UPDATE batalha SET pokemon_ativo_jogador_id = v_proximo_pok_id, turno_atual = v_turno + 1 WHERE id = p_batalha_id;
            SELECT 'O pokémon trocado desmaiou ao entrar! Próximo pokémon convocado.' AS resultado_turno, v_msg AS acao;
            LEAVE proc_troca;
        ELSE
            UPDATE batalha SET status = 'DERROTA_JOGADOR', vencedor_id = v_treinador_opo_id WHERE id = p_batalha_id;
            SELECT 'Todos os seus pokemons desmaiaram! Fim da Batalha.' AS resultado_batalha;
            LEAVE proc_troca;
        END IF;
    END IF;

    UPDATE batalha SET turno_atual = v_turno + 1 WHERE id = p_batalha_id;
    SELECT CONCAT('Troca realizada com sucesso no Turno ', v_turno, '!') AS status,
           (SELECT CONCAT(apelido, ': ', hp_atual, '/', hp_max, ' HP') FROM pokemon_instancia WHERE id = p_novo_pokemon_instancia_id) AS pokemon_jogador,
           (SELECT CONCAT(apelido, ': ', hp_atual, '/', hp_max, ' HP') FROM pokemon_instancia WHERE id = v_pok_opo_id) AS pokemon_oponente;
END$$

-- -----------------------------------------------------------------------------
-- 10. PROCEDURE: ENFERMEIRA JOY (CENTRO POKÉMON)
-- Cura completamente todo o time de um treinador:
-- - Restaura HP Atual para HP Máximo
-- - Remove estado de desmaio (esta_desmaiado = FALSE)
-- - Restaura o PP de todos os golpes para o PP Máximo
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_enfermeira_joy$$
CREATE PROCEDURE sp_enfermeira_joy(IN p_treinador_id INT)
BEGIN
    DECLARE v_nome_treinador VARCHAR(50);
    DECLARE v_em_batalha INT;

    SELECT nome INTO v_nome_treinador FROM treinador WHERE id = p_treinador_id;
    IF v_nome_treinador IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Treinador não encontrado!';
    END IF;

    -- Validar se o treinador está participando de uma batalha em andamento
    SELECT COUNT(*) INTO v_em_batalha
    FROM batalha
    WHERE status = 'EM_ANDAMENTO'
      AND (treinador_jogador_id = p_treinador_id OR treinador_oponente_id = p_treinador_id);

    IF v_em_batalha > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Enfermeira Joy: "Você está no meio de uma batalha! Termine seu combate antes de vir ao Centro Pokémon."';
    END IF;

    -- 1. Curar HP de todos os pokémons do treinador e reviver os desmaiados
    UPDATE pokemon_instancia
    SET hp_atual = hp_max,
        esta_desmaiado = FALSE
    WHERE treinador_id = p_treinador_id;

    -- 2. Restaurar PP de todos os movimentos ativos para o máximo
    UPDATE pokemon_movimento_ativo pma
    JOIN pokemon_instancia pi ON pma.pokemon_instancia_id = pi.id
    JOIN movimento m ON pma.movimento_id = m.id
    SET pma.pp_atual = m.pp_maximo
    WHERE pi.treinador_id = p_treinador_id;

    -- Mensagem clássica da Enfermeira Joy
    SELECT CONCAT('Enfermeira Joy: "Olá, ', v_nome_treinador, '! Seus pokémons foram totalmente curados e os PPs restaurados. Esperamos vê-lo novamente!"') AS centro_pokemon;
END$$

-- -----------------------------------------------------------------------------
-- 11. PROCEDURE: TROCAR / ENSINAR MOVIMENTO A UM POKÉMON
-- Substitui um movimento atual por um novo movimento compatível:
-- Parâmetros:
--   - p_pokemon_instancia_id: ID do pokémon que vai aprender
--   - p_movimento_atual_id: ID do golpe antigo que será substituído
--   - p_novo_movimento_id: ID do novo golpe que será aprendido
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_trocar_movimento_pokemon$$
CREATE PROCEDURE sp_trocar_movimento_pokemon(
    IN p_pokemon_instancia_id INT,
    IN p_movimento_atual_id INT,
    IN p_novo_movimento_id INT
)
proc_mov: BEGIN
    DECLARE v_especie_id INT;
    DECLARE v_nivel_pokemon INT;
    DECLARE v_slot INT;
    DECLARE v_compativel INT;
    DECLARE v_ja_tem INT;
    DECLARE v_pp_max INT;
    DECLARE v_nome_pok VARCHAR(50);
    DECLARE v_nome_antigo VARCHAR(50);
    DECLARE v_nome_novo VARCHAR(50);

    -- 1. Validar pokémon
    SELECT especie_id, nivel, apelido
    INTO v_especie_id, v_nivel_pokemon, v_nome_pok
    FROM pokemon_instancia WHERE id = p_pokemon_instancia_id;

    IF v_especie_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pokémon não encontrado!';
    END IF;

    -- 2. Validar se o pokémon realmente possui o movimento atual equipado
    SELECT slot_numero INTO v_slot
    FROM pokemon_movimento_ativo
    WHERE pokemon_instancia_id = p_pokemon_instancia_id AND movimento_id = p_movimento_atual_id;

    IF v_slot IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O pokémon não possui esse movimento atual equipado para ser substituído!';
    END IF;

    -- 3. Validar se o pokémon já não possui esse novo movimento equipado em outro slot
    SELECT COUNT(*) INTO v_ja_tem
    FROM pokemon_movimento_ativo
    WHERE pokemon_instancia_id = p_pokemon_instancia_id AND movimento_id = p_novo_movimento_id;

    IF v_ja_tem > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O pokémon já conhece este movimento em um de seus slots ativos!';
    END IF;

    -- 4. Validar se o novo movimento é compatível com a espécie e nível
    SELECT COUNT(*) INTO v_compativel
    FROM especie_movimento_nivel
    WHERE especie_id = v_especie_id 
      AND movimento_id = p_novo_movimento_id
      AND nivel_aprendizado <= v_nivel_pokemon;

    IF v_compativel = 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Movimento incompatível! Esse pokémon não pode aprender este golpe no seu nível atual.';
    END IF;

    -- 5. Obter nomes e PP máximo do novo golpe
    SELECT nome INTO v_nome_antigo FROM movimento WHERE id = p_movimento_atual_id;
    SELECT nome, pp_maximo INTO v_nome_novo, v_pp_max FROM movimento WHERE id = p_novo_movimento_id;

    -- 6. Realizar a substituição no slot
    UPDATE pokemon_movimento_ativo
    SET movimento_id = p_novo_movimento_id,
        pp_atual = v_pp_max
    WHERE pokemon_instancia_id = p_pokemon_instancia_id AND slot_numero = v_slot;

    SELECT CONCAT('1, 2 e... Poof! ', v_nome_pok, ' esqueceu ', v_nome_antigo, ' e aprendeu ', v_nome_novo, '!') AS resultado_aprendizado;
END$$

-- -----------------------------------------------------------------------------
-- 12. PROCEDURE: EQUIPAR HELD ITEM (ITEM SEGURADO)
-- REGRA MANDATÓRIA: SÓ PODE SER ALTERADO FORA DE BATALHA!
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_equipar_held_item$$
CREATE PROCEDURE sp_equipar_held_item(
    IN p_pokemon_instancia_id INT,
    IN p_held_item_id INT
)
BEGIN
    DECLARE v_treinador_id INT;
    DECLARE v_em_batalha INT;
    DECLARE v_nome_item VARCHAR(50);
    DECLARE v_nome_pok VARCHAR(50);

    -- 1. Validar pokémon e obter dono
    SELECT treinador_id, apelido INTO v_treinador_id, v_nome_pok
    FROM pokemon_instancia WHERE id = p_pokemon_instancia_id;

    IF v_treinador_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pokémon não encontrado!';
    END IF;

    -- 2. BLOQUEIO: Só pode alterar fora de batalha!
    SELECT COUNT(*) INTO v_em_batalha
    FROM batalha
    WHERE status = 'EM_ANDAMENTO'
      AND (treinador_jogador_id = v_treinador_id OR treinador_oponente_id = v_treinador_id);

    IF v_em_batalha > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não é possível alterar held item durante uma batalha! Equipamentos só podem ser alterados fora de combate.';
    END IF;

    -- 3. Validar item
    SELECT nome INTO v_nome_item FROM held_item WHERE id = p_held_item_id;
    IF v_nome_item IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Held Item não encontrado!';
    END IF;

    -- 4. Equipar item
    UPDATE pokemon_instancia
    SET held_item_id = p_held_item_id
    WHERE id = p_pokemon_instancia_id;

    SELECT CONCAT(v_nome_pok, ' agora está segurando: ', v_nome_item, '!') AS status_held_item;
END$$

-- -----------------------------------------------------------------------------
-- 13. PROCEDURE: REMOVER HELD ITEM
-- REGRA MANDATÓRIA: SÓ PODE SER REMOVIDO FORA DE BATALHA!
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_remover_held_item$$
CREATE PROCEDURE sp_remover_held_item(
    IN p_pokemon_instancia_id INT
)
BEGIN
    DECLARE v_treinador_id INT;
    DECLARE v_em_batalha INT;
    DECLARE v_nome_pok VARCHAR(50);

    SELECT treinador_id, apelido INTO v_treinador_id, v_nome_pok
    FROM pokemon_instancia WHERE id = p_pokemon_instancia_id;

    IF v_treinador_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pokémon não encontrado!';
    END IF;

    SELECT COUNT(*) INTO v_em_batalha
    FROM batalha
    WHERE status = 'EM_ANDAMENTO'
      AND (treinador_jogador_id = v_treinador_id OR treinador_oponente_id = v_treinador_id);

    IF v_em_batalha > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não é possível remover held item durante uma batalha! Equipamentos só podem ser alterados fora de combate.';
    END IF;

    UPDATE pokemon_instancia
    SET held_item_id = NULL
    WHERE id = p_pokemon_instancia_id;

    SELECT CONCAT('Item segurado removido de ', v_nome_pok, '.') AS status_held_item;
END$$

-- -----------------------------------------------------------------------------
-- 14. PROCEDURE: USAR ITEM DA MOCHILA EM BATALHA
-- Mecânica oficial: usar um item (Potion, Revive, etc.) gasta a ação do turno do jogador.
-- O item é aplicado no pokémon alvo, 1 unidade é debitada da mochila, e o oponente ataca!
-- -----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_usar_item_batalha$$
CREATE PROCEDURE sp_usar_item_batalha(
    IN p_batalha_id INT,
    IN p_item_id INT,
    IN p_pokemon_alvo_id INT
)
proc_item: BEGIN
    DECLARE v_status_batalha VARCHAR(30);
    DECLARE v_turno INT;
    DECLARE v_treinador_jog_id, v_treinador_opo_id INT;
    DECLARE v_pok_ativo_jog_id, v_pok_opo_id INT;
    
    DECLARE v_qtd_item INT DEFAULT 0;
    DECLARE v_nome_item VARCHAR(50);
    DECLARE v_efeito_tipo VARCHAR(30);
    DECLARE v_valor_efeito INT;
    DECLARE v_eh_porcentagem BOOLEAN;
    
    DECLARE v_alvo_treinador INT;
    DECLARE v_alvo_hp_atual, v_alvo_hp_max INT;
    DECLARE v_alvo_desmaiado BOOLEAN;
    DECLARE v_alvo_nome VARCHAR(50);
    DECLARE v_cura_real INT;

    -- Variáveis de retaliação do oponente
    DECLARE v_mov_opo_id, v_poder, v_tipo_mov INT;
    DECLARE v_categoria VARCHAR(20);
    DECLARE v_atk_stat, v_def_stat, v_nivel_atk, v_dano INT;
    DECLARE v_mult_tipo DECIMAL(4,2);
    DECLARE v_stab DECIMAL(3,2);
    DECLARE v_tipo1_atk, v_tipo2_atk INT;
    DECLARE v_msg TEXT;
    DECLARE v_exp_ganha, v_base_exp_derrotado, v_nivel_derrotado, v_proximo_pok_id INT;

    -- 1. Validar batalha
    SELECT status, turno_atual, treinador_jogador_id, treinador_oponente_id, pokemon_ativo_jogador_id, pokemon_ativo_oponente_id
    INTO v_status_batalha, v_turno, v_treinador_jog_id, v_treinador_opo_id, v_pok_ativo_jog_id, v_pok_opo_id
    FROM batalha WHERE id = p_batalha_id;

    IF v_status_batalha != 'EM_ANDAMENTO' THEN
        SELECT 'A batalha já foi finalizada!' AS erro;
        LEAVE proc_item;
    END IF;

    -- 2. Validar item na mochila do jogador
    SELECT tm.quantidade, i.nome, i.efeito_tipo, i.valor_efeito, i.eh_porcentagem
    INTO v_qtd_item, v_nome_item, v_efeito_tipo, v_valor_efeito, v_eh_porcentagem
    FROM treinador_mochila tm
    JOIN item_inventario i ON tm.item_id = i.id
    WHERE tm.treinador_id = v_treinador_jog_id AND tm.item_id = p_item_id;

    IF v_qtd_item <= 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Você não possui este item na sua mochila!';
    END IF;

    -- 3. Validar pokémon alvo
    SELECT treinador_id, hp_atual, hp_max, esta_desmaiado, apelido
    INTO v_alvo_treinador, v_alvo_hp_atual, v_alvo_hp_max, v_alvo_desmaiado, v_alvo_nome
    FROM pokemon_instancia WHERE id = p_pokemon_alvo_id;

    IF v_alvo_treinador != v_treinador_jog_id THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Você só pode usar itens nos pokémons do seu próprio time!';
    END IF;

    -- 4. Aplicar efeito do item
    IF v_efeito_tipo = 'CURA_HP' THEN
        IF v_alvo_desmaiado = TRUE THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este pokémon está desmaiado! Use um Revive para revivê-lo.';
        END IF;
        IF v_alvo_hp_atual >= v_alvo_hp_max THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O HP deste pokémon já está no máximo!';
        END IF;

        IF v_eh_porcentagem = TRUE THEN
            SET v_cura_real = v_alvo_hp_max;
        ELSE
            SET v_cura_real = v_valor_efeito;
        END IF;

        UPDATE pokemon_instancia
        SET hp_atual = LEAST(hp_max, hp_atual + v_cura_real)
        WHERE id = p_pokemon_alvo_id;

        SET v_msg = CONCAT('Red usou ', v_nome_item, ' em ', v_alvo_nome, '! HP restaurado.');

    ELSEIF v_efeito_tipo = 'REVIVE' THEN
        IF v_alvo_desmaiado = FALSE THEN
            SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Este pokémon não está desmaiado!';
        END IF;

        IF v_eh_porcentagem = TRUE THEN
            SET v_cura_real = FLOOR((v_alvo_hp_max * v_valor_efeito) / 100);
        ELSE
            SET v_cura_real = v_valor_efeito;
        END IF;

        UPDATE pokemon_instancia
        SET esta_desmaiado = FALSE,
            hp_atual = v_cura_real
        WHERE id = p_pokemon_alvo_id;

        SET v_msg = CONCAT('Red usou ', v_nome_item, ' em ', v_alvo_nome, '! Pokémon reviveu com ', v_cura_real, ' HP.');

    ELSEIF v_efeito_tipo = 'RESTAURA_PP' THEN
        UPDATE pokemon_movimento_ativo pma
        JOIN movimento m ON pma.movimento_id = m.id
        SET pma.pp_atual = LEAST(m.pp_maximo, pma.pp_atual + v_valor_efeito)
        WHERE pma.pokemon_instancia_id = p_pokemon_alvo_id;

        SET v_msg = CONCAT('Red usou ', v_nome_item, ' em ', v_alvo_nome, '! PPs restaurados.');
    END IF;

    -- 5. Consumir 1 unidade do item
    UPDATE treinador_mochila
    SET quantidade = quantidade - 1
    WHERE treinador_id = v_treinador_jog_id AND item_id = p_item_id;

    -- Gravar ação do jogador no log
    INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
    VALUES (p_batalha_id, v_turno, 1, v_pok_ativo_jog_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_ativo_jog_id), v_msg);

    -- 6. Retaliação do oponente (regra oficial: usar item consome o turno!)
    SELECT movimento_id INTO v_mov_opo_id
    FROM pokemon_movimento_ativo
    WHERE pokemon_instancia_id = v_pok_opo_id AND pp_atual > 0
    ORDER BY RAND() LIMIT 1;
    IF v_mov_opo_id IS NULL THEN SET v_mov_opo_id = 33; END IF;

    SELECT poder, tipo_id, categoria INTO v_poder, v_tipo_mov, v_categoria FROM movimento WHERE id = v_mov_opo_id;
    SELECT pi.nivel, ep.tipo1_id, ep.tipo2_id,
           CASE WHEN v_categoria = 'Special' THEN pi.sp_ataque ELSE pi.ataque END
    INTO v_nivel_atk, v_tipo1_atk, v_tipo2_atk, v_atk_stat
    FROM pokemon_instancia pi
    JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
    WHERE pi.id = v_pok_opo_id;

    SELECT CASE WHEN v_categoria = 'Special' THEN pi.sp_defesa ELSE pi.defesa END
    INTO v_def_stat
    FROM pokemon_instancia pi WHERE pi.id = v_pok_ativo_jog_id;

    UPDATE pokemon_movimento_ativo SET pp_atual = GREATEST(0, pp_atual - 1)
    WHERE pokemon_instancia_id = v_pok_opo_id AND movimento_id = v_mov_opo_id;

    IF v_tipo_mov = v_tipo1_atk OR (v_tipo2_atk IS NOT NULL AND v_tipo_mov = v_tipo2_atk) THEN SET v_stab = 1.50; ELSE SET v_stab = 1.00; END IF;
    SET v_mult_tipo = fn_obter_multiplicador_tipo(v_tipo_mov, v_pok_ativo_jog_id);

    IF v_poder IS NOT NULL AND v_poder > 0 THEN
        SET v_dano = FLOOR((((((2 * v_nivel_atk) / 5) + 2) * v_poder * (v_atk_stat / v_def_stat)) / 50 + 2) * v_stab * v_mult_tipo);
        IF v_mult_tipo > 0 AND v_dano = 0 THEN SET v_dano = 1; END IF;
    ELSE
        SET v_dano = 0;
    END IF;

    UPDATE pokemon_instancia
    SET esta_desmaiado = (hp_atual <= v_dano),
        hp_atual = GREATEST(0, hp_atual - v_dano)
    WHERE id = v_pok_ativo_jog_id;

    SET v_msg = CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_opo_id), ' atacou ',
                       (SELECT apelido FROM pokemon_instancia WHERE id = v_pok_ativo_jog_id),
                       ' com ', (SELECT nome FROM movimento WHERE id = v_mov_opo_id), '! Dano: ', v_dano);
    IF v_mult_tipo >= 2.0 THEN SET v_msg = CONCAT(v_msg, ' (Super Efetivo!)'); END IF;
    IF v_mult_tipo <= 0.5 AND v_mult_tipo > 0 THEN SET v_msg = CONCAT(v_msg, ' (Não foi muito efetivo...)'); END IF;

    INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
    VALUES (p_batalha_id, v_turno, 2, v_pok_opo_id, v_pok_ativo_jog_id, v_mov_opo_id, v_dano, v_mult_tipo, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_ativo_jog_id), v_msg);

    -- Checar se o pokémon ativo do jogador desmaiou com a retaliação
    IF (SELECT esta_desmaiado FROM pokemon_instancia WHERE id = v_pok_ativo_jog_id) = TRUE THEN
        SELECT ep.exp_base, pi.nivel INTO v_base_exp_derrotado, v_nivel_derrotado
        FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
        WHERE pi.id = v_pok_ativo_jog_id;
        SET v_exp_ganha = FLOOR((1.5 * v_base_exp_derrotado * v_nivel_derrotado) / 7);
        UPDATE pokemon_instancia SET experiencia_atual = experiencia_atual + v_exp_ganha WHERE id = v_pok_opo_id;

        SELECT id INTO v_proximo_pok_id FROM pokemon_instancia
        WHERE treinador_id = v_treinador_jog_id AND esta_desmaiado = FALSE AND posicao_time <= 6 ORDER BY posicao_time ASC LIMIT 1;

        IF v_proximo_pok_id IS NOT NULL THEN
            UPDATE batalha SET pokemon_ativo_jogador_id = v_proximo_pok_id, turno_atual = v_turno + 1 WHERE id = p_batalha_id;
            SELECT 'Item usado! Seu pokémon ativo desmaiou e o próximo entrou em campo.' AS resultado_turno, v_msg AS retaliação;
            LEAVE proc_item;
        ELSE
            UPDATE batalha SET status = 'DERROTA_JOGADOR', vencedor_id = v_treinador_opo_id WHERE id = p_batalha_id;
            SELECT 'Todos os seus pokemons desmaiaram! Fim da Batalha.' AS resultado_batalha;
            LEAVE proc_item;
        END IF;
    END IF;

    UPDATE batalha SET turno_atual = v_turno + 1 WHERE id = p_batalha_id;
    SELECT CONCAT('Item usado no Turno ', v_turno, '!') AS status,
           (SELECT CONCAT(apelido, ': ', hp_atual, '/', hp_max, ' HP') FROM pokemon_instancia WHERE id = v_pok_ativo_jog_id) AS pokemon_jogador,
           (SELECT CONCAT(apelido, ': ', hp_atual, '/', hp_max, ' HP') FROM pokemon_instancia WHERE id = v_pok_opo_id) AS pokemon_oponente;
END$$

DELIMITER ;
