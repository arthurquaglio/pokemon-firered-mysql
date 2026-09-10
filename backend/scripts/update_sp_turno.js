import pool from '../src/config/database.js';

const spTurnoSQL = `
CREATE PROCEDURE sp_executar_turno_batalha(
    IN p_batalha_id INT,
    IN p_movimento_jogador_id INT
)
proc_label: BEGIN
    -- Variáveis de Estado da Batalha
    DECLARE v_status_batalha VARCHAR(30);
    DECLARE v_turno, v_treinador_jog_id, v_treinador_opo_id, v_pok_jog_id, v_pok_opo_id INT;
    DECLARE v_speed_jog, v_speed_opo, v_mov_opo_id INT;
    DECLARE v_prio_jog, v_prio_opo INT DEFAULT 0;
    DECLARE v_clima VARCHAR(30);
    DECLARE v_turnos_clima INT;

    -- Variáveis dos Atacantes
    DECLARE v_primeiro_atacante_id, v_segundo_atacante_id INT;
    DECLARE v_primeiro_defensor_id, v_segundo_defensor_id INT;
    DECLARE v_primeiro_mov_id, v_segundo_mov_id INT;

    -- Variáveis de Execução de Golpe
    DECLARE v_poder, v_precisao, v_tipo_mov, v_nivel_atk, v_atk_stat, v_def_stat, v_dano INT;
    DECLARE v_categoria, v_efeito_mov, v_hab_atk, v_hab_def VARCHAR(40);
    DECLARE v_chance_mov, v_valor_mov INT;
    DECLARE v_mult_tipo, v_mult_clima, v_stab DECIMAL(4,2);
    DECLARE v_tipo1_atk, v_tipo2_atk, v_tipo1_def, v_tipo2_def INT;
    DECLARE v_atk_nome, v_def_nome, v_mov_nome VARCHAR(50);
    DECLARE v_cond_atk, v_cond_def VARCHAR(30);
    DECLARE v_turnos_sono_atk INT;
    DECLARE v_hp_max_atk, v_hp_atual_atk, v_hp_max_def, v_hp_atual_def INT;
    DECLARE v_msg TEXT;
    DECLARE v_pulo_ataque BOOLEAN DEFAULT FALSE;

    -- Variáveis de EXP e Fim de Combate
    DECLARE v_exp_ganha, v_base_exp_derrotado, v_nivel_derrotado, v_proximo_pok_id INT;

    -- 1. Validar Batalha
    SELECT status, turno_atual, treinador_jogador_id, treinador_oponente_id, 
           pokemon_ativo_jogador_id, pokemon_ativo_oponente_id, clima, turnos_clima
    INTO v_status_batalha, v_turno, v_treinador_jog_id, v_treinador_opo_id, 
         v_pok_jog_id, v_pok_opo_id, v_clima, v_turnos_clima
    FROM batalha WHERE id = p_batalha_id;

    IF v_status_batalha != 'EM_ANDAMENTO' THEN
        SELECT CONCAT('A batalha já terminou! Vencedor: ', IFNULL((SELECT nome FROM treinador WHERE id = (SELECT vencedor_id FROM batalha WHERE id = p_batalha_id)), 'Ninguém')) AS status;
        LEAVE proc_label;
    END IF;

    -- 2. Selecionar golpe do adversário
    SELECT movimento_id INTO v_mov_opo_id
    FROM pokemon_movimento_ativo
    WHERE pokemon_instancia_id = v_pok_opo_id AND pp_atual > 0
    ORDER BY RAND() LIMIT 1;

    IF v_mov_opo_id IS NULL THEN
        SET v_mov_opo_id = 33; -- Tackle
    END IF;

    -- 3. Obter prioridades dos golpes
    SELECT prioridade INTO v_prio_jog FROM movimento WHERE id = p_movimento_jogador_id;
    SELECT prioridade INTO v_prio_opo FROM movimento WHERE id = v_mov_opo_id;

    -- 4. Obter Velocidades ajustadas por modificadores, clima e paralisia
    SELECT fn_calcular_stat_com_estagio(pi.velocidade, pi.mod_velocidade) INTO v_speed_jog FROM pokemon_instancia pi WHERE pi.id = v_pok_jog_id;
    SELECT fn_calcular_stat_com_estagio(pi.velocidade, pi.mod_velocidade) INTO v_speed_opo FROM pokemon_instancia pi WHERE pi.id = v_pok_opo_id;

    -- Clima + Habilidade de Velocidade
    IF v_clima = 'CHUVA' AND (SELECT h.efeito_tipo FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_pok_jog_id) = 'SWIFT_SWIM' THEN
        SET v_speed_jog = v_speed_jog * 2;
    END IF;
    IF v_clima = 'CHUVA' AND (SELECT h.efeito_tipo FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_pok_opo_id) = 'SWIFT_SWIM' THEN
        SET v_speed_opo = v_speed_opo * 2;
    END IF;
    IF v_clima = 'SOL' AND (SELECT h.efeito_tipo FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_pok_jog_id) = 'CHLOROPHYLL' THEN
        SET v_speed_jog = v_speed_jog * 2;
    END IF;
    IF v_clima = 'SOL' AND (SELECT h.efeito_tipo FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_pok_opo_id) = 'CHLOROPHYLL' THEN
        SET v_speed_opo = v_speed_opo * 2;
    END IF;

    -- Redução de Velocidade por Paralisia
    IF (SELECT condicao_status FROM pokemon_instancia WHERE id = v_pok_jog_id) = 'PARALISIA' THEN
        SET v_speed_jog = FLOOR(v_speed_jog * 0.5);
    END IF;
    IF (SELECT condicao_status FROM pokemon_instancia WHERE id = v_pok_opo_id) = 'PARALISIA' THEN
        SET v_speed_opo = FLOOR(v_speed_opo * 0.5);
    END IF;

    -- Ordem dos Atacantes
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
    -- 1º ATAQUE
    -- =========================================================================
    SET v_pulo_ataque = FALSE;
    SET v_msg = '';

    SELECT apelido, condicao_status, turnos_sono, hp_atual, hp_max
    INTO v_atk_nome, v_cond_atk, v_turnos_sono_atk, v_hp_atual_atk, v_hp_max_atk
    FROM pokemon_instancia WHERE id = v_primeiro_atacante_id;

    SELECT apelido, condicao_status, hp_atual, hp_max
    INTO v_def_nome, v_cond_def, v_hp_atual_def, v_hp_max_def
    FROM pokemon_instancia WHERE id = v_primeiro_defensor_id;

    SELECT h.efeito_tipo INTO v_hab_atk FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_primeiro_atacante_id;
    SELECT h.efeito_tipo INTO v_hab_def FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_primeiro_defensor_id;

    SELECT poder, precisao, tipo_id, categoria, efeito_tipo, efeito_chance, efeito_valor, nome
    INTO v_poder, v_precisao, v_tipo_mov, v_categoria, v_efeito_mov, v_chance_mov, v_valor_mov, v_mov_nome
    FROM movimento WHERE id = v_primeiro_mov_id;

    -- Checagem de Sono
    IF v_cond_atk = 'SONO' THEN
        IF v_turnos_sono_atk > 1 THEN
            UPDATE pokemon_instancia SET turnos_sono = turnos_sono - 1 WHERE id = v_primeiro_atacante_id;
            SET v_msg = CONCAT(v_atk_nome, ' está dormindo profundamente!');
            SET v_pulo_ataque = TRUE;
        ELSE
            UPDATE pokemon_instancia SET condicao_status = 'NENHUM', turnos_sono = 0 WHERE id = v_primeiro_atacante_id;
            SET v_msg = CONCAT(v_atk_nome, ' acordou! ');
        END IF;
    END IF;

    -- Checagem de Paralisia
    IF v_pulo_ataque = FALSE AND v_cond_atk = 'PARALISIA' AND RAND() < 0.25 THEN
        SET v_msg = CONCAT(v_atk_nome, ' está totalmente paralisado e não pode se mover!');
        SET v_pulo_ataque = TRUE;
    END IF;

    -- Checagem de Congelamento
    IF v_pulo_ataque = FALSE AND v_cond_atk = 'CONGELAMENTO' THEN
        IF RAND() < 0.80 THEN
            SET v_msg = CONCAT(v_atk_nome, ' está congelado solidamente!');
            SET v_pulo_ataque = TRUE;
        ELSE
            UPDATE pokemon_instancia SET condicao_status = 'NENHUM' WHERE id = v_primeiro_atacante_id;
            SET v_msg = CONCAT(v_atk_nome, ' descongelou! ');
        END IF;
    END IF;

    IF v_pulo_ataque = TRUE THEN
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 1, v_primeiro_atacante_id, v_primeiro_defensor_id, v_primeiro_mov_id, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_primeiro_defensor_id), v_msg);
    ELSE
        -- Descontar PP
        UPDATE pokemon_movimento_ativo
        SET pp_atual = GREATEST(0, pp_atual - 1)
        WHERE pokemon_instancia_id = v_primeiro_atacante_id AND movimento_id = v_primeiro_mov_id;

        -- Checar Imunidade por Levitate contra golpes de Terra
        SET v_mult_tipo = fn_obter_multiplicador_tipo(v_tipo_mov, v_primeiro_defensor_id);
        IF v_tipo_mov = 5 AND v_hab_def = 'LEVITATE' THEN
            SET v_mult_tipo = 0.00;
        END IF;

        -- GOLPE DE STATUS OU CAMPO (DANO 0)
        IF v_categoria = 'Status' OR v_poder IS NULL OR v_poder = 0 THEN
            SET v_dano = 0;
            SET v_msg = CONCAT(v_msg, v_atk_nome, ' usou ', v_mov_nome, '!');

            IF v_mult_tipo = 0.00 THEN
                SET v_msg = CONCAT(v_msg, ' Não teve efeito contra ', v_def_nome, '!');
            ELSE
                -- Clima
                IF v_efeito_mov = 'CLIMA_CHUVA' THEN
                    UPDATE batalha SET clima = 'CHUVA', turnos_clima = 5 WHERE id = p_batalha_id;
                    SET v_clima = 'CHUVA'; SET v_turnos_clima = 5;
                    SET v_msg = CONCAT(v_msg, ' Começou a chover forte!');
                ELSEIF v_efeito_mov = 'CLIMA_SOL' THEN
                    UPDATE batalha SET clima = 'SOL', turnos_clima = 5 WHERE id = p_batalha_id;
                    SET v_clima = 'SOL'; SET v_turnos_clima = 5;
                    SET v_msg = CONCAT(v_msg, ' A luz do sol ficou extremamente intensa!');
                ELSEIF v_efeito_mov = 'CLIMA_AREIA' THEN
                    UPDATE batalha SET clima = 'TEMPESTADE_AREIA', turnos_clima = 5 WHERE id = p_batalha_id;
                    SET v_clima = 'TEMPESTADE_AREIA'; SET v_turnos_clima = 5;
                    SET v_msg = CONCAT(v_msg, ' Uma tempestade de areia começou a soprar!');
                ELSEIF v_efeito_mov = 'CLIMA_GRANIZO' THEN
                    UPDATE batalha SET clima = 'GRANIZO', turnos_clima = 5 WHERE id = p_batalha_id;
                    SET v_clima = 'GRANIZO'; SET v_turnos_clima = 5;
                    SET v_msg = CONCAT(v_msg, ' Começou a cair granizo!');
                
                -- Condições de Status
                ELSEIF v_efeito_mov = 'PARALISIA' THEN
                    IF v_cond_def != 'NENHUM' OR v_hab_def = 'IMMUNE_PARALYSIS' THEN
                        SET v_msg = CONCAT(v_msg, ' Mas falhou!');
                    ELSE
                        UPDATE pokemon_instancia SET condicao_status = 'PARALISIA' WHERE id = v_primeiro_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' ficou paralisado!');
                        IF v_hab_def = 'SYNCHRONIZE' AND v_cond_atk = 'NENHUM' THEN
                            UPDATE pokemon_instancia SET condicao_status = 'PARALISIA' WHERE id = v_primeiro_atacante_id;
                            SET v_msg = CONCAT(v_msg, ' Synchronize paralisou ', v_atk_nome, ' também!');
                        END IF;
                    END IF;
                ELSEIF v_efeito_mov = 'SONO' THEN
                    IF v_cond_def != 'NENHUM' OR v_hab_def = 'IMMUNE_SLEEP' THEN
                        SET v_msg = CONCAT(v_msg, ' Mas falhou!');
                    ELSE
                        UPDATE pokemon_instancia SET condicao_status = 'SONO', turnos_sono = FLOOR(RAND() * 3) + 2 WHERE id = v_primeiro_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' adormeceu!');
                    END IF;
                ELSEIF v_efeito_mov = 'SONO_REST' THEN
                    UPDATE pokemon_instancia SET condicao_status = 'SONO', turnos_sono = 2, hp_atual = hp_max WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' ', v_atk_nome, ' recuperou todo o HP e adormeceu!');
                ELSEIF v_efeito_mov = 'ENVENENAMENTO' THEN
                    IF v_cond_def != 'NENHUM' OR v_hab_def = 'IMMUNE_POISON' THEN
                        SET v_msg = CONCAT(v_msg, ' Mas falhou!');
                    ELSE
                        UPDATE pokemon_instancia SET condicao_status = 'ENVENENAMENTO' WHERE id = v_primeiro_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' foi envenenado!');
                        IF v_hab_def = 'SYNCHRONIZE' AND v_cond_atk = 'NENHUM' THEN
                            UPDATE pokemon_instancia SET condicao_status = 'ENVENENAMENTO' WHERE id = v_primeiro_atacante_id;
                            SET v_msg = CONCAT(v_msg, ' Synchronize envenenou ', v_atk_nome, ' também!');
                        END IF;
                    END IF;
                ELSEIF v_efeito_mov = 'QUEIMADURA' THEN
                    IF v_cond_def != 'NENHUM' OR v_hab_def = 'IMMUNE_BURN' THEN
                        SET v_msg = CONCAT(v_msg, ' Mas falhou!');
                    ELSE
                        UPDATE pokemon_instancia SET condicao_status = 'QUEIMADURA' WHERE id = v_primeiro_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' sofreu uma queimadura!');
                        IF v_hab_def = 'SYNCHRONIZE' AND v_cond_atk = 'NENHUM' THEN
                            UPDATE pokemon_instancia SET condicao_status = 'QUEIMADURA' WHERE id = v_primeiro_atacante_id;
                            SET v_msg = CONCAT(v_msg, ' Synchronize queimou ', v_atk_nome, ' também!');
                        END IF;
                    END IF;
                ELSEIF v_efeito_mov = 'CURA_HP' THEN
                    UPDATE pokemon_instancia SET hp_atual = LEAST(hp_max, hp_atual + FLOOR(hp_max * (v_valor_mov / 100))) WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' ', v_atk_nome, ' recuperou HP!');

                -- Buffs
                ELSEIF v_efeito_mov = 'BUFF_ATAQUE' THEN
                    UPDATE pokemon_instancia SET mod_ataque = LEAST(6, mod_ataque + v_valor_mov) WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Ataque de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'BUFF_DEFESA' THEN
                    UPDATE pokemon_instancia SET mod_defesa = LEAST(6, mod_defesa + v_valor_mov) WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Defesa de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'BUFF_VELOCIDADE' THEN
                    UPDATE pokemon_instancia SET mod_velocidade = LEAST(6, mod_velocidade + v_valor_mov) WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Velocidade de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'BUFF_SP_ATK' THEN
                    UPDATE pokemon_instancia SET mod_sp_ataque = LEAST(6, mod_sp_ataque + v_valor_mov) WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Sp. Atk de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'BUFF_SP_DEF' THEN
                    UPDATE pokemon_instancia SET mod_sp_defesa = LEAST(6, mod_sp_defesa + v_valor_mov) WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Sp. Def de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'BUFF_CALM_MIND' THEN
                    UPDATE pokemon_instancia SET mod_sp_ataque = LEAST(6, mod_sp_ataque + 1), mod_sp_defesa = LEAST(6, mod_sp_defesa + 1) WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Sp. Atk e Sp. Def de ', v_atk_nome, ' subiram!');
                ELSEIF v_efeito_mov = 'BUFF_BULK_UP' THEN
                    UPDATE pokemon_instancia SET mod_ataque = LEAST(6, mod_ataque + 1), mod_defesa = LEAST(6, mod_defesa + 1) WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Ataque e Defesa de ', v_atk_nome, ' subiram!');
                ELSEIF v_efeito_mov = 'BUFF_DRAGON_DANCE' THEN
                    UPDATE pokemon_instancia SET mod_ataque = LEAST(6, mod_ataque + 1), mod_velocidade = LEAST(6, mod_velocidade + 1) WHERE id = v_primeiro_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Ataque e Velocidade de ', v_atk_nome, ' subiram!');

                -- Debuffs
                ELSEIF v_efeito_mov = 'DEBUFF_DEFESA' THEN
                    IF v_hab_def = 'CLEAR_BODY' THEN SET v_msg = CONCAT(v_msg, ' Clear Body de ', v_def_nome, ' impediu a redução!');
                    ELSE UPDATE pokemon_instancia SET mod_defesa = GREATEST(-6, mod_defesa - v_valor_mov) WHERE id = v_primeiro_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Defesa de ', v_def_nome, ' caiu!');
                    END IF;
                ELSEIF v_efeito_mov = 'DEBUFF_ATAQUE' THEN
                    IF v_hab_def = 'CLEAR_BODY' OR v_hab_def = 'HYPER_CUTTER' THEN SET v_msg = CONCAT(v_msg, ' A habilidade de ', v_def_nome, ' impediu a redução de Ataque!');
                    ELSE UPDATE pokemon_instancia SET mod_ataque = GREATEST(-6, mod_ataque - v_valor_mov) WHERE id = v_primeiro_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Ataque de ', v_def_nome, ' caiu!');
                    END IF;
                ELSEIF v_efeito_mov = 'DEBUFF_VELOCIDADE' THEN
                    IF v_hab_def = 'CLEAR_BODY' THEN SET v_msg = CONCAT(v_msg, ' Clear Body de ', v_def_nome, ' impediu a redução!');
                    ELSE UPDATE pokemon_instancia SET mod_velocidade = GREATEST(-6, mod_velocidade - v_valor_mov) WHERE id = v_primeiro_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Velocidade de ', v_def_nome, ' caiu!');
                    END IF;
                ELSEIF v_efeito_mov = 'DEBUFF_PRECISAO' THEN
                    IF v_hab_def = 'CLEAR_BODY' OR v_hab_def = 'KEEN_EYE' THEN SET v_msg = CONCAT(v_msg, ' Keen Eye de ', v_def_nome, ' impediu a redução de precisão!');
                    ELSE UPDATE pokemon_instancia SET mod_precisao = GREATEST(-6, mod_precisao - v_valor_mov) WHERE id = v_primeiro_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Precisão de ', v_def_nome, ' caiu!');
                    END IF;
                ELSEIF v_efeito_mov = 'DEBUFF_SP_DEF' THEN
                    IF v_hab_def = 'CLEAR_BODY' THEN SET v_msg = CONCAT(v_msg, ' Clear Body de ', v_def_nome, ' impediu a redução!');
                    ELSE UPDATE pokemon_instancia SET mod_sp_defesa = GREATEST(-6, mod_sp_defesa - v_valor_mov) WHERE id = v_primeiro_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Sp. Def de ', v_def_nome, ' caiu!');
                    END IF;
                END IF;
            END IF;

            INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
            VALUES (p_batalha_id, v_turno, 1, v_primeiro_atacante_id, v_primeiro_defensor_id, v_primeiro_mov_id, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_primeiro_defensor_id), v_msg);

        ELSE
            -- GOLPE DE DANO
            SELECT pi.nivel, ep.tipo1_id, ep.tipo2_id,
                   CASE WHEN v_categoria = 'Special' THEN fn_calcular_stat_com_estagio(pi.sp_ataque, pi.mod_sp_ataque) ELSE fn_calcular_stat_com_estagio(pi.ataque, pi.mod_ataque) END
            INTO v_nivel_atk, v_tipo1_atk, v_tipo2_atk, v_atk_stat
            FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex WHERE pi.id = v_primeiro_atacante_id;

            SELECT CASE WHEN v_categoria = 'Special' THEN fn_calcular_stat_com_estagio(pi.sp_defesa, pi.mod_sp_defesa) ELSE fn_calcular_stat_com_estagio(pi.defesa, pi.mod_defesa) END
            INTO v_def_stat
            FROM pokemon_instancia pi WHERE pi.id = v_primeiro_defensor_id;

            -- Habilidade de Dano do Atacante (Guts, Overgrow, Blaze, Torrent)
            IF v_categoria = 'Physical' AND v_hab_atk = 'GUTS' AND v_cond_atk != 'NENHUM' THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 1.5);
            ELSEIF v_cond_atk = 'QUEIMADURA' AND v_categoria = 'Physical' THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 0.5);
            END IF;

            IF v_tipo_mov = 12 AND v_hab_atk = 'PINCH_BOOST_GRASS' AND (v_hp_atual_atk <= FLOOR(v_hp_max_atk / 3)) THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 1.5);
            ELSEIF v_tipo_mov = 10 AND v_hab_atk = 'PINCH_BOOST_FIRE' AND (v_hp_atual_atk <= FLOOR(v_hp_max_atk / 3)) THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 1.5);
            ELSEIF v_tipo_mov = 11 AND v_hab_atk = 'PINCH_BOOST_WATER' AND (v_hp_atual_atk <= FLOOR(v_hp_max_atk / 3)) THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 1.5);
            END IF;

            -- Habilidade de Defesa do Defensor (Thick Fat)
            IF (v_tipo_mov = 10 OR v_tipo_mov = 15) AND v_hab_def = 'THICK_FAT' THEN
                SET v_def_stat = v_def_stat * 2;
            END IF;

            -- STAB
            IF v_tipo_mov = v_tipo1_atk OR (v_tipo2_atk IS NOT NULL AND v_tipo_mov = v_tipo2_atk) THEN
                SET v_stab = CASE WHEN v_hab_atk = 'ADAPTABILITY' THEN 2.00 ELSE 1.50 END;
            ELSE
                SET v_stab = 1.00;
            END IF;

            -- Modificador de Clima no Dano
            SET v_mult_clima = 1.00;
            IF v_clima = 'CHUVA' THEN
                IF v_tipo_mov = 11 THEN SET v_mult_clima = 1.50; END IF;
                IF v_tipo_mov = 10 THEN SET v_mult_clima = 0.50; END IF;
            ELSEIF v_clima = 'SOL' THEN
                IF v_tipo_mov = 10 THEN SET v_mult_clima = 1.50; END IF;
                IF v_tipo_mov = 11 THEN SET v_mult_clima = 0.50; END IF;
            END IF;

            -- Efeito de Held Item
            IF (SELECT hi.efeito_tipo FROM pokemon_instancia pi JOIN held_item hi ON pi.held_item_id = hi.id WHERE pi.id = v_primeiro_atacante_id) = 'BOOST_TIPO'
               AND (SELECT hi.param_tipo_id FROM pokemon_instancia pi JOIN held_item hi ON pi.held_item_id = hi.id WHERE pi.id = v_primeiro_atacante_id) = v_tipo_mov THEN
                SET v_stab = v_stab * 1.10;
            END IF;

            -- Cálculo Oficial de Dano Gen 3
            IF v_mult_tipo > 0 THEN
                SET v_dano = FLOOR((((((2 * v_nivel_atk) / 5) + 2) * v_poder * (v_atk_stat / v_def_stat)) / 50 + 2) * v_stab * v_mult_tipo * v_mult_clima);
                IF v_dano = 0 THEN SET v_dano = 1; END IF;
            ELSE
                SET v_dano = 0;
            END IF;

            -- Aplicar Dano
            UPDATE pokemon_instancia
            SET esta_desmaiado = (hp_atual <= v_dano), hp_atual = GREATEST(0, hp_atual - v_dano)
            WHERE id = v_primeiro_defensor_id;

            SET v_msg = CONCAT(v_msg, v_atk_nome, ' usou ', v_mov_nome, '! Dano: ', v_dano);
            IF v_mult_tipo >= 2.0 THEN SET v_msg = CONCAT(v_msg, ' (Super Efetivo!)'); END IF;
            IF v_mult_tipo <= 0.5 AND v_mult_tipo > 0 THEN SET v_msg = CONCAT(v_msg, ' (Não foi muito efetivo...)'); END IF;
            IF v_mult_tipo = 0 THEN SET v_msg = CONCAT(v_msg, ' (Não teve efeito!)'); END IF;

            -- Efeitos Secundários de Ataques se defensor sobreviveu
            IF (SELECT esta_desmaiado FROM pokemon_instancia WHERE id = v_primeiro_defensor_id) = FALSE THEN
                IF v_chance_mov > 0 AND (RAND() * 100) < v_chance_mov AND (SELECT condicao_status FROM pokemon_instancia WHERE id = v_primeiro_defensor_id) = 'NENHUM' THEN
                    IF v_efeito_mov = 'DANO_E_QUEIMADURA' AND v_hab_def != 'IMMUNE_BURN' THEN
                        UPDATE pokemon_instancia SET condicao_status = 'QUEIMADURA' WHERE id = v_primeiro_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' sofreu uma queimadura!');
                    ELSEIF v_efeito_mov = 'DANO_E_PARALISIA' AND v_hab_def != 'IMMUNE_PARALYSIS' THEN
                        UPDATE pokemon_instancia SET condicao_status = 'PARALISIA' WHERE id = v_primeiro_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' ficou paralisado!');
                    ELSEIF v_efeito_mov = 'DANO_E_CONGELAMENTO' THEN
                        UPDATE pokemon_instancia SET condicao_status = 'CONGELAMENTO' WHERE id = v_primeiro_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' foi congelado!');
                    ELSEIF v_efeito_mov = 'DANO_E_ENVENENAMENTO' AND v_hab_def != 'IMMUNE_POISON' THEN
                        UPDATE pokemon_instancia SET condicao_status = 'ENVENENAMENTO' WHERE id = v_primeiro_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' foi envenenado!');
                    END IF;
                END IF;

                -- Habilidades de Contato do Defensor (Static, Flame Body, Poison Point)
                IF v_categoria = 'Physical' AND (SELECT condicao_status FROM pokemon_instancia WHERE id = v_primeiro_atacante_id) = 'NENHUM' THEN
                    IF v_hab_def = 'CONTACT_PARALYSIS' AND RAND() < 0.30 THEN
                        UPDATE pokemon_instancia SET condicao_status = 'PARALISIA' WHERE id = v_primeiro_atacante_id;
                        SET v_msg = CONCAT(v_msg, ' A habilidade Static de ', v_def_nome, ' paralisou ', v_atk_nome, '!');
                    ELSEIF v_hab_def = 'CONTACT_BURN' AND RAND() < 0.30 THEN
                        UPDATE pokemon_instancia SET condicao_status = 'QUEIMADURA' WHERE id = v_primeiro_atacante_id;
                        SET v_msg = CONCAT(v_msg, ' A habilidade Flame Body de ', v_def_nome, ' queimou ', v_atk_nome, '!');
                    ELSEIF v_hab_def = 'CONTACT_POISON' AND RAND() < 0.30 THEN
                        UPDATE pokemon_instancia SET condicao_status = 'ENVENENAMENTO' WHERE id = v_primeiro_atacante_id;
                        SET v_msg = CONCAT(v_msg, ' A habilidade Poison Point de ', v_def_nome, ' envenenou ', v_atk_nome, '!');
                    END IF;
                END IF;
            END IF;

            INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
            VALUES (p_batalha_id, v_turno, 1, v_primeiro_atacante_id, v_primeiro_defensor_id, v_primeiro_mov_id, v_dano, v_mult_tipo, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_primeiro_defensor_id), v_msg);
        END IF;

        -- Checar se defensor do 1º ataque desmaiou
        IF (SELECT esta_desmaiado FROM pokemon_instancia WHERE id = v_primeiro_defensor_id) = TRUE THEN
            SELECT ep.exp_base, pi.nivel INTO v_base_exp_derrotado, v_nivel_derrotado
            FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex WHERE pi.id = v_primeiro_defensor_id;

            SET v_exp_ganha = FLOOR((1.5 * v_base_exp_derrotado * v_nivel_derrotado) / 7);
            UPDATE pokemon_instancia SET experiencia_atual = experiencia_atual + v_exp_ganha WHERE id = v_primeiro_atacante_id;

            SELECT id INTO v_proximo_pok_id FROM pokemon_instancia
            WHERE treinador_id = (SELECT treinador_id FROM pokemon_instancia WHERE id = v_primeiro_defensor_id)
              AND esta_desmaiado = FALSE AND posicao_time <= 6
            ORDER BY posicao_time ASC LIMIT 1;

            IF v_proximo_pok_id IS NOT NULL THEN
                IF v_primeiro_defensor_id = v_pok_jog_id THEN
                    UPDATE batalha SET pokemon_ativo_jogador_id = v_proximo_pok_id, turno_atual = v_turno + 1 WHERE id = p_batalha_id;
                ELSE
                    UPDATE batalha SET pokemon_ativo_oponente_id = v_proximo_pok_id, turno_atual = v_turno + 1 WHERE id = p_batalha_id;
                END IF;
                SELECT 'Pokemon desmaiou! Próximo pokémon enviado para batalha!' AS resultado_turno, v_msg AS acao;
                LEAVE proc_label;
            ELSE
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
    END IF;

    -- =========================================================================
    -- 2º ATAQUE (Se o atacante sobreviveu e a batalha continua)
    -- =========================================================================
    SET v_pulo_ataque = FALSE;
    SET v_msg = '';

    SELECT apelido, condicao_status, turnos_sono, hp_atual, hp_max
    INTO v_atk_nome, v_cond_atk, v_turnos_sono_atk, v_hp_atual_atk, v_hp_max_atk
    FROM pokemon_instancia WHERE id = v_segundo_atacante_id;

    SELECT apelido, condicao_status, hp_atual, hp_max
    INTO v_def_nome, v_cond_def, v_hp_atual_def, v_hp_max_def
    FROM pokemon_instancia WHERE id = v_segundo_defensor_id;

    SELECT h.efeito_tipo INTO v_hab_atk FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_segundo_atacante_id;
    SELECT h.efeito_tipo INTO v_hab_def FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_segundo_defensor_id;

    SELECT poder, precisao, tipo_id, categoria, efeito_tipo, efeito_chance, efeito_valor, nome
    INTO v_poder, v_precisao, v_tipo_mov, v_categoria, v_efeito_mov, v_chance_mov, v_valor_mov, v_mov_nome
    FROM movimento WHERE id = v_segundo_mov_id;

    IF v_cond_atk = 'SONO' THEN
        IF v_turnos_sono_atk > 1 THEN
            UPDATE pokemon_instancia SET turnos_sono = turnos_sono - 1 WHERE id = v_segundo_atacante_id;
            SET v_msg = CONCAT(v_atk_nome, ' está dormindo profundamente!');
            SET v_pulo_ataque = TRUE;
        ELSE
            UPDATE pokemon_instancia SET condicao_status = 'NENHUM', turnos_sono = 0 WHERE id = v_segundo_atacante_id;
            SET v_msg = CONCAT(v_atk_nome, ' acordou! ');
        END IF;
    END IF;

    IF v_pulo_ataque = FALSE AND v_cond_atk = 'PARALISIA' AND RAND() < 0.25 THEN
        SET v_msg = CONCAT(v_atk_nome, ' está totalmente paralisado e não pode se mover!');
        SET v_pulo_ataque = TRUE;
    END IF;

    IF v_pulo_ataque = FALSE AND v_cond_atk = 'CONGELAMENTO' THEN
        IF RAND() < 0.80 THEN
            SET v_msg = CONCAT(v_atk_nome, ' está congelado solidamente!');
            SET v_pulo_ataque = TRUE;
        ELSE
            UPDATE pokemon_instancia SET condicao_status = 'NENHUM' WHERE id = v_segundo_atacante_id;
            SET v_msg = CONCAT(v_atk_nome, ' descongelou! ');
        END IF;
    END IF;

    IF v_pulo_ataque = TRUE THEN
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 2, v_segundo_atacante_id, v_segundo_defensor_id, v_segundo_mov_id, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_segundo_defensor_id), v_msg);
    ELSE
        UPDATE pokemon_movimento_ativo
        SET pp_atual = GREATEST(0, pp_atual - 1)
        WHERE pokemon_instancia_id = v_segundo_atacante_id AND movimento_id = v_segundo_mov_id;

        SET v_mult_tipo = fn_obter_multiplicador_tipo(v_tipo_mov, v_segundo_defensor_id);
        IF v_tipo_mov = 5 AND v_hab_def = 'LEVITATE' THEN
            SET v_mult_tipo = 0.00;
        END IF;

        IF v_categoria = 'Status' OR v_poder IS NULL OR v_poder = 0 THEN
            SET v_dano = 0;
            SET v_msg = CONCAT(v_msg, v_atk_nome, ' usou ', v_mov_nome, '!');

            IF v_mult_tipo = 0.00 THEN
                SET v_msg = CONCAT(v_msg, ' Não teve efeito contra ', v_def_nome, '!');
            ELSE
                IF v_efeito_mov = 'CLIMA_CHUVA' THEN
                    UPDATE batalha SET clima = 'CHUVA', turnos_clima = 5 WHERE id = p_batalha_id;
                    SET v_clima = 'CHUVA'; SET v_turnos_clima = 5;
                    SET v_msg = CONCAT(v_msg, ' Começou a chover forte!');
                ELSEIF v_efeito_mov = 'CLIMA_SOL' THEN
                    UPDATE batalha SET clima = 'SOL', turnos_clima = 5 WHERE id = p_batalha_id;
                    SET v_clima = 'SOL'; SET v_turnos_clima = 5;
                    SET v_msg = CONCAT(v_msg, ' A luz do sol ficou extremamente intensa!');
                ELSEIF v_efeito_mov = 'CLIMA_AREIA' THEN
                    UPDATE batalha SET clima = 'TEMPESTADE_AREIA', turnos_clima = 5 WHERE id = p_batalha_id;
                    SET v_clima = 'TEMPESTADE_AREIA'; SET v_turnos_clima = 5;
                    SET v_msg = CONCAT(v_msg, ' Uma tempestade de areia começou a soprar!');
                ELSEIF v_efeito_mov = 'CLIMA_GRANIZO' THEN
                    UPDATE batalha SET clima = 'GRANIZO', turnos_clima = 5 WHERE id = p_batalha_id;
                    SET v_clima = 'GRANIZO'; SET v_turnos_clima = 5;
                    SET v_msg = CONCAT(v_msg, ' Começou a cair granizo!');
                ELSEIF v_efeito_mov = 'PARALISIA' THEN
                    IF v_cond_def != 'NENHUM' OR v_hab_def = 'IMMUNE_PARALYSIS' THEN
                        SET v_msg = CONCAT(v_msg, ' Mas falhou!');
                    ELSE
                        UPDATE pokemon_instancia SET condicao_status = 'PARALISIA' WHERE id = v_segundo_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' ficou paralisado!');
                        IF v_hab_def = 'SYNCHRONIZE' AND v_cond_atk = 'NENHUM' THEN
                            UPDATE pokemon_instancia SET condicao_status = 'PARALISIA' WHERE id = v_segundo_atacante_id;
                            SET v_msg = CONCAT(v_msg, ' Synchronize paralisou ', v_atk_nome, ' também!');
                        END IF;
                    END IF;
                ELSEIF v_efeito_mov = 'SONO' THEN
                    IF v_cond_def != 'NENHUM' OR v_hab_def = 'IMMUNE_SLEEP' THEN
                        SET v_msg = CONCAT(v_msg, ' Mas falhou!');
                    ELSE
                        UPDATE pokemon_instancia SET condicao_status = 'SONO', turnos_sono = FLOOR(RAND() * 3) + 2 WHERE id = v_segundo_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' adormeceu!');
                    END IF;
                ELSEIF v_efeito_mov = 'SONO_REST' THEN
                    UPDATE pokemon_instancia SET condicao_status = 'SONO', turnos_sono = 2, hp_atual = hp_max WHERE id = v_segundo_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' ', v_atk_nome, ' recuperou todo o HP e adormeceu!');
                ELSEIF v_efeito_mov = 'ENVENENAMENTO' THEN
                    IF v_cond_def != 'NENHUM' OR v_hab_def = 'IMMUNE_POISON' THEN
                        SET v_msg = CONCAT(v_msg, ' Mas falhou!');
                    ELSE
                        UPDATE pokemon_instancia SET condicao_status = 'ENVENENAMENTO' WHERE id = v_segundo_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' foi envenenado!');
                        IF v_hab_def = 'SYNCHRONIZE' AND v_cond_atk = 'NENHUM' THEN
                            UPDATE pokemon_instancia SET condicao_status = 'ENVENENAMENTO' WHERE id = v_segundo_atacante_id;
                            SET v_msg = CONCAT(v_msg, ' Synchronize envenenou ', v_atk_nome, ' também!');
                        END IF;
                    END IF;
                ELSEIF v_efeito_mov = 'QUEIMADURA' THEN
                    IF v_cond_def != 'NENHUM' OR v_hab_def = 'IMMUNE_BURN' THEN
                        SET v_msg = CONCAT(v_msg, ' Mas falhou!');
                    ELSE
                        UPDATE pokemon_instancia SET condicao_status = 'QUEIMADURA' WHERE id = v_segundo_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' sofreu uma queimadura!');
                        IF v_hab_def = 'SYNCHRONIZE' AND v_cond_atk = 'NENHUM' THEN
                            UPDATE pokemon_instancia SET condicao_status = 'QUEIMADURA' WHERE id = v_segundo_atacante_id;
                            SET v_msg = CONCAT(v_msg, ' Synchronize queimou ', v_atk_nome, ' também!');
                        END IF;
                    END IF;
                ELSEIF v_efeito_mov = 'CURA_HP' THEN
                    UPDATE pokemon_instancia SET hp_atual = LEAST(hp_max, hp_atual + FLOOR(hp_max * (v_valor_mov / 100))) WHERE id = v_segundo_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' ', v_atk_nome, ' recuperou HP!');
                ELSEIF v_efeito_mov = 'BUFF_ATAQUE' THEN
                    UPDATE pokemon_instancia SET mod_ataque = LEAST(6, mod_ataque + v_valor_mov) WHERE id = v_segundo_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Ataque de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'BUFF_DEFESA' THEN
                    UPDATE pokemon_instancia SET mod_defesa = LEAST(6, mod_defesa + v_valor_mov) WHERE id = v_segundo_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Defesa de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'BUFF_VELOCIDADE' THEN
                    UPDATE pokemon_instancia SET mod_velocidade = LEAST(6, mod_velocidade + v_valor_mov) WHERE id = v_segundo_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Velocidade de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'BUFF_SP_ATK' THEN
                    UPDATE pokemon_instancia SET mod_sp_ataque = LEAST(6, mod_sp_ataque + v_valor_mov) WHERE id = v_segundo_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Sp. Atk de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'BUFF_SP_DEF' THEN
                    UPDATE pokemon_instancia SET mod_sp_defesa = LEAST(6, mod_sp_defesa + v_valor_mov) WHERE id = v_segundo_atacante_id;
                    SET v_msg = CONCAT(v_msg, ' Sp. Def de ', v_atk_nome, ' subiu!');
                ELSEIF v_efeito_mov = 'DEBUFF_DEFESA' THEN
                    IF v_hab_def = 'CLEAR_BODY' THEN SET v_msg = CONCAT(v_msg, ' Clear Body de ', v_def_nome, ' impediu a redução!');
                    ELSE UPDATE pokemon_instancia SET mod_defesa = GREATEST(-6, mod_defesa - v_valor_mov) WHERE id = v_segundo_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Defesa de ', v_def_nome, ' caiu!');
                    END IF;
                ELSEIF v_efeito_mov = 'DEBUFF_ATAQUE' THEN
                    IF v_hab_def = 'CLEAR_BODY' OR v_hab_def = 'HYPER_CUTTER' THEN SET v_msg = CONCAT(v_msg, ' A habilidade de ', v_def_nome, ' impediu a redução de Ataque!');
                    ELSE UPDATE pokemon_instancia SET mod_ataque = GREATEST(-6, mod_ataque - v_valor_mov) WHERE id = v_segundo_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Ataque de ', v_def_nome, ' caiu!');
                    END IF;
                ELSEIF v_efeito_mov = 'DEBUFF_VELOCIDADE' THEN
                    IF v_hab_def = 'CLEAR_BODY' THEN SET v_msg = CONCAT(v_msg, ' Clear Body de ', v_def_nome, ' impediu a redução!');
                    ELSE UPDATE pokemon_instancia SET mod_velocidade = GREATEST(-6, mod_velocidade - v_valor_mov) WHERE id = v_segundo_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Velocidade de ', v_def_nome, ' caiu!');
                    END IF;
                ELSEIF v_efeito_mov = 'DEBUFF_PRECISAO' THEN
                    IF v_hab_def = 'CLEAR_BODY' OR v_hab_def = 'KEEN_EYE' THEN SET v_msg = CONCAT(v_msg, ' Keen Eye de ', v_def_nome, ' impediu a redução de precisão!');
                    ELSE UPDATE pokemon_instancia SET mod_precisao = GREATEST(-6, mod_precisao - v_valor_mov) WHERE id = v_segundo_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Precisão de ', v_def_nome, ' caiu!');
                    END IF;
                ELSEIF v_efeito_mov = 'DEBUFF_SP_DEF' THEN
                    IF v_hab_def = 'CLEAR_BODY' THEN SET v_msg = CONCAT(v_msg, ' Clear Body de ', v_def_nome, ' impediu a redução!');
                    ELSE UPDATE pokemon_instancia SET mod_sp_defesa = GREATEST(-6, mod_sp_defesa - v_valor_mov) WHERE id = v_segundo_defensor_id;
                         SET v_msg = CONCAT(v_msg, ' Sp. Def de ', v_def_nome, ' caiu!');
                    END IF;
                END IF;
            END IF;

            INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
            VALUES (p_batalha_id, v_turno, 2, v_segundo_atacante_id, v_segundo_defensor_id, v_segundo_mov_id, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_segundo_defensor_id), v_msg);
        ELSE
            SELECT pi.nivel, ep.tipo1_id, ep.tipo2_id,
                   CASE WHEN v_categoria = 'Special' THEN fn_calcular_stat_com_estagio(pi.sp_ataque, pi.mod_sp_ataque) ELSE fn_calcular_stat_com_estagio(pi.ataque, pi.mod_ataque) END
            INTO v_nivel_atk, v_tipo1_atk, v_tipo2_atk, v_atk_stat
            FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex WHERE pi.id = v_segundo_atacante_id;

            SELECT CASE WHEN v_categoria = 'Special' THEN fn_calcular_stat_com_estagio(pi.sp_defesa, pi.mod_sp_defesa) ELSE fn_calcular_stat_com_estagio(pi.defesa, pi.mod_defesa) END
            INTO v_def_stat
            FROM pokemon_instancia pi WHERE pi.id = v_segundo_defensor_id;

            IF v_categoria = 'Physical' AND v_hab_atk = 'GUTS' AND v_cond_atk != 'NENHUM' THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 1.5);
            ELSEIF v_cond_atk = 'QUEIMADURA' AND v_categoria = 'Physical' THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 0.5);
            END IF;

            IF v_tipo_mov = 12 AND v_hab_atk = 'PINCH_BOOST_GRASS' AND (v_hp_atual_atk <= FLOOR(v_hp_max_atk / 3)) THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 1.5);
            ELSEIF v_tipo_mov = 10 AND v_hab_atk = 'PINCH_BOOST_FIRE' AND (v_hp_atual_atk <= FLOOR(v_hp_max_atk / 3)) THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 1.5);
            ELSEIF v_tipo_mov = 11 AND v_hab_atk = 'PINCH_BOOST_WATER' AND (v_hp_atual_atk <= FLOOR(v_hp_max_atk / 3)) THEN
                SET v_atk_stat = FLOOR(v_atk_stat * 1.5);
            END IF;

            IF (v_tipo_mov = 10 OR v_tipo_mov = 15) AND v_hab_def = 'THICK_FAT' THEN
                SET v_def_stat = v_def_stat * 2;
            END IF;

            IF v_tipo_mov = v_tipo1_atk OR (v_tipo2_atk IS NOT NULL AND v_tipo_mov = v_tipo2_atk) THEN
                SET v_stab = CASE WHEN v_hab_atk = 'ADAPTABILITY' THEN 2.00 ELSE 1.50 END;
            ELSE
                SET v_stab = 1.00;
            END IF;

            SET v_mult_clima = 1.00;
            IF v_clima = 'CHUVA' THEN
                IF v_tipo_mov = 11 THEN SET v_mult_clima = 1.50; END IF;
                IF v_tipo_mov = 10 THEN SET v_mult_clima = 0.50; END IF;
            ELSEIF v_clima = 'SOL' THEN
                IF v_tipo_mov = 10 THEN SET v_mult_clima = 1.50; END IF;
                IF v_tipo_mov = 11 THEN SET v_mult_clima = 0.50; END IF;
            END IF;

            IF (SELECT hi.efeito_tipo FROM pokemon_instancia pi JOIN held_item hi ON pi.held_item_id = hi.id WHERE pi.id = v_segundo_atacante_id) = 'BOOST_TIPO'
               AND (SELECT hi.param_tipo_id FROM pokemon_instancia pi JOIN held_item hi ON pi.held_item_id = hi.id WHERE pi.id = v_segundo_atacante_id) = v_tipo_mov THEN
                SET v_stab = v_stab * 1.10;
            END IF;

            IF v_mult_tipo > 0 THEN
                SET v_dano = FLOOR((((((2 * v_nivel_atk) / 5) + 2) * v_poder * (v_atk_stat / v_def_stat)) / 50 + 2) * v_stab * v_mult_tipo * v_mult_clima);
                IF v_dano = 0 THEN SET v_dano = 1; END IF;
            ELSE
                SET v_dano = 0;
            END IF;

            UPDATE pokemon_instancia
            SET esta_desmaiado = (hp_atual <= v_dano), hp_atual = GREATEST(0, hp_atual - v_dano)
            WHERE id = v_segundo_defensor_id;

            SET v_msg = CONCAT(v_msg, v_atk_nome, ' usou ', v_mov_nome, '! Dano: ', v_dano);
            IF v_mult_tipo >= 2.0 THEN SET v_msg = CONCAT(v_msg, ' (Super Efetivo!)'); END IF;
            IF v_mult_tipo <= 0.5 AND v_mult_tipo > 0 THEN SET v_msg = CONCAT(v_msg, ' (Não foi muito efetivo...)'); END IF;
            IF v_mult_tipo = 0 THEN SET v_msg = CONCAT(v_msg, ' (Não teve efeito!)'); END IF;

            IF (SELECT esta_desmaiado FROM pokemon_instancia WHERE id = v_segundo_defensor_id) = FALSE THEN
                IF v_chance_mov > 0 AND (RAND() * 100) < v_chance_mov AND (SELECT condicao_status FROM pokemon_instancia WHERE id = v_segundo_defensor_id) = 'NENHUM' THEN
                    IF v_efeito_mov = 'DANO_E_QUEIMADURA' AND v_hab_def != 'IMMUNE_BURN' THEN
                        UPDATE pokemon_instancia SET condicao_status = 'QUEIMADURA' WHERE id = v_segundo_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' sofreu uma queimadura!');
                    ELSEIF v_efeito_mov = 'DANO_E_PARALISIA' AND v_hab_def != 'IMMUNE_PARALYSIS' THEN
                        UPDATE pokemon_instancia SET condicao_status = 'PARALISIA' WHERE id = v_segundo_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' ficou paralisado!');
                    ELSEIF v_efeito_mov = 'DANO_E_CONGELAMENTO' THEN
                        UPDATE pokemon_instancia SET condicao_status = 'CONGELAMENTO' WHERE id = v_segundo_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' foi congelado!');
                    ELSEIF v_efeito_mov = 'DANO_E_ENVENENAMENTO' AND v_hab_def != 'IMMUNE_POISON' THEN
                        UPDATE pokemon_instancia SET condicao_status = 'ENVENENAMENTO' WHERE id = v_segundo_defensor_id;
                        SET v_msg = CONCAT(v_msg, ' ', v_def_nome, ' foi envenenado!');
                    END IF;
                END IF;

                IF v_categoria = 'Physical' AND (SELECT condicao_status FROM pokemon_instancia WHERE id = v_segundo_atacante_id) = 'NENHUM' THEN
                    IF v_hab_def = 'CONTACT_PARALYSIS' AND RAND() < 0.30 THEN
                        UPDATE pokemon_instancia SET condicao_status = 'PARALISIA' WHERE id = v_segundo_atacante_id;
                        SET v_msg = CONCAT(v_msg, ' A habilidade Static de ', v_def_nome, ' paralisou ', v_atk_nome, '!');
                    ELSEIF v_hab_def = 'CONTACT_BURN' AND RAND() < 0.30 THEN
                        UPDATE pokemon_instancia SET condicao_status = 'QUEIMADURA' WHERE id = v_segundo_atacante_id;
                        SET v_msg = CONCAT(v_msg, ' A habilidade Flame Body de ', v_def_nome, ' queimou ', v_atk_nome, '!');
                    ELSEIF v_hab_def = 'CONTACT_POISON' AND RAND() < 0.30 THEN
                        UPDATE pokemon_instancia SET condicao_status = 'ENVENENAMENTO' WHERE id = v_segundo_atacante_id;
                        SET v_msg = CONCAT(v_msg, ' A habilidade Poison Point de ', v_def_nome, ' envenenou ', v_atk_nome, '!');
                    END IF;
                END IF;
            END IF;

            INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
            VALUES (p_batalha_id, v_turno, 2, v_segundo_atacante_id, v_segundo_defensor_id, v_segundo_mov_id, v_dano, v_mult_tipo, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_segundo_defensor_id), v_msg);
        END IF;

        IF (SELECT esta_desmaiado FROM pokemon_instancia WHERE id = v_segundo_defensor_id) = TRUE THEN
            SELECT ep.exp_base, pi.nivel INTO v_base_exp_derrotado, v_nivel_derrotado
            FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex WHERE pi.id = v_segundo_defensor_id;

            SET v_exp_ganha = FLOOR((1.5 * v_base_exp_derrotado * v_nivel_derrotado) / 7);
            UPDATE pokemon_instancia SET experiencia_atual = experiencia_atual + v_exp_ganha WHERE id = v_segundo_atacante_id;

            SELECT id INTO v_proximo_pok_id FROM pokemon_instancia
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
    END IF;

    -- =========================================================================
    -- FIM DO TURNO: DANO DE STATUS (VENENO / QUEIMADURA) E CLIMA
    -- =========================================================================
    -- Dano de Veneno / Queimadura no Jogador
    IF (SELECT condicao_status FROM pokemon_instancia WHERE id = v_pok_jog_id) = 'ENVENENAMENTO' THEN
        UPDATE pokemon_instancia SET hp_atual = GREATEST(0, hp_atual - GREATEST(1, FLOOR(hp_max / 8))), esta_desmaiado = (hp_atual <= GREATEST(1, FLOOR(hp_max / 8))) WHERE id = v_pok_jog_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 3, v_pok_jog_id, v_pok_jog_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_jog_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_jog_id), ' sofreu dano do veneno!'));
    ELSEIF (SELECT condicao_status FROM pokemon_instancia WHERE id = v_pok_jog_id) = 'QUEIMADURA' THEN
        UPDATE pokemon_instancia SET hp_atual = GREATEST(0, hp_atual - GREATEST(1, FLOOR(hp_max / 8))), esta_desmaiado = (hp_atual <= GREATEST(1, FLOOR(hp_max / 8))) WHERE id = v_pok_jog_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 3, v_pok_jog_id, v_pok_jog_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_jog_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_jog_id), ' sofreu dano da queimadura!'));
    END IF;

    -- Dano de Veneno / Queimadura no Oponente
    IF (SELECT condicao_status FROM pokemon_instancia WHERE id = v_pok_opo_id) = 'ENVENENAMENTO' THEN
        UPDATE pokemon_instancia SET hp_atual = GREATEST(0, hp_atual - GREATEST(1, FLOOR(hp_max / 8))), esta_desmaiado = (hp_atual <= GREATEST(1, FLOOR(hp_max / 8))) WHERE id = v_pok_opo_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 4, v_pok_opo_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_opo_id), ' sofreu dano do veneno!'));
    ELSEIF (SELECT condicao_status FROM pokemon_instancia WHERE id = v_pok_opo_id) = 'QUEIMADURA' THEN
        UPDATE pokemon_instancia SET hp_atual = GREATEST(0, hp_atual - GREATEST(1, FLOOR(hp_max / 8))), esta_desmaiado = (hp_atual <= GREATEST(1, FLOOR(hp_max / 8))) WHERE id = v_pok_opo_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 4, v_pok_opo_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_opo_id), ' sofreu dano da queimadura!'));
    END IF;

    -- Dano de Tempestade de Areia (afeta quem não for Pedra(6), Terra(5) ou Aço(9))
    IF v_clima = 'TEMPESTADE_AREIA' THEN
        SELECT ep.tipo1_id, ep.tipo2_id INTO v_tipo1_def, v_tipo2_def FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex WHERE pi.id = v_pok_jog_id;
        IF v_tipo1_def NOT IN (5,6,9) AND (v_tipo2_def IS NULL OR v_tipo2_def NOT IN (5,6,9)) THEN
            UPDATE pokemon_instancia SET hp_atual = GREATEST(0, hp_atual - GREATEST(1, FLOOR(hp_max / 16))) WHERE id = v_pok_jog_id;
            INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
            VALUES (p_batalha_id, v_turno, 5, v_pok_jog_id, v_pok_jog_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_jog_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_jog_id), ' é castigado pela tempestade de areia!'));
        END IF;

        SELECT ep.tipo1_id, ep.tipo2_id INTO v_tipo1_def, v_tipo2_def FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex WHERE pi.id = v_pok_opo_id;
        IF v_tipo1_def NOT IN (5,6,9) AND (v_tipo2_def IS NULL OR v_tipo2_def NOT IN (5,6,9)) THEN
            UPDATE pokemon_instancia SET hp_atual = GREATEST(0, hp_atual - GREATEST(1, FLOOR(hp_max / 16))) WHERE id = v_pok_opo_id;
            INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
            VALUES (p_batalha_id, v_turno, 6, v_pok_opo_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_opo_id), ' é castigado pela tempestade de areia!'));
        END IF;
    END IF;

    -- Dano de Granizo (afeta quem não for Gelo(15))
    IF v_clima = 'GRANIZO' THEN
        SELECT ep.tipo1_id, ep.tipo2_id INTO v_tipo1_def, v_tipo2_def FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex WHERE pi.id = v_pok_jog_id;
        IF v_tipo1_def != 15 AND (v_tipo2_def IS NULL OR v_tipo2_def != 15) THEN
            UPDATE pokemon_instancia SET hp_atual = GREATEST(0, hp_atual - GREATEST(1, FLOOR(hp_max / 16))) WHERE id = v_pok_jog_id;
            INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
            VALUES (p_batalha_id, v_turno, 5, v_pok_jog_id, v_pok_jog_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_jog_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_jog_id), ' é atingido pelo granizo!'));
        END IF;

        SELECT ep.tipo1_id, ep.tipo2_id INTO v_tipo1_def, v_tipo2_def FROM pokemon_instancia pi JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex WHERE pi.id = v_pok_opo_id;
        IF v_tipo1_def != 15 AND (v_tipo2_def IS NULL OR v_tipo2_def != 15) THEN
            UPDATE pokemon_instancia SET hp_atual = GREATEST(0, hp_atual - GREATEST(1, FLOOR(hp_max / 16))) WHERE id = v_pok_opo_id;
            INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
            VALUES (p_batalha_id, v_turno, 6, v_pok_opo_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_opo_id), ' é atingido pelo granizo!'));
        END IF;
    END IF;

    -- Leftovers
    IF (SELECT pi.held_item_id FROM pokemon_instancia pi WHERE pi.id = v_pok_jog_id) = 1 AND (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_jog_id) > 0 THEN
        UPDATE pokemon_instancia SET hp_atual = LEAST(hp_max, hp_atual + FLOOR(hp_max / 16)) WHERE id = v_pok_jog_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 7, v_pok_jog_id, v_pok_jog_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_jog_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_jog_id), ' recuperou HP com Leftovers!'));
    END IF;

    IF (SELECT pi.held_item_id FROM pokemon_instancia pi WHERE pi.id = v_pok_opo_id) = 1 AND (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id) > 0 THEN
        UPDATE pokemon_instancia SET hp_atual = LEAST(hp_max, hp_atual + FLOOR(hp_max / 16)) WHERE id = v_pok_opo_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 8, v_pok_opo_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id), CONCAT((SELECT apelido FROM pokemon_instancia WHERE id = v_pok_opo_id), ' recuperou HP com Leftovers!'));
    END IF;

    -- Duração do Clima
    IF v_turnos_clima > 1 THEN
        UPDATE batalha SET turnos_clima = turnos_clima - 1 WHERE id = p_batalha_id;
    ELSEIF v_turnos_clima = 1 THEN
        UPDATE batalha SET clima = 'NENHUM', turnos_clima = 0 WHERE id = p_batalha_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 9, v_pok_jog_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id), 'O clima voltou ao normal!');
    END IF;

    -- Avançar Turno
    UPDATE batalha SET turno_atual = v_turno + 1 WHERE id = p_batalha_id;

    SELECT CONCAT('Turno ', v_turno, ' finalizado!') AS status,
           (SELECT CONCAT(apelido, ': ', hp_atual, '/', hp_max, ' HP') FROM pokemon_instancia WHERE id = v_pok_jog_id) AS pokemon_jogador,
           (SELECT CONCAT(apelido, ': ', hp_atual, '/', hp_max, ' HP') FROM pokemon_instancia WHERE id = v_pok_opo_id) AS pokemon_oponente;
END;
`;

async function updateTurnoProcedure() {
  console.log('🔄 Atualizando procedure `sp_executar_turno_batalha` no MySQL...');
  await pool.query('DROP PROCEDURE IF EXISTS sp_executar_turno_batalha;');
  await pool.query(spTurnoSQL);
  console.log('✅ Procedure `sp_executar_turno_batalha` atualizada com sucesso!');
}

updateTurnoProcedure()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro ao atualizar procedure:');
    console.error('MESSAGE:', err.sqlMessage);
    console.error('CODE:', err.code);
    process.exit(1);
  });
