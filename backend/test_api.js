import pool from './src/config/database.js';

async function runTests() {
  console.log('🧪 Iniciando bateria de testes do Backend Pokémon FireRed...\n');
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Detalhes: ${err.message}`);
      failed++;
    }
  }

  // 1. Teste de Pokédex
  await test('Consultar 151 Pokémons de Kanto via View', async () => {
    const [rows] = await pool.query('SELECT COUNT(*) as total FROM vw_pokedex_kanto');
    if (rows[0].total !== 151) throw new Error(`Esperado 151 pokemons, obtido ${rows[0].total}`);
  });

  // 2. Teste de Movimentos da Espécie
  await test('Consultar golpes do Charizard (ID 6)', async () => {
    const [rows] = await pool.query(
      `SELECT m.nome, emn.nivel_aprendizado 
       FROM especie_movimento_nivel emn 
       JOIN movimento m ON emn.movimento_id = m.id 
       WHERE emn.especie_id = 6`
    );
    if (rows.length === 0) throw new Error('Nenhum movimento encontrado para Charizard');
  });

  // 3. Teste de Held Items
  await test('Consultar lista de Held Items', async () => {
    const [rows] = await pool.query('SELECT * FROM held_item');
    if (rows.length === 0) throw new Error('Nenhum held item encontrado');
  });

  // 4. Teste de Treinadores
  await test('Consultar treinadores cadastrados', async () => {
    const [rows] = await pool.query('SELECT * FROM treinador');
    if (rows.length < 4) throw new Error('Esperado pelo menos Red, Blue, Brock e Misty');
  });

  // 5. Teste do Time do Red
  await test('Consultar equipe do Red (Treinador ID 1)', async () => {
    const [rows] = await pool.query('SELECT * FROM pokemon_instancia WHERE treinador_id = 1 AND posicao_time <= 6');
    if (rows.length < 6) throw new Error(`Time do Red incompleto: ${rows.length} pokemons`);
  });

  // 6. Teste da Mochila do Red
  await test('Consultar mochila do Red', async () => {
    const [rows] = await pool.query('SELECT * FROM treinador_mochila WHERE treinador_id = 1');
    if (rows.length === 0) throw new Error('Mochila vazia');
  });

  // 7. Teste de Iniciar Batalha
  let batalhaId = null;
  let pokJogId = null;
  let pokOpoId = null;

  await test('Iniciar Batalha entre Red (1) e Blue (2)', async () => {
    // Limpar batalhas antigas
    await pool.query("UPDATE batalha SET status = 'EMPATE' WHERE status = 'EM_ANDAMENTO'");
    // Curar time
    await pool.query('CALL sp_enfermeira_joy(1)');
    await pool.query('CALL sp_enfermeira_joy(2)');

    const [results] = await pool.query('CALL sp_iniciar_batalha(1, 2)');
    batalhaId = results[0][0].batalha_id;
    pokJogId = results[0][0].pokemon_jogador_id;
    pokOpoId = results[0][0].pokemon_oponente_id;
    if (!batalhaId) throw new Error('batalha_id não retornado');
  });

  // 8. Teste de Executar Turno
  await test('Executar 1º Turno de Batalha com ataque', async () => {
    // Buscar um golpe do pokémon ativo do jogador
    const [movs] = await pool.query(
      'SELECT movimento_id FROM pokemon_movimento_ativo WHERE pokemon_instancia_id = ? LIMIT 1',
      [pokJogId]
    );
    const movId = movs[0].movimento_id;

    const [results] = await pool.query('CALL sp_executar_turno_batalha(?, ?)', [batalhaId, movId]);
    if (!results[0]) throw new Error('Falha no resultado do turno');
  });

  // 9. Teste de Logs de Batalha
  await test('Verificar inserção no log_batalha', async () => {
    const [logs] = await pool.query('SELECT * FROM log_batalha WHERE batalha_id = ?', [batalhaId]);
    if (logs.length === 0) throw new Error('Nenhum log gerado no turno');
  });

  // 10. Teste de Uso de Item em Batalha
  await test('Usar Super Potion em batalha', async () => {
    // Reduzir HP para poder ser curado
    await pool.query('UPDATE pokemon_instancia SET hp_atual = hp_max - 30 WHERE id = ?', [pokJogId]);
    // Garantir que tem Super Potion (ID 2)
    await pool.query('UPDATE treinador_mochila SET quantidade = 5 WHERE treinador_id = 1 AND item_id = 2');
    const [results] = await pool.query('CALL sp_usar_item_batalha(?, 2, ?)', [batalhaId, pokJogId]);
    if (!results[0]) throw new Error('Falha ao usar item em batalha');
  });

  // 11. Teste de Troca de Pokémon em Batalha
  await test('Trocar Pokémon em batalha', async () => {
    // Buscar o 2º pokémon vivo do Red
    const [outroPok] = await pool.query(
      'SELECT id FROM pokemon_instancia WHERE treinador_id = 1 AND id <> ? AND esta_desmaiado = FALSE LIMIT 1',
      [pokJogId]
    );
    if (outroPok.length > 0) {
      const [results] = await pool.query('CALL sp_trocar_pokemon_batalha(?, ?)', [batalhaId, outroPok[0].id]);
      if (!results[0]) throw new Error('Falha ao trocar pokémon');
    }
  });

  // Finalizar a batalha de teste
  await pool.query("UPDATE batalha SET status = 'EMPATE' WHERE id = ?", [batalhaId]);
  await pool.query('CALL sp_enfermeira_joy(1)');
  await pool.query('CALL sp_enfermeira_joy(2)');

  console.log(`\n========================================`);
  console.log(`Resultados dos Testes: ${passed} PASSOU, ${failed} FALHOU`);
  console.log(`========================================\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Erro fatal nos testes:', err);
  process.exit(1);
});
