import pool from '../src/config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../../');

const ABILITY_DATA = [
  { id: 1, nome: 'overgrow', nome_formatado: 'Overgrow', descricao: 'Aumenta em 50% o poder de golpes de Planta quando o HP estiver com 1/3 ou menos.', efeito_tipo: 'PINCH_BOOST_GRASS' },
  { id: 2, nome: 'blaze', nome_formatado: 'Blaze', descricao: 'Aumenta em 50% o poder de golpes de Fogo quando o HP estiver com 1/3 ou menos.', efeito_tipo: 'PINCH_BOOST_FIRE' },
  { id: 3, nome: 'torrent', nome_formatado: 'Torrent', descricao: 'Aumenta em 50% o poder de golpes de Água quando o HP estiver com 1/3 ou menos.', efeito_tipo: 'PINCH_BOOST_WATER' },
  { id: 4, nome: 'shield-dust', nome_formatado: 'Shield Dust', descricao: 'Bloqueia efeitos secundários de golpes adversários.', efeito_tipo: 'SHIELD_DUST' },
  { id: 5, nome: 'shed-skin', nome_formatado: 'Shed Skin', descricao: 'Chance de 33% de curar condições de status ao final de cada turno.', efeito_tipo: 'SHED_SKIN' },
  { id: 6, nome: 'compound-eyes', nome_formatado: 'Compound Eyes', descricao: 'Aumenta a precisão dos golpes em 30%.', efeito_tipo: 'ACCURACY_BOOST' },
  { id: 7, nome: 'swarm', nome_formatado: 'Swarm', descricao: 'Aumenta em 50% o poder de golpes de Inseto com HP crítico.', efeito_tipo: 'PINCH_BOOST_BUG' },
  { id: 8, nome: 'keen-eye', nome_formatado: 'Keen Eye', descricao: 'Impede que a precisão seja reduzida pelo adversário.', efeito_tipo: 'PREVENT_ACCURACY_DROP' },
  { id: 9, nome: 'tangled-feet', nome_formatado: 'Tangled Feet', descricao: 'Aumenta a evasão quando confuso.', efeito_tipo: 'EVASION_CONFUSED' },
  { id: 10, nome: 'guts', nome_formatado: 'Guts', descricao: 'Aumenta o Ataque em 50% se estiver com problema de status (queimadura, paralisia, veneno).', efeito_tipo: 'GUTS' },
  { id: 11, nome: 'run-away', nome_formatado: 'Run Away', descricao: 'Garante fuga de batalhas selvagens.', efeito_tipo: 'RUN_AWAY' },
  { id: 12, nome: 'intimidate', nome_formatado: 'Intimidate', descricao: 'Reduz o Ataque do oponente em 1 estágio ao entrar em campo.', efeito_tipo: 'INTIMIDATE' },
  { id: 13, nome: 'static', nome_formatado: 'Static', descricao: 'Chance de 30% de paralisar o atacante ao sofrer golpe de contato físico.', efeito_tipo: 'CONTACT_PARALYSIS' },
  { id: 14, nome: 'sand-veil', nome_formatado: 'Sand Veil', descricao: 'Aumenta a evasão em 20% durante Tempestade de Areia.', efeito_tipo: 'SAND_VEIL' },
  { id: 15, nome: 'poison-point', nome_formatado: 'Poison Point', descricao: 'Chance de 30% de envenenar o atacante ao sofrer golpe de contato físico.', efeito_tipo: 'CONTACT_POISON' },
  { id: 16, nome: 'rivalry', nome_formatado: 'Rivalry', descricao: 'Modifica o dano com base no gênero do adversário.', efeito_tipo: 'RIVALRY' },
  { id: 17, nome: 'cute-charm', nome_formatado: 'Cute Charm', descricao: 'Chance de apaixonar o atacante ao sofrer golpe de contato físico.', efeito_tipo: 'CONTACT_ATTRACT' },
  { id: 18, nome: 'magic-guard', nome_formatado: 'Magic Guard', descricao: 'Só sofre dano de ataques diretos, imune a veneno e clima.', efeito_tipo: 'MAGIC_GUARD' },
  { id: 19, nome: 'flash-fire', nome_formatado: 'Flash Fire', descricao: 'Imune a golpes de Fogo; ao receber um, fortalece seus próprios golpes de Fogo em 50%.', efeito_tipo: 'FLASH_FIRE' },
  { id: 20, nome: 'inner-focus', nome_formatado: 'Inner Focus', descricao: 'Impede que o Pokémon hesite (flinch).', efeito_tipo: 'INNER_FOCUS' },
  { id: 21, nome: 'chlorophyll', nome_formatado: 'Chlorophyll', descricao: 'Dobra a Velocidade durante Sol Intenso (Sunny Day).', efeito_tipo: 'CHLOROPHYLL' },
  { id: 22, nome: 'effect-spore', nome_formatado: 'Effect Spore', descricao: 'Chance de paralisar, adormecer ou envenenar quem fizer contato físico.', efeito_tipo: 'EFFECT_SPORE' },
  { id: 23, nome: 'dry-skin', nome_formatado: 'Dry Skin', descricao: 'Recupera HP na chuva e com golpes de Água; vulnerável a Fogo.', efeito_tipo: 'DRY_SKIN' },
  { id: 24, nome: 'tinted-lens', nome_formatado: 'Tinted Lens', descricao: 'Dobra o poder de golpes que não seriam muito efetivos.', efeito_tipo: 'TINTED_LENS' },
  { id: 25, nome: 'arena-trap', nome_formatado: 'Arena Trap', descricao: 'Impede que o oponente fuja ou seja trocado.', efeito_tipo: 'ARENA_TRAP' },
  { id: 26, nome: 'pickup', nome_formatado: 'Pickup', descricao: 'Pode encontrar itens após batalhas.', efeito_tipo: 'PICKUP' },
  { id: 27, nome: 'technician', nome_formatado: 'Technician', descricao: 'Aumenta em 50% o poder de golpes com poder base 60 ou menor.', efeito_tipo: 'TECHNICIAN' },
  { id: 28, nome: 'limber', nome_formatado: 'Limber', descricao: 'Protege totalmente contra paralisia.', efeito_tipo: 'IMMUNE_PARALYSIS' },
  { id: 29, nome: 'damp', nome_formatado: 'Damp', descricao: 'Impede o uso de Self-Destruct e Explosion.', efeito_tipo: 'DAMP' },
  { id: 30, nome: 'cloud-nine', nome_formatado: 'Cloud Nine', descricao: 'Anula todos os efeitos de clima na batalha.', efeito_tipo: 'CLOUD_NINE' },
  { id: 31, nome: 'vital-spirit', nome_formatado: 'Vital Spirit', descricao: 'Impede totalmente que o Pokémon adormeça.', efeito_tipo: 'IMMUNE_SLEEP' },
  { id: 32, nome: 'anger-point', nome_formatado: 'Anger Point', descricao: 'Maximiza o Ataque (+6 estágios) ao receber um acerto crítico.', efeito_tipo: 'ANGER_POINT' },
  { id: 33, nome: 'water-absorb', nome_formatado: 'Water Absorb', descricao: 'Imune a golpes de Água; recupera 25% do HP máximo ao ser atingido por um.', efeito_tipo: 'WATER_ABSORB' },
  { id: 34, nome: 'swift-swim', nome_formatado: 'Swift Swim', descricao: 'Dobra a Velocidade durante Chuva (Rain Dance).', efeito_tipo: 'SWIFT_SWIM' },
  { id: 35, nome: 'synchronize', nome_formatado: 'Synchronize', descricao: 'Passa envenenamento, paralisia ou queimadura para o atacante.', efeito_tipo: 'SYNCHRONIZE' },
  { id: 36, nome: 'no-guard', nome_formatado: 'No Guard', descricao: 'Todos os golpes do usuário e contra ele nunca erram.', efeito_tipo: 'NO_GUARD' },
  { id: 37, nome: 'clear-body', nome_formatado: 'Clear Body', descricao: 'Impede redução de atributos causada por adversários.', efeito_tipo: 'CLEAR_BODY' },
  { id: 38, nome: 'liquid-ooze', nome_formatado: 'Liquid Ooze', descricao: 'Causa dano a quem tentar drenar HP deste Pokémon.', efeito_tipo: 'LIQUID_OOZE' },
  { id: 39, nome: 'rock-head', nome_formatado: 'Rock Head', descricao: 'Protege contra dano de recuo de seus próprios golpes.', efeito_tipo: 'ROCK_HEAD' },
  { id: 40, nome: 'sturdy', nome_formatado: 'Sturdy', descricao: 'Imune a golpes de nocaute de 1 golpe (OHKO).', efeito_tipo: 'STURDY' },
  { id: 41, nome: 'flame-body', nome_formatado: 'Flame Body', descricao: 'Chance de 30% de queimar o atacante ao sofrer golpe de contato físico.', efeito_tipo: 'CONTACT_BURN' },
  { id: 42, nome: 'oblivious', nome_formatado: 'Oblivious', descricao: 'Imune a atração e provocação.', efeito_tipo: 'OBLIVIOUS' },
  { id: 43, nome: 'own-tempo', nome_formatado: 'Own Tempo', descricao: 'Imune a confusão.', efeito_tipo: 'OWN_TEMPO' },
  { id: 44, nome: 'magnet-pull', nome_formatado: 'Magnet Pull', descricao: 'Impede a troca de Pokémons do tipo Aço adversários.', efeito_tipo: 'MAGNET_PULL' },
  { id: 45, nome: 'early-bird', nome_formatado: 'Early Bird', descricao: 'Acorda do sono na metade do tempo normal.', efeito_tipo: 'EARLY_BIRD' },
  { id: 46, nome: 'thick-fat', nome_formatado: 'Thick Fat', descricao: 'Reduz o dano recebido de golpes de Fogo e Gelo em 50%.', efeito_tipo: 'THICK_FAT' },
  { id: 47, nome: 'hydration', nome_formatado: 'Hydration', descricao: 'Cura problemas de status no final do turno durante chuva.', efeito_tipo: 'HYDRATION' },
  { id: 48, nome: 'shell-armor', nome_formatado: 'Shell Armor', descricao: 'Protege totalmente contra acertos críticos.', efeito_tipo: 'SHELL_ARMOR' },
  { id: 49, nome: 'battle-armor', nome_formatado: 'Battle Armor', descricao: 'Protege totalmente contra acertos críticos.', efeito_tipo: 'BATTLE_ARMOR' },
  { id: 50, nome: 'skill-link', nome_formatado: 'Skill Link', descricao: 'Golpes de múltiplos ataques sempre atingem 5 vezes.', efeito_tipo: 'SKILL_LINK' },
  { id: 51, nome: 'levitate', nome_formatado: 'Levitate', descricao: 'Levita no ar e garante imunidade total a golpes e efeitos do tipo Terra.', efeito_tipo: 'LEVITATE' },
  { id: 52, nome: 'insomnia', nome_formatado: 'Insomnia', descricao: 'Impede totalmente o adormecimento.', efeito_tipo: 'IMMUNE_SLEEP' },
  { id: 53, nome: 'forewarn', nome_formatado: 'Forewarn', descricao: 'Identifica o golpe mais forte do oponente na entrada.', efeito_tipo: 'FOREWARN' },
  { id: 54, nome: 'hyper-cutter', nome_formatado: 'Hyper Cutter', descricao: 'Impede que o adversário reduza seu Ataque.', efeito_tipo: 'PREVENT_ATK_DROP' },
  { id: 55, nome: 'soundproof', nome_formatado: 'Soundproof', descricao: 'Garante imunidade total a golpes sonoros (ex: Roar, Supersonic).', efeito_tipo: 'SOUNDPROOF' },
  { id: 56, nome: 'volt-absorb', nome_formatado: 'Volt Absorb', descricao: 'Imune a golpes Elétricos; recupera 25% de HP ao receber um.', efeito_tipo: 'VOLT_ABSORB' },
  { id: 57, nome: 'water-veil', nome_formatado: 'Water Veil', descricao: 'Impede totalmente queimaduras.', efeito_tipo: 'IMMUNE_BURN' },
  { id: 58, nome: 'scrappy', nome_formatado: 'Scrappy', descricao: 'Permite acertar golpes do tipo Normal e Lutador em Pokémons Fantasma.', efeito_tipo: 'SCRAPPY' },
  { id: 59, nome: 'sniper', nome_formatado: 'Sniper', descricao: 'Golpes críticos causam 2.25x de dano em vez de 1.5x.', efeito_tipo: 'SNIPER' },
  { id: 60, nome: 'leaf-guard', nome_formatado: 'Leaf Guard', descricao: 'Protege contra problemas de status durante Sol Intenso.', efeito_tipo: 'LEAF_GUARD' },
  { id: 61, nome: 'lightning-rod', nome_formatado: 'Lightning Rod', descricao: 'Atrai e anula golpes elétricos, aumentando Sp. Atk.', efeito_tipo: 'LIGHTNING_ROD' },
  { id: 62, nome: 'filter', nome_formatado: 'Filter', descricao: 'Reduz o dano de golpes super efetivos em 25%.', efeito_tipo: 'FILTER' },
  { id: 63, nome: 'iron-fist', nome_formatado: 'Iron Fist', descricao: 'Aumenta em 20% o poder de golpes de soco.', efeito_tipo: 'IRON_FIST' },
  { id: 64, nome: 'reckless', nome_formatado: 'Reckless', descricao: 'Aumenta em 20% o poder de golpes com recuo.', efeito_tipo: 'RECKLESS' },
  { id: 65, nome: 'adaptability', nome_formatado: 'Adaptability', descricao: 'Aumenta o bônus de STAB de 1.5x para 2.0x.', efeito_tipo: 'ADAPTABILITY' },
  { id: 66, nome: 'pressure', nome_formatado: 'Pressure', descricao: 'Faz o adversário gastar 2 PPs por golpe usado contra você.', efeito_tipo: 'PRESSURE' },
  { id: 67, nome: 'serene-grace', nome_formatado: 'Serene Grace', descricao: 'Dobra as chances de ativação de efeitos secundários de golpes.', efeito_tipo: 'SERENE_GRACE' },
  { id: 68, nome: 'natural-cure', nome_formatado: 'Natural Cure', descricao: 'Cura todas as condições de status ao ser trocado da batalha.', efeito_tipo: 'NATURAL_CURE' },
  { id: 69, nome: 'immunity', nome_formatado: 'Immunity', descricao: 'Impede totalmente o envenenamento.', efeito_tipo: 'IMMUNE_POISON' },
  { id: 70, nome: 'trace', nome_formatado: 'Trace', descricao: 'Copia a habilidade do adversário ao entrar em campo.', efeito_tipo: 'TRACE' },
  { id: 71, nome: 'download', nome_formatado: 'Download', descricao: 'Aumenta Ataque ou Sp. Atk dependendo da defesa mais fraca do oponente.', efeito_tipo: 'DOWNLOAD' }
];

async function migrate() {
  console.log('🚀 Iniciando migração da engine de Pokémon FireRed no MySQL...');

  // 1. Criar tabela habilidade
  await pool.query(`
    CREATE TABLE IF NOT EXISTS habilidade (
      id INT PRIMARY KEY,
      nome VARCHAR(50) NOT NULL UNIQUE,
      nome_formatado VARCHAR(50) NOT NULL,
      descricao VARCHAR(200) NOT NULL,
      efeito_tipo VARCHAR(40) NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('✅ Tabela `habilidade` garantida.');

  // Popular tabela habilidade
  for (const ab of ABILITY_DATA) {
    await pool.query(
      `INSERT INTO habilidade (id, nome, nome_formatado, descricao, efeito_tipo)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE 
         nome_formatado = VALUES(nome_formatado),
         descricao = VALUES(descricao),
         efeito_tipo = VALUES(efeito_tipo)`,
      [ab.id, ab.nome, ab.nome_formatado, ab.descricao, ab.efeito_tipo]
    );
  }
  console.log(`✅ ${ABILITY_DATA.length} habilidades inseridas/atualizadas.`);

  // 2. Colunas em especie_pokemon
  const [colsEsp] = await pool.query('DESCRIBE especie_pokemon');
  const colEspNames = colsEsp.map(c => c.Field);
  if (!colEspNames.includes('habilidade1_id')) {
    await pool.query(`ALTER TABLE especie_pokemon ADD COLUMN habilidade1_id INT NULL, ADD CONSTRAINT fk_esp_hab1 FOREIGN KEY (habilidade1_id) REFERENCES habilidade(id)`);
    console.log('✅ Coluna `habilidade1_id` adicionada em `especie_pokemon`.');
  }
  if (!colEspNames.includes('habilidade2_id')) {
    await pool.query(`ALTER TABLE especie_pokemon ADD COLUMN habilidade2_id INT NULL, ADD CONSTRAINT fk_esp_hab2 FOREIGN KEY (habilidade2_id) REFERENCES habilidade(id)`);
    console.log('✅ Coluna `habilidade2_id` adicionada em `especie_pokemon`.');
  }

  // 3. Mapear habilidades das espécies com base no cache_pokeapi
  const [allHabs] = await pool.query('SELECT id, nome FROM habilidade');
  const habMap = new Map(allHabs.map(h => [h.nome, h.id]));

  for (let i = 1; i <= 151; i++) {
    const filePath = path.join(rootDir, 'cache_pokeapi', `pokemon_${i}.json`);
    if (fs.existsSync(filePath)) {
      const pData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const abs = pData.abilities.filter(a => !a.is_hidden).sort((a, b) => a.slot - b.slot);
      let h1Name = abs[0]?.ability?.name || null;
      let h2Name = abs[1]?.ability?.name || null;

      // Ajuste canônico de Gen 3: Gengar / Gastly / Haunter tem Levitate
      if ([92, 93, 94].includes(i)) {
        h1Name = 'levitate';
        h2Name = null;
      }

      const h1Id = h1Name ? (habMap.get(h1Name) || null) : null;
      const h2Id = h2Name ? (habMap.get(h2Name) || null) : null;

      await pool.query(
        'UPDATE especie_pokemon SET habilidade1_id = ?, habilidade2_id = ? WHERE id_pokedex = ?',
        [h1Id, h2Id, i]
      );
    }
  }
  console.log('✅ Habilidades vinculadas com sucesso às 151 espécies Pokémon.');

  // 4. Colunas em pokemon_instancia
  const [colsPi] = await pool.query('DESCRIBE pokemon_instancia');
  const colPiNames = colsPi.map(c => c.Field);

  if (!colPiNames.includes('habilidade_id')) {
    await pool.query(`ALTER TABLE pokemon_instancia ADD COLUMN habilidade_id INT NULL, ADD CONSTRAINT fk_pi_hab FOREIGN KEY (habilidade_id) REFERENCES habilidade(id)`);
    console.log('✅ Coluna `habilidade_id` adicionada em `pokemon_instancia`.');
  }
  if (!colPiNames.includes('condicao_status')) {
    await pool.query(`ALTER TABLE pokemon_instancia ADD COLUMN condicao_status ENUM('NENHUM', 'PARALISIA', 'SONO', 'ENVENENAMENTO', 'QUEIMADURA', 'CONGELAMENTO') NOT NULL DEFAULT 'NENHUM'`);
    console.log('✅ Coluna `condicao_status` adicionada em `pokemon_instancia`.');
  }
  if (!colPiNames.includes('turnos_sono')) {
    await pool.query(`ALTER TABLE pokemon_instancia ADD COLUMN turnos_sono INT NOT NULL DEFAULT 0`);
    console.log('✅ Coluna `turnos_sono` adicionada em `pokemon_instancia`.');
  }
  if (!colPiNames.includes('mod_ataque')) {
    await pool.query(`ALTER TABLE pokemon_instancia 
      ADD COLUMN mod_ataque TINYINT NOT NULL DEFAULT 0,
      ADD COLUMN mod_defesa TINYINT NOT NULL DEFAULT 0,
      ADD COLUMN mod_sp_ataque TINYINT NOT NULL DEFAULT 0,
      ADD COLUMN mod_sp_defesa TINYINT NOT NULL DEFAULT 0,
      ADD COLUMN mod_velocidade TINYINT NOT NULL DEFAULT 0,
      ADD COLUMN mod_precisao TINYINT NOT NULL DEFAULT 0
    `);
    console.log('✅ Colunas de modificadores de estágios adicionadas em `pokemon_instancia`.');
  }

  // Atribuir habilidade padrão para instâncias já existentes
  await pool.query(`
    UPDATE pokemon_instancia pi
    JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
    SET pi.habilidade_id = IFNULL(pi.habilidade_id, ep.habilidade1_id)
    WHERE pi.habilidade_id IS NULL AND ep.habilidade1_id IS NOT NULL;
  `);
  console.log('✅ Instâncias de Pokémon atualizadas com suas habilidades.');

  // 5. Colunas em movimento
  const [colsMov] = await pool.query('DESCRIBE movimento');
  const colMovNames = colsMov.map(c => c.Field);

  if (!colMovNames.includes('efeito_tipo')) {
    await pool.query(`ALTER TABLE movimento ADD COLUMN efeito_tipo VARCHAR(40) NULL`);
    console.log('✅ Coluna `efeito_tipo` adicionada em `movimento`.');
  }
  if (!colMovNames.includes('efeito_chance')) {
    await pool.query(`ALTER TABLE movimento ADD COLUMN efeito_chance INT NOT NULL DEFAULT 100`);
    console.log('✅ Coluna `efeito_chance` adicionada em `movimento`.');
  }
  if (!colMovNames.includes('efeito_valor')) {
    await pool.query(`ALTER TABLE movimento ADD COLUMN efeito_valor INT NOT NULL DEFAULT 1`);
    console.log('✅ Coluna `efeito_valor` adicionada em `movimento`.');
  }

  // 6. Colunas em batalha
  const [colsBat] = await pool.query('DESCRIBE batalha');
  const colBatNames = colsBat.map(c => c.Field);

  if (!colBatNames.includes('clima')) {
    await pool.query(`ALTER TABLE batalha ADD COLUMN clima ENUM('NENHUM', 'CHUVA', 'SOL', 'TEMPESTADE_AREIA', 'GRANIZO') NOT NULL DEFAULT 'NENHUM'`);
    console.log('✅ Coluna `clima` adicionada em `batalha`.');
  }
  if (!colBatNames.includes('turnos_clima')) {
    await pool.query(`ALTER TABLE batalha ADD COLUMN turnos_clima INT NOT NULL DEFAULT 0`);
    console.log('✅ Coluna `turnos_clima` adicionada em `batalha`.');
  }

  // 7. Configuração dos efeitos nos movimentos
  const MOVE_EFFECTS = [
    // Clima
    { ids: [240], efeito: 'CLIMA_CHUVA', chance: 100, valor: 5 },       // Rain Dance
    { ids: [241], efeito: 'CLIMA_SOL', chance: 100, valor: 5 },         // Sunny Day
    { ids: [201], efeito: 'CLIMA_AREIA', chance: 100, valor: 5 },       // Sandstorm
    { ids: [258], efeito: 'CLIMA_GRANIZO', chance: 100, valor: 5 },     // Hail

    // Status: Paralisia
    { ids: [78, 86, 137], efeito: 'PARALISIA', chance: 100, valor: 1 }, // Stun Spore, Thunder Wave, Glare

    // Status: Sono
    { ids: [47, 79, 95, 142, 147, 320], efeito: 'SONO', chance: 100, valor: 1 }, // Sing, Sleep Powder, Hypnosis, Lovely Kiss, Spore, Grass Whistle
    { ids: [156], efeito: 'SONO_REST', chance: 100, valor: 1 },         // Rest

    // Status: Envenenamento
    { ids: [77, 92, 139], efeito: 'ENVENENAMENTO', chance: 100, valor: 1 }, // Poison Powder, Toxic, Poison Gas

    // Status: Queimadura
    { ids: [261], efeito: 'QUEIMADURA', chance: 100, valor: 1 },        // Will-O-Wisp

    // Cura de HP
    { ids: [105, 135, 235, 236], efeito: 'CURA_HP', chance: 100, valor: 50 }, // Recover, Soft Boiled, Synthesis, Moonlight

    // Buffs de Atributo
    { ids: [14], efeito: 'BUFF_ATAQUE', chance: 100, valor: 2 },        // Swords Dance (+2 Atk)
    { ids: [96, 336], efeito: 'BUFF_ATAQUE', chance: 100, valor: 1 },   // Meditate, Howl (+1 Atk)
    { ids: [97], efeito: 'BUFF_VELOCIDADE', chance: 100, valor: 2 },    // Agility (+2 Spd)
    { ids: [106, 110, 111], efeito: 'BUFF_DEFESA', chance: 100, valor: 1 }, // Harden, Withdraw, Defense Curl (+1 Def)
    { ids: [112, 151], efeito: 'BUFF_DEFESA', chance: 100, valor: 2 }, // Barrier, Acid Armor (+2 Def)
    { ids: [74], efeito: 'BUFF_SP_ATK', chance: 100, valor: 1 },        // Growth (+1 SpAtk)
    { ids: [133], efeito: 'BUFF_SP_DEF', chance: 100, valor: 2 },       // Amnesia (+2 SpDef)
    { ids: [347], efeito: 'BUFF_CALM_MIND', chance: 100, valor: 1 },    // Calm Mind (+1 SpAtk, +1 SpDef)
    { ids: [339], efeito: 'BUFF_BULK_UP', chance: 100, valor: 1 },      // Bulk Up (+1 Atk, +1 Def)
    { ids: [349], efeito: 'BUFF_DRAGON_DANCE', chance: 100, valor: 1 }, // Dragon Dance (+1 Atk, +1 Spd)

    // Debuffs de Atributo
    { ids: [39, 43], efeito: 'DEBUFF_DEFESA', chance: 100, valor: 1 },  // Tail Whip, Leer (-1 Def)
    { ids: [103], efeito: 'DEBUFF_DEFESA', chance: 100, valor: 2 },     // Screech (-2 Def)
    { ids: [45], efeito: 'DEBUFF_ATAQUE', chance: 100, valor: 1 },      // Growl (-1 Atk)
    { ids: [204, 297], efeito: 'DEBUFF_ATAQUE', chance: 100, valor: 2 },// Charm, Feather Dance (-2 Atk)
    { ids: [81], efeito: 'DEBUFF_VELOCIDADE', chance: 100, valor: 1 },  // String Shot (-1 Spd)
    { ids: [184], efeito: 'DEBUFF_VELOCIDADE', chance: 100, valor: 2 }, // Scary Face (-2 Spd)
    { ids: [28, 108, 148], efeito: 'DEBUFF_PRECISAO', chance: 100, valor: 1 }, // Sand Attack, Smokescreen, Flash (-1 Acc)
    { ids: [313, 319], efeito: 'DEBUFF_SP_DEF', chance: 100, valor: 2 }, // Fake Tears, Metal Sound (-2 SpDef)

    // Dano com Efeito Secundário
    { ids: [7, 52, 53, 126, 172, 257], efeito: 'DANO_E_QUEIMADURA', chance: 10, valor: 1 }, // Fire Punch, Ember, Flamethrower, Fire Blast, Flame Wheel, Heat Wave
    { ids: [9, 84, 85, 209], efeito: 'DANO_E_PARALISIA', chance: 10, valor: 1 }, // Thunder Punch, Thunder Shock, Thunderbolt, Spark
    { ids: [34, 87, 225], efeito: 'DANO_E_PARALISIA', chance: 30, valor: 1 },    // Body Slam, Thunder, Dragon Breath
    { ids: [8, 58, 59, 181], efeito: 'DANO_E_CONGELAMENTO', chance: 10, valor: 1 }, // Ice Punch, Ice Beam, Blizzard, Powder Snow
    { ids: [40, 124, 188, 305], efeito: 'DANO_E_ENVENENAMENTO', chance: 30, valor: 1 } // Poison Sting, Sludge, Sludge Bomb, Poison Fang
  ];

  for (const item of MOVE_EFFECTS) {
    for (const movId of item.ids) {
      await pool.query(
        'UPDATE movimento SET efeito_tipo = ?, efeito_chance = ?, efeito_valor = ? WHERE id = ?',
        [item.efeito, item.chance, item.valor, movId]
      );
    }
  }
  console.log('✅ Golpes de status, clima e efeitos secundários catalogados na tabela `movimento`.');

  // 8. Criar função fn_calcular_stat_com_estagio
  await pool.query('DROP FUNCTION IF EXISTS fn_calcular_stat_com_estagio;');
  await pool.query(`
    CREATE FUNCTION fn_calcular_stat_com_estagio(p_stat INT, p_estagio INT)
    RETURNS INT DETERMINISTIC
    BEGIN
      DECLARE v_mult DECIMAL(4,2) DEFAULT 1.0;
      IF p_estagio = 1 THEN SET v_mult = 1.50;
      ELSEIF p_estagio = 2 THEN SET v_mult = 2.00;
      ELSEIF p_estagio = 3 THEN SET v_mult = 2.50;
      ELSEIF p_estagio = 4 THEN SET v_mult = 3.00;
      ELSEIF p_estagio = 5 THEN SET v_mult = 3.50;
      ELSEIF p_estagio >= 6 THEN SET v_mult = 4.00;
      ELSEIF p_estagio = -1 THEN SET v_mult = 0.67;
      ELSEIF p_estagio = -2 THEN SET v_mult = 0.50;
      ELSEIF p_estagio = -3 THEN SET v_mult = 0.40;
      ELSEIF p_estagio = -4 THEN SET v_mult = 0.33;
      ELSEIF p_estagio = -5 THEN SET v_mult = 0.28;
      ELSEIF p_estagio <= -6 THEN SET v_mult = 0.25;
      END IF;
      RETURN GREATEST(1, FLOOR(p_stat * v_mult));
    END;
  `);
  console.log('✅ Função `fn_calcular_stat_com_estagio` criada.');

  // 9. Procedure sp_atualizar_ivs_evs_pokemon
  await pool.query('DROP PROCEDURE IF EXISTS sp_atualizar_ivs_evs_pokemon;');
  await pool.query(`
    CREATE PROCEDURE sp_atualizar_ivs_evs_pokemon(
      IN p_instancia_id INT,
      IN p_iv_hp INT,
      IN p_iv_atk INT,
      IN p_iv_def INT,
      IN p_iv_sp_atk INT,
      IN p_iv_sp_def INT,
      IN p_iv_spd INT,
      IN p_ev_hp INT,
      IN p_ev_atk INT,
      IN p_ev_def INT,
      IN p_ev_sp_atk INT,
      IN p_ev_sp_def INT,
      IN p_ev_spd INT
    )
    BEGIN
      DECLARE v_treinador_id INT;
      DECLARE v_em_batalha INT;
      DECLARE v_soma_evs INT;

      SELECT treinador_id INTO v_treinador_id FROM pokemon_instancia WHERE id = p_instancia_id;
      IF v_treinador_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pokémon não encontrado!';
      END IF;

      SELECT COUNT(*) INTO v_em_batalha FROM batalha
      WHERE status = 'EM_ANDAMENTO' AND (treinador_jogador_id = v_treinador_id OR treinador_oponente_id = v_treinador_id);
      IF v_em_batalha > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não é possível alterar IVs/EVs durante uma batalha em andamento!';
      END IF;

      IF p_iv_hp < 0 OR p_iv_hp > 31 OR p_iv_atk < 0 OR p_iv_atk > 31 OR
         p_iv_def < 0 OR p_iv_def > 31 OR p_iv_sp_atk < 0 OR p_iv_sp_atk > 31 OR
         p_iv_sp_def < 0 OR p_iv_sp_def > 31 OR p_iv_spd < 0 OR p_iv_spd > 31 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Os IVs devem estar no intervalo oficial de 0 a 31!';
      END IF;

      IF p_ev_hp < 0 OR p_ev_hp > 255 OR p_ev_atk < 0 OR p_ev_atk > 255 OR
         p_ev_def < 0 OR p_ev_def > 255 OR p_ev_sp_atk < 0 OR p_ev_sp_atk > 255 OR
         p_ev_sp_def < 0 OR p_ev_sp_def > 255 OR p_ev_spd < 0 OR p_ev_spd > 255 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Cada EV individual deve estar no intervalo oficial de 0 a 255!';
      END IF;

      SET v_soma_evs = p_ev_hp + p_ev_atk + p_ev_def + p_ev_sp_atk + p_ev_sp_def + p_ev_spd;
      IF v_soma_evs > 510 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'A soma de todos os EVs não pode ultrapassar o teto máximo de 510 pontos!';
      END IF;

      UPDATE pokemon_instancia
      SET iv_hp = p_iv_hp, iv_ataque = p_iv_atk, iv_defesa = p_iv_def,
          iv_sp_ataque = p_iv_sp_atk, iv_sp_defesa = p_iv_sp_def, iv_velocidade = p_iv_spd,
          ev_hp = p_ev_hp, ev_ataque = p_ev_atk, ev_defesa = p_ev_def,
          ev_sp_ataque = p_ev_sp_atk, ev_sp_defesa = p_ev_sp_def, ev_velocidade = p_ev_spd
      WHERE id = p_instancia_id;

      CALL sp_recalcular_status_pokemon(p_instancia_id);
      SELECT 'IVs e EVs atualizados com sucesso e atributos recalculados!' AS status;
    END;
  `);
  console.log('✅ Procedure `sp_atualizar_ivs_evs_pokemon` criada.');

  // 10. Procedure sp_atualizar_habilidade_pokemon
  await pool.query('DROP PROCEDURE IF EXISTS sp_atualizar_habilidade_pokemon;');
  await pool.query(`
    CREATE PROCEDURE sp_atualizar_habilidade_pokemon(
      IN p_instancia_id INT,
      IN p_habilidade_id INT
    )
    BEGIN
      DECLARE v_treinador_id INT;
      DECLARE v_especie_id INT;
      DECLARE v_em_batalha INT;
      DECLARE v_hab1, v_hab2 INT;

      SELECT pi.treinador_id, pi.especie_id, ep.habilidade1_id, ep.habilidade2_id
      INTO v_treinador_id, v_especie_id, v_hab1, v_hab2
      FROM pokemon_instancia pi
      JOIN especie_pokemon ep ON pi.especie_id = ep.id_pokedex
      WHERE pi.id = p_instancia_id;

      IF v_treinador_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Pokémon não encontrado!';
      END IF;

      SELECT COUNT(*) INTO v_em_batalha FROM batalha
      WHERE status = 'EM_ANDAMENTO' AND (treinador_jogador_id = v_treinador_id OR treinador_oponente_id = v_treinador_id);
      IF v_em_batalha > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não é possível alterar habilidade durante combate!';
      END IF;

      IF p_habilidade_id != v_hab1 AND (v_hab2 IS NULL OR p_habilidade_id != v_hab2) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Esta habilidade não é válida para esta espécie!';
      END IF;

      UPDATE pokemon_instancia SET habilidade_id = p_habilidade_id WHERE id = p_instancia_id;
      SELECT 'Habilidade atualizada com sucesso!' AS status;
    END;
  `);
  console.log('✅ Procedure `sp_atualizar_habilidade_pokemon` criada.');

  // 11. Atualizar sp_enfermeira_joy para limpar status e estágios
  await pool.query('DROP PROCEDURE IF EXISTS sp_enfermeira_joy;');
  await pool.query(`
    CREATE PROCEDURE sp_enfermeira_joy(IN p_treinador_id INT)
    BEGIN
      DECLARE v_em_batalha INT;
      DECLARE v_nome_treinador VARCHAR(50);

      SELECT nome INTO v_nome_treinador FROM treinador WHERE id = p_treinador_id;
      IF v_nome_treinador IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Treinador não encontrado!';
      END IF;

      SELECT COUNT(*) INTO v_em_batalha FROM batalha
      WHERE status = 'EM_ANDAMENTO' AND (treinador_jogador_id = p_treinador_id OR treinador_oponente_id = p_treinador_id);
      IF v_em_batalha > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Enfermeira Joy: "Você está no meio de uma batalha! Termine seu combate antes de vir ao Centro Pokémon."';
      END IF;

      UPDATE pokemon_instancia
      SET hp_atual = hp_max,
          esta_desmaiado = FALSE,
          condicao_status = 'NENHUM',
          turnos_sono = 0,
          mod_ataque = 0, mod_defesa = 0, mod_sp_ataque = 0,
          mod_sp_defesa = 0, mod_velocidade = 0, mod_precisao = 0
      WHERE treinador_id = p_treinador_id;

      UPDATE pokemon_movimento_ativo pma
      JOIN pokemon_instancia pi ON pma.pokemon_instancia_id = pi.id
      JOIN movimento m ON pma.movimento_id = m.id
      SET pma.pp_atual = m.pp_maximo
      WHERE pi.treinador_id = p_treinador_id;

      SELECT CONCAT('Enfermeira Joy: "Olá, ', v_nome_treinador, '! Seus pokémons foram totalmente curados e os PPs restaurados. Esperamos vê-lo novamente!"') AS centro_pokemon;
    END;
  `);
  console.log('✅ Procedure `sp_enfermeira_joy` atualizada.');

  // 12. Atualizar sp_iniciar_batalha
  await pool.query('DROP PROCEDURE IF EXISTS sp_iniciar_batalha;');
  await pool.query(`
    CREATE PROCEDURE sp_iniciar_batalha(
      IN p_treinador_jogador_id INT,
      IN p_treinador_oponente_id INT
    )
    BEGIN
      DECLARE v_batalha_id INT;
      DECLARE v_pok_jog_id, v_pok_opo_id INT;
      DECLARE v_batalha_em_andamento INT;
      DECLARE v_hab_jog_efeito, v_hab_opo_efeito VARCHAR(40);
      DECLARE v_jog_nome, v_opo_nome VARCHAR(50);

      SELECT COUNT(*) INTO v_batalha_em_andamento FROM batalha
      WHERE status = 'EM_ANDAMENTO'
        AND (treinador_jogador_id IN (p_treinador_jogador_id, p_treinador_oponente_id)
             OR treinador_oponente_id IN (p_treinador_jogador_id, p_treinador_oponente_id));
      IF v_batalha_em_andamento > 0 THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Não é possível iniciar a batalha! Um dos treinadores já está participando de uma batalha em andamento.';
      END IF;

      SELECT id INTO v_pok_jog_id FROM pokemon_instancia
      WHERE treinador_id = p_treinador_jogador_id AND esta_desmaiado = FALSE AND posicao_time <= 6
      ORDER BY posicao_time ASC LIMIT 1;

      SELECT id INTO v_pok_opo_id FROM pokemon_instancia
      WHERE treinador_id = p_treinador_oponente_id AND esta_desmaiado = FALSE AND posicao_time <= 6
      ORDER BY posicao_time ASC LIMIT 1;

      IF v_pok_jog_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O jogador não possui pokémons vivos para batalhar!';
      END IF;
      IF v_pok_opo_id IS NULL THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'O oponente não possui pokémons vivos para batalhar!';
      END IF;

      -- Resetar modificadores e status para o início da batalha
      UPDATE pokemon_instancia
      SET mod_ataque = 0, mod_defesa = 0, mod_sp_ataque = 0,
          mod_sp_defesa = 0, mod_velocidade = 0, mod_precisao = 0
      WHERE id IN (v_pok_jog_id, v_pok_opo_id);

      INSERT INTO batalha (treinador_jogador_id, treinador_oponente_id, status, pokemon_ativo_jogador_id, pokemon_ativo_oponente_id, turno_atual, clima, turnos_clima)
      VALUES (p_treinador_jogador_id, p_treinador_oponente_id, 'EM_ANDAMENTO', v_pok_jog_id, v_pok_opo_id, 1, 'NENHUM', 0);
      SET v_batalha_id = LAST_INSERT_ID();

      -- Log inicial
      INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
      VALUES (v_batalha_id, 1, 0, v_pok_jog_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id),
              CONCAT('Batalha iniciada! ', (SELECT apelido FROM pokemon_instancia WHERE id = v_pok_jog_id), ' vs ', (SELECT apelido FROM pokemon_instancia WHERE id = v_pok_opo_id), '!'));

      -- Processar Habilidades de Entrada (ex: Intimidate)
      SELECT h.efeito_tipo, pi.apelido INTO v_hab_jog_efeito, v_jog_nome
      FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_pok_jog_id;

      SELECT h.efeito_tipo, pi.apelido INTO v_hab_opo_efeito, v_opo_nome
      FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_pok_opo_id;

      IF v_hab_jog_efeito = 'INTIMIDATE' THEN
        UPDATE pokemon_instancia SET mod_ataque = GREATEST(-6, mod_ataque - 1) WHERE id = v_pok_opo_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (v_batalha_id, 1, 0, v_pok_jog_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id),
                CONCAT('A habilidade Intimidate de ', v_jog_nome, ' reduziu o Ataque do oponente!'));
      END IF;

      IF v_hab_opo_efeito = 'INTIMIDATE' THEN
        UPDATE pokemon_instancia SET mod_ataque = GREATEST(-6, mod_ataque - 1) WHERE id = v_pok_jog_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (v_batalha_id, 1, 0, v_pok_opo_id, v_pok_jog_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_jog_id),
                CONCAT('A habilidade Intimidate de ', v_opo_nome, ' reduziu o Ataque do seu pokémon!'));
      END IF;

      SELECT v_batalha_id AS batalha_id, 'Batalha iniciada com sucesso!' AS status;
    END;
  `);
  console.log('✅ Procedure `sp_iniciar_batalha` atualizada.');

  // 13. Atualizar sp_trocar_pokemon_batalha
  await pool.query('DROP PROCEDURE IF EXISTS sp_trocar_pokemon_batalha;');
  await pool.query(`
    CREATE PROCEDURE sp_trocar_pokemon_batalha(
      IN p_batalha_id INT,
      IN p_novo_pokemon_instancia_id INT
    )
    proc_troca: BEGIN
      DECLARE v_status_batalha VARCHAR(30);
      DECLARE v_turno, v_treinador_jog_id, v_treinador_opo_id, v_pok_antigo_id, v_pok_opo_id INT;
      DECLARE v_novo_dono_id, v_posicao_time INT;
      DECLARE v_esta_desmaiado BOOLEAN;
      DECLARE v_nome_antigo, v_nome_novo, v_nome_opo VARCHAR(50);
      DECLARE v_hab_novo_efeito, v_hab_antigo_efeito VARCHAR(40);

      -- Variáveis de contra-ataque do oponente
      DECLARE v_mov_opo_id, v_poder, v_precisao, v_tipo_mov, v_nivel_atk, v_atk_stat, v_def_stat, v_dano INT;
      DECLARE v_categoria, v_efeito_mov VARCHAR(40);
      DECLARE v_mult_tipo, v_stab DECIMAL(4,2);
      DECLARE v_msg TEXT;

      SELECT status, turno_atual, treinador_jogador_id, treinador_oponente_id, pokemon_ativo_jogador_id, pokemon_ativo_oponente_id
      INTO v_status_batalha, v_turno, v_treinador_jog_id, v_treinador_opo_id, v_pok_antigo_id, v_pok_opo_id
      FROM batalha WHERE id = p_batalha_id;

      IF v_status_batalha != 'EM_ANDAMENTO' THEN
        SELECT 'A batalha já foi finalizada!' AS erro;
        LEAVE proc_troca;
      END IF;

      SELECT treinador_id, esta_desmaiado, posicao_time, apelido
      INTO v_novo_dono_id, v_esta_desmaiado, v_posicao_time, v_nome_novo
      FROM pokemon_instancia WHERE id = p_novo_pokemon_instancia_id;

      IF v_novo_dono_id != v_treinador_jog_id THEN
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
      SELECT apelido INTO v_nome_opo FROM pokemon_instancia WHERE id = v_pok_opo_id;

      -- Habilidade Natural Cure: cura status ao sair de campo
      SELECT h.efeito_tipo INTO v_hab_antigo_efeito
      FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = v_pok_antigo_id;
      IF v_hab_antigo_efeito = 'NATURAL_CURE' THEN
        UPDATE pokemon_instancia SET condicao_status = 'NENHUM', turnos_sono = 0 WHERE id = v_pok_antigo_id;
      END IF;

      -- Resetar modificadores de atributos do pokémon que sai e do novo que entra
      UPDATE pokemon_instancia
      SET mod_ataque = 0, mod_defesa = 0, mod_sp_ataque = 0,
          mod_sp_defesa = 0, mod_velocidade = 0, mod_precisao = 0
      WHERE id IN (v_pok_antigo_id, p_novo_pokemon_instancia_id);

      -- Efetua a troca
      UPDATE batalha SET pokemon_ativo_jogador_id = p_novo_pokemon_instancia_id WHERE id = p_batalha_id;

      INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
      VALUES (p_batalha_id, v_turno, 1, p_novo_pokemon_instancia_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id),
              CONCAT('Jogador recolheu ', v_nome_antigo, ' e enviou ', v_nome_novo, '!'));

      -- Habilidade de Entrada do novo Pokémon (ex: Intimidate)
      SELECT h.efeito_tipo INTO v_hab_novo_efeito
      FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = p_novo_pokemon_instancia_id;
      IF v_hab_novo_efeito = 'INTIMIDATE' THEN
        UPDATE pokemon_instancia SET mod_ataque = GREATEST(-6, mod_ataque - 1) WHERE id = v_pok_opo_id;
        INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
        VALUES (p_batalha_id, v_turno, 1, p_novo_pokemon_instancia_id, v_pok_opo_id, NULL, 0, 1.00, (SELECT hp_atual FROM pokemon_instancia WHERE id = v_pok_opo_id),
                CONCAT('A habilidade Intimidate de ', v_nome_novo, ' reduziu o Ataque de ', v_nome_opo, '!'));
      END IF;

      -- O adversário tem direito a atacar o novo pokémon que acabou de entrar!
      SELECT movimento_id INTO v_mov_opo_id FROM pokemon_movimento_ativo
      WHERE pokemon_instancia_id = v_pok_opo_id AND pp_atual > 0 ORDER BY RAND() LIMIT 1;
      IF v_mov_opo_id IS NULL THEN SET v_mov_opo_id = 33; END IF; -- Tackle

      SELECT poder, precisao, tipo_id, categoria, efeito_tipo INTO v_poder, v_precisao, v_tipo_mov, v_categoria, v_efeito_mov
      FROM movimento WHERE id = v_mov_opo_id;

      SELECT pi.nivel, CASE WHEN v_categoria = 'Special' THEN fn_calcular_stat_com_estagio(pi.sp_ataque, pi.mod_sp_ataque) ELSE fn_calcular_stat_com_estagio(pi.ataque, pi.mod_ataque) END
      INTO v_nivel_atk, v_atk_stat FROM pokemon_instancia pi WHERE pi.id = v_pok_opo_id;

      SELECT CASE WHEN v_categoria = 'Special' THEN fn_calcular_stat_com_estagio(pi.sp_defesa, pi.mod_sp_defesa) ELSE fn_calcular_stat_com_estagio(pi.defesa, pi.mod_defesa) END
      INTO v_def_stat FROM pokemon_instancia pi WHERE pi.id = p_novo_pokemon_instancia_id;

      UPDATE pokemon_movimento_ativo SET pp_atual = GREATEST(0, pp_atual - 1)
      WHERE pokemon_instancia_id = v_pok_opo_id AND movimento_id = v_mov_opo_id;

      -- Multiplicador elemental
      SET v_mult_tipo = fn_obter_multiplicador_tipo(v_tipo_mov, p_novo_pokemon_instancia_id);

      -- Checar Levitate
      IF v_tipo_mov = 5 AND (SELECT h.efeito_tipo FROM pokemon_instancia pi LEFT JOIN habilidade h ON pi.habilidade_id = h.id WHERE pi.id = p_novo_pokemon_instancia_id) = 'LEVITATE' THEN
        SET v_mult_tipo = 0.00;
      END IF;

      IF v_poder IS NOT NULL AND v_poder > 0 THEN
        SET v_dano = FLOOR((((((2 * v_nivel_atk) / 5) + 2) * v_poder * (v_atk_stat / v_def_stat)) / 50 + 2) * v_mult_tipo);
        IF v_mult_tipo > 0 AND v_dano = 0 THEN SET v_dano = 1; END IF;
        IF v_mult_tipo = 0 THEN SET v_dano = 0; END IF;

        UPDATE pokemon_instancia
        SET esta_desmaiado = (hp_atual <= v_dano), hp_atual = GREATEST(0, hp_atual - v_dano)
        WHERE id = p_novo_pokemon_instancia_id;

        SET v_msg = CONCAT(v_nome_opo, ' atacou ', v_nome_novo, ' com ', (SELECT nome FROM movimento WHERE id = v_mov_opo_id), '! Dano: ', v_dano);
        IF v_mult_tipo >= 2.0 THEN SET v_msg = CONCAT(v_msg, ' (Super Efetivo!)'); END IF;
        IF v_mult_tipo <= 0.5 AND v_mult_tipo > 0 THEN SET v_msg = CONCAT(v_msg, ' (Não foi muito efetivo...)'); END IF;
        IF v_mult_tipo = 0 THEN SET v_msg = CONCAT(v_msg, ' (Não teve efeito!)'); END IF;
      ELSE
        SET v_dano = 0;
        SET v_msg = CONCAT(v_nome_opo, ' usou ', (SELECT nome FROM movimento WHERE id = v_mov_opo_id), '!');
      END IF;

      INSERT INTO log_batalha (batalha_id, numero_turno, ordem_acao, pokemon_atacante_id, pokemon_defensor_id, movimento_id, dano_causado, multiplicador_tipo, hp_restante_defensor, mensagem)
      VALUES (p_batalha_id, v_turno, 2, v_pok_opo_id, p_novo_pokemon_instancia_id, v_mov_opo_id, v_dano, v_mult_tipo, (SELECT hp_atual FROM pokemon_instancia WHERE id = p_novo_pokemon_instancia_id), v_msg);

      UPDATE batalha SET turno_atual = v_turno + 1 WHERE id = p_batalha_id;
      SELECT CONCAT('Troca realizada com sucesso no Turno ', v_turno, '!') AS status;
    END;
  `);
  console.log('✅ Procedure `sp_trocar_pokemon_batalha` atualizada.');

  console.log('🏁 Migração de estrutura do banco concluída com sucesso!');
}

migrate()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Erro na migração:', err);
    process.exit(1);
  });
