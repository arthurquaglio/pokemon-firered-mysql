import pool from '../config/database.js';

// GET /api/pokedex
export async function listarPokedex(req, res) {
  try {
    const [rows] = await pool.query('SELECT *, tipo1 as tipo1_nome, tipo2 as tipo2_nome FROM vw_pokedex_kanto ORDER BY id_pokedex ASC');
    return res.json({ sucesso: true, dados: rows });
  } catch (error) {
    console.error('Erro em listarPokedex:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// GET /api/movimentos/:especieId
export async function listarMovimentosEspecie(req, res) {
  const { especieId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT m.id, m.nome, m.tipo_id, t.nome as tipo_nome, m.categoria, 
              m.poder, m.precisao, m.pp_maximo, m.prioridade, emn.nivel_aprendizado
       FROM especie_movimento_nivel emn
       JOIN movimento m ON emn.movimento_id = m.id
       JOIN tipo t ON m.tipo_id = t.id
       WHERE emn.especie_id = ?
       ORDER BY emn.nivel_aprendizado ASC, m.nome ASC`,
      [especieId]
    );
    return res.json({ sucesso: true, dados: rows });
  } catch (error) {
    console.error('Erro em listarMovimentosEspecie:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// GET /api/held-items
export async function listarHeldItems(req, res) {
  try {
    const [rows] = await pool.query('SELECT * FROM held_item ORDER BY id ASC');
    return res.json({ sucesso: true, dados: rows });
  } catch (error) {
    console.error('Erro em listarHeldItems:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
}

// GET /api/treinadores
export async function listarTreinadores(req, res) {
  try {
    const [treinadores] = await pool.query('SELECT * FROM treinador ORDER BY id ASC');
    
    // Anexar contagem de pokemons de cada treinador
    const treinadoresComInfo = await Promise.all(
      treinadores.map(async (t) => {
        const [pokemons] = await pool.query(
          `SELECT pi.id, pi.apelido, pi.especie_id, ep.nome as especie_nome, pi.nivel, pi.hp_atual, pi.hp_max, pi.esta_desmaiado
           FROM pokemon_instancia pi
           JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
           WHERE pi.treinador_id = ? AND pi.posicao_time <= 6
           ORDER BY pi.posicao_time ASC`,
          [t.id]
        );
        return {
          ...t,
          pokemons
        };
      })
    );

    return res.json({ sucesso: true, dados: treinadoresComInfo });
  } catch (error) {
    console.error('Erro em listarTreinadores:', error);
    return res.status(500).json({ sucesso: false, erro: error.message });
  }
}
