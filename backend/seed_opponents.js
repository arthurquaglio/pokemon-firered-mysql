import pool from './src/config/database.js';

export async function seedOpponents() {
  try {
    // 1. Verificar Misty (ID 4)
    const [mistyPoks] = await pool.query(
      'SELECT id FROM pokemon_instancia WHERE treinador_id = 4'
    );
    if (mistyPoks.length === 0) {
      console.log('Seeding Pokémons da Misty...');
      await pool.query('CALL sp_criar_pokemon_treinador(4, 120, 18, ?, 1)', ['Staryu da Misty']);
      await pool.query('CALL sp_criar_pokemon_treinador(4, 121, 21, ?, 2)', ['Starmie da Misty']);
      console.log('✅ Misty configurada com Staryu (Lv. 18) e Starmie (Lv. 21)!');
    }

    // 2. Verificar Lt. Surge (ID 5)
    const [surgePoks] = await pool.query(
      'SELECT id FROM pokemon_instancia WHERE treinador_id = 5'
    );
    if (surgePoks.length === 0) {
      console.log('Seeding Pokémons do Lt. Surge...');
      await pool.query('CALL sp_criar_pokemon_treinador(5, 100, 21, ?, 1)', ['Voltorb do Surge']);
      await pool.query('CALL sp_criar_pokemon_treinador(5, 25, 18, ?, 2)', ['Pikachu do Surge']);
      await pool.query('CALL sp_criar_pokemon_treinador(5, 26, 24, ?, 3)', ['Raichu do Surge']);
      console.log('✅ Lt. Surge configurado com Voltorb, Pikachu e Raichu!');
    }
  } catch (error) {
    console.warn('Aviso no seedOpponents:', error.message);
  }
}

if (process.argv[1].endsWith('seed_opponents.js')) {
  seedOpponents().then(() => {
    console.log('Seed de adversários finalizado.');
    process.exit(0);
  });
}
