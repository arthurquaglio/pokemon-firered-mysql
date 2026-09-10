import pool from '../config/database.js';

// GET /api/treinador/:id/time
export async function obterTimeTreinador(req, res) {
  const { id } = req.params;
  try {
    const [pokemons] = await pool.query(
      `SELECT pi.*, 
              ep.nome as especie_nome, ep.id_pokedex,
              t1.nome as tipo1_nome, t2.nome as tipo2_nome,
              hi.nome as held_item_nome, hi.descricao as held_item_descricao, hi.efeito_tipo as held_item_efeito
       FROM pokemon_instancia pi
       JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
       LEFT JOIN tipo t1 ON ep.tipo1_id = t1.id
       LEFT JOIN tipo t2 ON ep.tipo2_id = t2.id
       LEFT JOIN held_item hi ON pi.held_item_id = hi.id
       WHERE pi.treinador_id = ? AND pi.posicao_time <= 6
       ORDER BY pi.posicao_time ASC`,
      [id]
    );

    // Para cada pokémon, buscar seus 4 movimentos ativos
    const timeCompleto = await Promise.all(
      pokemons.map(async (pok) => {
        const [movimentos] = await pool.query(
          `SELECT pma.slot_numero, pma.pp_atual, m.id as movimento_id, m.nome, 
                  m.poder, m.precisao, m.pp_maximo, m.categoria, m.prioridade,
                  t.nome as tipo_nome
           FROM pokemon_movimento_ativo pma
           JOIN movimento m ON pma.movimento_id = m.id
           JOIN tipo t ON m.tipo_id = t.id
           WHERE pma.pokemon_instancia_id = ?
           ORDER BY pma.slot_numero ASC`,
          [pok.id]
        );
        return {
          ...pok,
          movimentos
        };
      })
    );

    return res.json({ sucesso: true, dados: timeCompleto });
  } catch (error) {
    console.error('Erro em obterTimeTreinador:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/pokemon/criar
export async function criarPokemon(req, res) {
  const { treinadorId, especieId, nivel, apelido, posicaoTime } = req.body;
  try {
    const nivelFinal = nivel || 50;
    const posFinal = posicaoTime || 1;

    // Se já houver um pokémon nessa posição, movemos os outros ou substituímos
    const [existente] = await pool.query(
      'SELECT id FROM pokemon_instancia WHERE treinador_id = ? AND posicao_time = ?',
      [treinadorId, posFinal]
    );

    if (existente.length > 0) {
      const oldId = existente[0].id;
      // Limpa referências em batalhas e logs passados para permitir exclusão limpa
      await pool.query('UPDATE batalha SET pokemon_ativo_jogador_id = NULL WHERE pokemon_ativo_jogador_id = ?', [oldId]);
      await pool.query('UPDATE batalha SET pokemon_ativo_oponente_id = NULL WHERE pokemon_ativo_oponente_id = ?', [oldId]);
      await pool.query('DELETE FROM log_batalha WHERE pokemon_atacante_id = ? OR pokemon_defensor_id = ?', [oldId, oldId]);
      await pool.query('DELETE FROM pokemon_movimento_ativo WHERE pokemon_instancia_id = ?', [oldId]);
      await pool.query('DELETE FROM pokemon_instancia WHERE id = ?', [oldId]);
    }

    // Se não informou apelido, pega o nome da espécie
    let apelidoFinal = apelido;
    if (!apelidoFinal) {
      const [esp] = await pool.query('SELECT nome FROM especie_pokemon WHERE id_pokedex = ?', [especieId]);
      apelidoFinal = esp.length > 0 ? esp[0].nome : 'Pokémon';
    }

    const [results] = await pool.query(
      'CALL sp_criar_pokemon_treinador(?, ?, ?, ?, ?)',
      [treinadorId, especieId, nivelFinal, apelidoFinal, posFinal]
    );

    return res.json({
      sucesso: true,
      mensagem: 'Pokémon adicionado com sucesso ao time!',
      resultado: results[0]
    });
  } catch (error) {
    console.error('Erro em criarPokemon:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/pokemon/remover
export async function removerPokemon(req, res) {
  const { pokemonId } = req.body;
  try {
    // Limpa referências em batalhas e logs passados para permitir exclusão limpa
    await pool.query('UPDATE batalha SET pokemon_ativo_jogador_id = NULL WHERE pokemon_ativo_jogador_id = ?', [pokemonId]);
    await pool.query('UPDATE batalha SET pokemon_ativo_oponente_id = NULL WHERE pokemon_ativo_oponente_id = ?', [pokemonId]);
    await pool.query('DELETE FROM log_batalha WHERE pokemon_atacante_id = ? OR pokemon_defensor_id = ?', [pokemonId, pokemonId]);
    await pool.query('DELETE FROM pokemon_movimento_ativo WHERE pokemon_instancia_id = ?', [pokemonId]);
    await pool.query('DELETE FROM pokemon_instancia WHERE id = ?', [pokemonId]);
    return res.json({ sucesso: true, mensagem: 'Pokémon removido com sucesso!' });
  } catch (error) {
    console.error('Erro em removerPokemon:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/pokemon/held-item
export async function equiparHeldItem(req, res) {
  const { pokemonId, heldItemId } = req.body;
  try {
    const [results] = await pool.query(
      'CALL sp_equipar_held_item(?, ?)',
      [pokemonId, heldItemId]
    );
    return res.json({
      sucesso: true,
      mensagem: results[0]?.[0]?.status_held_item || 'Held Item equipado com sucesso!'
    });
  } catch (error) {
    console.error('Erro em equiparHeldItem:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/pokemon/remover-held-item
export async function removerHeldItem(req, res) {
  const { pokemonId } = req.body;
  try {
    const [results] = await pool.query(
      'CALL sp_remover_held_item(?)',
      [pokemonId]
    );
    return res.json({
      sucesso: true,
      mensagem: results[0]?.[0]?.status_held_item || 'Held Item removido com sucesso!'
    });
  } catch (error) {
    console.error('Erro em removerHeldItem:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/pokemon/trocar-golpe
export async function trocarGolpe(req, res) {
  const { pokemonId, movimentoAtualId, novoMovimentoId } = req.body;
  try {
    const [results] = await pool.query(
      'CALL sp_trocar_movimento_pokemon(?, ?, ?)',
      [pokemonId, movimentoAtualId, novoMovimentoId]
    );
    return res.json({
      sucesso: true,
      mensagem: results[0]?.[0]?.resultado_aprendizado || 'Golpe alterado com sucesso!'
    });
  } catch (error) {
    console.error('Erro em trocarGolpe:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/centro-pokemon
export async function centroPokemon(req, res) {
  const { treinadorId } = req.body;
  try {
    const [results] = await pool.query(
      'CALL sp_enfermeira_joy(?)',
      [treinadorId || 1]
    );
    return res.json({
      sucesso: true,
      mensagem: results[0]?.[0]?.centro_pokemon || 'Time curado com sucesso pela Enfermeira Joy!'
    });
  } catch (error) {
    console.error('Erro em centroPokemon:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}

// GET /api/treinador/:id/mochila
export async function obterMochila(req, res) {
  const { id } = req.params;
  try {
    const [itens] = await pool.query(
      `SELECT tm.id as mochila_id, tm.quantidade, 
              ii.id as item_id, ii.nome, ii.descricao, ii.efeito_tipo, ii.valor_efeito, ii.eh_porcentagem
       FROM treinador_mochila tm
       JOIN item_inventario ii ON tm.item_id = ii.id
       WHERE tm.treinador_id = ?
       ORDER BY ii.id ASC`,
      [id]
    );
    return res.json({ sucesso: true, dados: itens });
  } catch (error) {
    console.error('Erro em obterMochila:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// POST /api/treinador/:id/mochila/atualizar
export async function atualizarMochila(req, res) {
  const { id } = req.params;
  const { itemId, quantidade } = req.body;
  try {
    const [existente] = await pool.query(
      'SELECT id FROM treinador_mochila WHERE treinador_id = ? AND item_id = ?',
      [id, itemId]
    );

    if (existente.length > 0) {
      await pool.query(
        'UPDATE treinador_mochila SET quantidade = ? WHERE id = ?',
        [Math.max(0, quantidade), existente[0].id]
      );
    } else {
      await pool.query(
        'INSERT INTO treinador_mochila (treinador_id, item_id, quantidade) VALUES (?, ?, ?)',
        [id, itemId, Math.max(0, quantidade)]
      );
    }

    return res.json({ sucesso: true, mensagem: 'Mochila atualizada!' });
  } catch (error) {
    console.error('Erro em atualizarMochila:', error);
    return res.status(400).json({ sucesso: false, erro: error.message });
  }
}
