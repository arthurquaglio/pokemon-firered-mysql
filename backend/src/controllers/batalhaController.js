import pool from '../config/database.js';

// Auxiliar para buscar o status detalhado da batalha
async function buscarDetalhesBatalha(batalhaId) {
  const [batalhas] = await pool.query(
    `SELECT b.*, 
            tj.nome as jogador_nome, tj.classe as jogador_classe,
            to_p.nome as oponente_nome, to_p.classe as oponente_classe
     FROM batalha b
     JOIN treinador tj ON b.treinador_jogador_id = tj.id
     JOIN treinador to_p ON b.treinador_oponente_id = to_p.id
     WHERE b.id = ?`,
    [batalhaId]
  );

  if (batalhas.length === 0) return null;
  const batalha = batalhas[0];

  // Buscar dados do pokémon ativo do jogador
  let pokemonJogador = null;
  if (batalha.pokemon_ativo_jogador_id) {
    const [poksJog] = await pool.query(
      `SELECT pi.*, ep.nome as especie_nome, ep.id_pokedex,
              t1.nome as tipo1_nome, t2.nome as tipo2_nome,
              hi.nome as held_item_nome
       FROM pokemon_instancia pi
       JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
       LEFT JOIN tipo t1 ON ep.tipo1_id = t1.id
       LEFT JOIN tipo t2 ON ep.tipo2_id = t2.id
       LEFT JOIN held_item hi ON pi.held_item_id = hi.id
       WHERE pi.id = ?`,
      [batalha.pokemon_ativo_jogador_id]
    );
    if (poksJog.length > 0) {
      const [movs] = await pool.query(
        `SELECT pma.slot_numero, pma.pp_atual, m.id as movimento_id, m.nome,
                m.poder, m.precisao, m.pp_maximo, m.categoria, m.prioridade,
                t.nome as tipo_nome
         FROM pokemon_movimento_ativo pma
         JOIN movimento m ON pma.movimento_id = m.id
         JOIN tipo t ON m.tipo_id = t.id
         WHERE pma.pokemon_instancia_id = ?
         ORDER BY pma.slot_numero ASC`,
        [batalha.pokemon_ativo_jogador_id]
      );
      pokemonJogador = { ...poksJog[0], movimentos: movs };
    }
  }

  // Buscar dados do pokémon ativo do oponente
  let pokemonOponente = null;
  if (batalha.pokemon_ativo_oponente_id) {
    const [poksOpo] = await pool.query(
      `SELECT pi.*, ep.nome as especie_nome, ep.id_pokedex,
              t1.nome as tipo1_nome, t2.nome as tipo2_nome,
              hi.nome as held_item_nome
       FROM pokemon_instancia pi
       JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
       LEFT JOIN tipo t1 ON ep.tipo1_id = t1.id
       LEFT JOIN tipo t2 ON ep.tipo2_id = t2.id
       LEFT JOIN held_item hi ON pi.held_item_id = hi.id
       WHERE pi.id = ?`,
      [batalha.pokemon_ativo_oponente_id]
    );
    if (poksOpo.length > 0) {
      pokemonOponente = poksOpo[0];
    }
  }

  // Buscar time completo do jogador (para troca e exibição)
  const [timeJogador] = await pool.query(
    `SELECT pi.id, pi.apelido, pi.especie_id, ep.nome as especie_nome,
            pi.nivel, pi.hp_atual, pi.hp_max, pi.esta_desmaiado, pi.posicao_time,
            t1.nome as tipo1_nome, t2.nome as tipo2_nome,
            hi.nome as held_item_nome
     FROM pokemon_instancia pi
     JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
     LEFT JOIN tipo t1 ON ep.tipo1_id = t1.id
     LEFT JOIN tipo t2 ON ep.tipo2_id = t2.id
     LEFT JOIN held_item hi ON pi.held_item_id = hi.id
     WHERE pi.treinador_id = ? AND pi.posicao_time <= 6
     ORDER BY pi.posicao_time ASC`,
    [batalha.treinador_jogador_id]
  );

  // Buscar time completo do oponente (para contagem de pokémons vivos)
  const [timeOponente] = await pool.query(
    `SELECT pi.id, pi.apelido, pi.especie_id, ep.nome as especie_nome,
            pi.nivel, pi.hp_atual, pi.hp_max, pi.esta_desmaiado, pi.posicao_time
     FROM pokemon_instancia pi
     JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
     WHERE pi.treinador_id = ? AND pi.posicao_time <= 6
     ORDER BY pi.posicao_time ASC`,
    [batalha.treinador_oponente_id]
  );

  return {
    batalha,
    pokemonJogador,
    pokemonOponente,
    timeJogador,
    timeOponente
  };
}

// POST /api/batalha/iniciar
export async function iniciarBatalha(req, res) {
  const { jogadorId, oponenteId, forcarReinicio } = req.body;
  const jogId = jogadorId || 1;
  const opoId = oponenteId || 2;

  try {
    // Se solicitou reinício ou se há batalha travada, finalizamos batalhas antigas em andamento
    if (forcarReinicio) {
      await pool.query(
        `UPDATE batalha 
         SET status = 'EMPATE' 
         WHERE status = 'EM_ANDAMENTO' 
           AND (treinador_jogador_id IN (?, ?) OR treinador_oponente_id IN (?, ?))`,
        [jogId, opoId, jogId, opoId]
      );
    } else {
      // Verificar se há batalha em andamento
      const [emAndamento] = await pool.query(
        `SELECT id FROM batalha 
         WHERE status = 'EM_ANDAMENTO' 
           AND (treinador_jogador_id IN (?, ?) OR treinador_oponente_id IN (?, ?))
         ORDER BY id DESC LIMIT 1`,
        [jogId, opoId, jogId, opoId]
      );

      if (emAndamento.length > 0) {
        // Encerra a batalha antiga para permitir uma nova experiência fluida
        await pool.query(
          `UPDATE batalha SET status = 'EMPATE' WHERE id = ?`,
          [emAndamento[0].id]
        );
      }
    }

    // Garantir que os Pokémons do oponente e do jogador tenham HP se estiverem zerados
    await pool.query(
      `UPDATE pokemon_instancia 
       SET hp_atual = hp_max, esta_desmaiado = FALSE 
       WHERE treinador_id = ? AND esta_desmaiado = TRUE`,
      [opoId]
    );

    // Chamar Stored Procedure oficial
    const [results] = await pool.query(
      'CALL sp_iniciar_batalha(?, ?)',
      [jogId, opoId]
    );

    const batalhaId = results[0]?.[0]?.batalha_id;

    if (!batalhaId) {
      throw new Error('Falha ao obter ID da nova batalha criada.');
    }

    const estadoCompleto = await buscarDetalhesBatalha(batalhaId);
    const [logs] = await pool.query(
      'SELECT * FROM log_batalha WHERE batalha_id = ? ORDER BY id ASC',
      [batalhaId]
    );

    return res.json({
      sucesso: true,
      batalhaId,
      estado: estadoCompleto,
      logs
    });
  } catch (error) {
    console.error('Erro em iniciarBatalha:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/batalha/turno
export async function executarTurno(req, res) {
  const { batalhaId, movimentoId } = req.body;
  try {
    const [results] = await pool.query(
      'CALL sp_executar_turno_batalha(?, ?)',
      [batalhaId, movimentoId]
    );

    const estadoCompleto = await buscarDetalhesBatalha(batalhaId);
    const [logs] = await pool.query(
      'SELECT * FROM log_batalha WHERE batalha_id = ? ORDER BY id ASC',
      [batalhaId]
    );

    return res.json({
      sucesso: true,
      resultadoTurno: results[0] || [],
      estado: estadoCompleto,
      logs
    });
  } catch (error) {
    console.error('Erro em executarTurno:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/batalha/trocar
export async function trocarPokemon(req, res) {
  const { batalhaId, novoPokemonId } = req.body;
  try {
    const [results] = await pool.query(
      'CALL sp_trocar_pokemon_batalha(?, ?)',
      [batalhaId, novoPokemonId]
    );

    const estadoCompleto = await buscarDetalhesBatalha(batalhaId);
    const [logs] = await pool.query(
      'SELECT * FROM log_batalha WHERE batalha_id = ? ORDER BY id ASC',
      [batalhaId]
    );

    return res.json({
      sucesso: true,
      resultadoTroca: results[0] || [],
      estado: estadoCompleto,
      logs
    });
  } catch (error) {
    console.error('Erro em trocarPokemon:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/batalha/usar-item
export async function usarItem(req, res) {
  const { batalhaId, itemId, alvoPokemonId } = req.body;
  try {
    const [results] = await pool.query(
      'CALL sp_usar_item_batalha(?, ?, ?)',
      [batalhaId, itemId, alvoPokemonId]
    );

    const estadoCompleto = await buscarDetalhesBatalha(batalhaId);
    const [logs] = await pool.query(
      'SELECT * FROM log_batalha WHERE batalha_id = ? ORDER BY id ASC',
      [batalhaId]
    );

    return res.json({
      sucesso: true,
      resultadoItem: results[0] || [],
      estado: estadoCompleto,
      logs
    });
  } catch (error) {
    console.error('Erro em usarItem:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// GET /api/batalha/:id/status
export async function obterStatusBatalha(req, res) {
  const { id } = req.params;
  try {
    const estadoCompleto = await buscarDetalhesBatalha(id);
    if (!estadoCompleto) {
      return res.status(404).json({ sucesso: false, erro: 'Batalha não encontrada' });
    }

    return res.json({
      sucesso: true,
      estado: estadoCompleto
    });
  } catch (error) {
    console.error('Erro em obterStatusBatalha:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// GET /api/batalha/:id/logs
export async function obterLogsBatalha(req, res) {
  const { id } = req.params;
  try {
    const [logs] = await pool.query(
      'SELECT * FROM log_batalha WHERE batalha_id = ? ORDER BY id ASC',
      [id]
    );
    return res.json({ sucesso: true, logs });
  } catch (error) {
    console.error('Erro em obterLogsBatalha:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/batalha/cancelar
export async function cancelarBatalha(req, res) {
  const { batalhaId } = req.body;
  try {
    await pool.query(
      "UPDATE batalha SET status = 'EMPATE' WHERE id = ?",
      [batalhaId]
    );
    return res.json({ sucesso: true, mensagem: 'Batalha cancelada com sucesso.' });
  } catch (error) {
    console.error('Erro em cancelarBatalha:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}
