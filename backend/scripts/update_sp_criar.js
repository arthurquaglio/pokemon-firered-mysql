import pool from '../src/config/database.js';

async function updateSpCriar() {
  await pool.query('DROP PROCEDURE IF EXISTS sp_criar_pokemon_treinador;');
  await pool.query(`
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
        DECLARE v_hab_id INT;

        -- Gerar IVs aleatórios (0 a 31)
        SET v_iv_hp = FLOOR(RAND() * 32);
        SET v_iv_atk = FLOOR(RAND() * 32);
        SET v_iv_def = FLOOR(RAND() * 32);
        SET v_iv_sp_atk = FLOOR(RAND() * 32);
        SET v_iv_sp_def = FLOOR(RAND() * 32);
        SET v_iv_spd = FLOOR(RAND() * 32);

        SELECT hp_base, ataque_base, defesa_base, sp_ataque_base, sp_defesa_base, velocidade_base, habilidade1_id
        INTO v_base_hp, v_base_atk, v_base_def, v_base_sp_atk, v_base_sp_def, v_base_spd, v_hab_id
        FROM especie_pokemon WHERE id_pokedex = p_especie_id;

        SET v_calc_hp_max = fn_calcular_hp_max(v_base_hp, v_iv_hp, 0, p_nivel);

        INSERT INTO pokemon_instancia (
            treinador_id, especie_id, apelido, nivel, experiencia_atual, posicao_time, esta_desmaiado,
            hp_atual, hp_max, ataque, defesa, sp_ataque, sp_defesa, velocidade,
            iv_hp, iv_ataque, iv_defesa, iv_sp_ataque, iv_sp_defesa, iv_velocidade,
            ev_hp, ev_ataque, ev_defesa, ev_sp_ataque, ev_sp_defesa, ev_velocidade,
            habilidade_id, condicao_status, turnos_sono,
            mod_ataque, mod_defesa, mod_sp_ataque, mod_sp_defesa, mod_velocidade, mod_precisao
        ) VALUES (
            p_treinador_id, p_especie_id, p_apelido, p_nivel, 0, p_posicao_time, FALSE,
            v_calc_hp_max, v_calc_hp_max,
            fn_calcular_stat(v_base_atk, v_iv_atk, 0, p_nivel),
            fn_calcular_stat(v_base_def, v_iv_def, 0, p_nivel),
            fn_calcular_stat(v_base_sp_atk, v_iv_sp_atk, 0, p_nivel),
            fn_calcular_stat(v_base_sp_def, v_iv_sp_def, 0, p_nivel),
            fn_calcular_stat(v_base_spd, v_iv_spd, 0, p_nivel),
            v_iv_hp, v_iv_atk, v_iv_def, v_iv_sp_atk, v_iv_sp_def, v_iv_spd,
            0, 0, 0, 0, 0, 0,
            v_hab_id, 'NENHUM', 0,
            0, 0, 0, 0, 0, 0
        );

        SET v_instancia_id = LAST_INSERT_ID();

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
    END;
  `);
  console.log('✅ Procedure sp_criar_pokemon_treinador atualizada com sucesso!');
}

updateSpCriar()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro:', err.sqlMessage || err.message);
    process.exit(1);
  });
