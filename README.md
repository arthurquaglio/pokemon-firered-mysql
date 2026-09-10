# PROJETO BANCO DE DADOS: POKÉMON FIRE RED (GBA)
**Disciplina: Banco de Dados**  
**Arquivo de Entrega Principal:** `dump_pokemon_firered.sql`

---

## 🎮 Visão Geral da Arquitetura

O projeto implementa integralmente a mecânica de **Pokémon FireRed (GameBoy Advance / Gen 3)** diretamente dentro do MySQL 8.0, atendendo a todos os requisitos do enunciado:

1. **Pokédex Completa de Kanto (1 a 151 Pokémons)**:
   - Todos os 151 pokémons com tipos primários e secundários (respeitando a tipagem original da Gen 3).
   - Stats Base canônicos: HP, Attack, Defense, Special Attack, Special Defense, Speed.
   - Base EXP Yield e Effort Yields (EVs fornecidos ao ser derrotado).

2. **Mecânica de Evolução Diversificada**:
   - **Evolução por Nível (`LEVEL_UP`)**: Ex: Bulbasaur (lvl 16) -> Ivysaur (lvl 32) -> Venusaur.
   - **Evolução por Item/Pedra (`USE_ITEM`)**: Ex: Pikachu + Thunder Stone -> Raichu, Eevee + Fire Stone -> Flareon.
   - **Evolução por Troca (`TRADE`)**: Ex: Kadabra -> Alakazam, Haunter -> Gengar, Machoke -> Machamp, Graveler -> Golem.
   - **Evolução por Felicidade (`HAPPINESS`)**: Ex: Golbat -> Crobat, Chansey -> Blissey.

3. **Valores Individuais (IVs) e Pontos de Esforço (EVs)**:
   - Cada instância de pokémon armazena seus IVs (0 a 31) gerados proceduralmente e EVs (0 a 255).
   - Fórmulas Oficiais da Gen 3 calculadas por funções deterministicas:
     $$\text{HP Máximo} = \left\lfloor \frac{(2 \times \text{Base} + \text{IV} + \lfloor\text{EV}/4\rfloor) \times \text{Nível}}{100} \right\rfloor + \text{Nível} + 10$$
     $$\text{Stat} = \left\lfloor \frac{(2 \times \text{Base} + \text{IV} + \lfloor\text{EV}/4\rfloor) \times \text{Nível}}{100} \right\rfloor + 5$$

4. **Movimentos e Golpes de FireRed**:
   - 323 movimentos mapeados com Tipo, Categoria (`Physical`, `Special`, `Status`), Poder, Precisão e PP Máximo.
   - Categorização de dano físico/especial oficial da 3ª Geração (determinada pelo tipo elemental).
   - 1.499 relações de aprendizado de golpes por nível.

5. **Mapas de Kanto e Encontros Selvagens**:
   - 48 locais oficiais: Pallet Town, Viridian City, Viridian Forest, Mt. Moon, Rock Tunnel, Safari Zone, Power Plant, Seafoam Islands, Victory Road, Cerulean Cave, etc.
   - Tabela `encontro_mapa` com espécies, níveis mínimos/máximos e probabilidade percentual de aparição.

6. **Engine de Batalha por Turnos no Banco (Até 6 Pokémons por Treinador)**:
   - Tabela `batalha` com estado persistido, pokémon ativo de cada treinador e histórico de turnos em `log_batalha`.
   - **Esperando o Insert/Chamada do Usuário**: o jogador chama a procedure informando o ID da batalha e o movimento escolhido.
   - **Sistema de Prioridade de Golpes**: golpes com prioridade (+5 a -6, como Extreme Speed, Quick Attack, Mach Punch, Fake Out, Protect) agem primeiro independentemente da Speed. Empates de prioridade são desempados pelo stat de Velocidade.
   - Cálculo de Dano oficial Gen 3:
     $$\text{Dano} = \left\lfloor \left( \frac{\left(\frac{2 \times \text{Nível}}{5} + 2\right) \times \text{Poder} \times \frac{A}{D}}{50} + 2 \right) \times \text{STAB} \times \text{Fraqueza/Resistência} \times \text{Held Item Boost} \right\rfloor$$
   - Matriz completa de 17 tipos e 110 interações elementais (Super Efetivo 2x, Pouco Efetivo 0.5x, Imune 0x).
   - **Troca Voluntária em Combate (`sp_trocar_pokemon_batalha`)**: consome o turno do jogador e o oponente ataca o pokémon que acabou de entrar.
   - **Mecânica de Desmaio e Substituição Automática de até 6 Pokémons**: quando o pokémon atual tem seu HP zerado, o banco envia automaticamente o próximo pokémon apto do time.
   - Quando os 6 pokémons de um dos lados são derrotados, o banco finaliza a partida registrando o vencedor.
   - **Ganho de EXP Oficial**:
     $$\text{EXP} = \left\lfloor \frac{1.5 \times \text{Base EXP} \times \text{Nível Derrotado}}{7} \right\rfloor$$

7. **Held Items (Itens Segurados pelo Pokémon)**:
   - Tabela `held_item` com suporte a Leftovers (cura 1/16 HP por turno), Charcoal (+10% dano Fogo), Mystic Water (+10% dano Água), Miracle Seed (+10% dano Planta), Magnet (+10% dano Elétrico), Choice Band (+50% Atk Físico), Sitrus Berry e Focus Band.
   - **REGRA MANDATÓRIA:** Held items **SÓ PODEM SER EQUIPADOS OU REMOVIDOS FORA DE BATALHA** (`sp_equipar_held_item` e `sp_remover_held_item`). Se o treinador possuir uma batalha `EM_ANDAMENTO`, a procedure dispara um erro (SQLSTATE 45000).

8. **Itens de Batalha e Mochila do Treinador (`sp_usar_item_batalha`)**:
   - Tabelas `item_inventario` e `treinador_mochila` (Potions, Super Potions, Hyper Potions, Revives, Ethers).
   - **Mecânica oficial de turno:** Usar um item de cura ou revive durante o combate consome a ação do turno do jogador, decrementa 1 unidade da mochila e o oponente retalia atacando em seguida!

9. **Centro Pokémon (Enfermeira Joy) & Reaprendizado de Golpes**:
   - `sp_enfermeira_joy`: Cura 100% dos HPs, revive pokémons caídos e restaura todos os PPs do time. Bloqueada caso o treinador esteja em batalha ativa.
   - `sp_trocar_movimento_pokemon`: Permite reensinar/substituir movimentos ativos respeitando a lista de golpes válidos para a espécie e nível da instância.

---

## 🛠️ Procedimentos e Views Disponíveis

### Stored Procedures de Batalha e Gestão
- `CALL sp_iniciar_batalha(p_treinador_jogador_id, p_treinador_oponente_id);`
  - Inicia uma batalha 6v6 entre dois treinadores (valida que nenhum deles já está em batalha ativa).
- `CALL sp_executar_turno_batalha(p_batalha_id, p_movimento_jogador_id);`
  - Executa o turno calculando prioridade, velocidade, dano, retaliação, held items e substituições.
- `CALL sp_trocar_pokemon_batalha(p_batalha_id, p_novo_pokemon_instancia_id);`
  - Troca voluntariamente de pokémon durante a batalha consumindo a ação do turno.
- `CALL sp_usar_item_batalha(p_batalha_id, p_item_id, p_pokemon_alvo_id);`
  - Usa um item da mochila (Super Potion, Revive, etc.) em combate, consumindo o item e sofrendo retaliação.
- `CALL sp_equipar_held_item(p_pokemon_instancia_id, p_held_item_id);`
  - Equipa um item segurado no pokémon (apenas fora de batalha).
- `CALL sp_remover_held_item(p_pokemon_instancia_id);`
  - Remove o item segurado do pokémon (apenas fora de batalha).
- `CALL sp_enfermeira_joy(p_treinador_id);`
  - Cura total, revive e restauração de PPs para o time (apenas fora de batalha).
- `CALL sp_trocar_movimento_pokemon(p_pokemon_instancia_id, p_movimento_antigo_id, p_movimento_novo_id);`
  - Reensina/substitui um golpe ativo por outro compatível com o nível da espécie.
- `CALL sp_subir_nivel(p_instancia_id);`
  - Sobe o nível de um pokémon, recalcula stats com IV/EV, verifica evolução e exibe novos golpes aprendidos.
- `CALL sp_gerar_encontro_selvagem(p_mapa_id);`
  - Sorteia um pokémon selvagem de acordo com o mapa e suas chances.
- `CALL sp_criar_pokemon_treinador(treinador_id, especie_id, nivel, apelido, posicao_time);`
  - Cria um pokémon com IVs únicos e preenche automaticamente até 4 golpes adequados ao nível.

### Views para o Workbench
- `SELECT * FROM vw_pokedex_kanto;`
- `SELECT * FROM vw_time_treinadores;`
- `SELECT * FROM vw_golpes_pokemon_ativos;`
- `SELECT * FROM log_batalha WHERE batalha_id = 4 ORDER BY id DESC;`

---

## 🚀 Histórico de Atualizações Recentes (Novas Mecânicas Implementadas)

### 1. 🛡️ Held Items (Itens Segurados pelo Pokémon)
* **Tabela `held_item`**: Cadastrados itens estratégicos oficiais de Gen 3:
  * **Leftovers (ID 1)**: Restaura $\lfloor HP_{max}/16 \rfloor$ de vida ao término de cada turno em que o pokémon sobrevive.
  * **Charcoal (ID 3)**, **Mystic Water (ID 4)**, **Miracle Seed (ID 5)**, **Magnet (ID 6)**: Aumentam em 10% (1.10x) o dano de golpes do respectivo tipo elemental.
  * **Choice Band (ID 2)**: Amplifica em 50% (1.50x) o Ataque Físico.
  * **Sitrus Berry (ID 7)** e **Focus Band (ID 8)**.
* **REGRA MANDATÓRIA (Fora de Combate):**
  * `sp_equipar_held_item(instancia_id, item_id)` e `sp_remover_held_item(instancia_id)`.
  * **Validação de Segurança:** Ambas as procedures verificam ativamente se o treinador possui batalha com status `'EM_ANDAMENTO'`. Caso positivo, disparam `SQLSTATE '45000'` impedindo a alteração durante o combate.

### 2. 🎒 Mochila e Itens de Batalha (`sp_usar_item_batalha`)
* **Tabelas `item_inventario` e `treinador_mochila`**: Itens consumíveis (Potions, Super Potions, Hyper Potions, Revives, Ethers).
* **Mecânica de Turno Oficial:** Usar um item consome a ação do turno do jogador, decrementa 1 unidade da mochila e faz o adversário retaliar imediatamente atacando o pokémon em campo!

### 3. 🏥 Centro Pokémon (Enfermeira Joy)
* `sp_enfermeira_joy(treinador_id)`: Cura 100% dos HPs de todos os pokémons do time, revive os desmaiados e restaura todos os PPs ao máximo.
* **Bloqueio de Regra de Negócio:** A Enfermeira Joy não atende se o treinador estiver no meio de uma batalha ativa.

### 4. 🔄 Trocador e Relembrador de Movimentos
* `sp_trocar_movimento_pokemon(instancia_id, golpe_antigo_id, novo_golpe_id)`:
  * Valida se o novo movimento realmente pode ser aprendido por aquela espécie.
  * Valida se o nível atual da instância do Pokémon é igual ou superior ao nível exigido para aprender o golpe.
  * Impede golpes duplicados nos 4 slots ativos.

### 5. ⚡ Sistema de Prioridade de Golpes
* A tabela `movimento` conta com a coluna `prioridade` (-6 a +5).
* Golpes como Extreme Speed (+2), Quick Attack (+1), Mach Punch (+1), Fake Out (+3) e Protect (+4) atacam primeiro independentemente da Speed.
* Empates na prioridade são decididos pelo stat de Velocidade dos Pokémons.

### 6. 🔁 Troca Voluntária em Combate & Bloqueio de Batalhas Simultâneas
* `sp_trocar_pokemon_batalha`: O jogador troca de Pokémon voluntariamente consumindo o turno (o adversário ataca o Pokémon substituto no mesmo turno).
* `sp_iniciar_batalha`: Bloqueia o início de combate se o jogador ou o oponente já estiverem com uma batalha em andamento.

---

## 🛠️ Guia de Demonstração Rápida (MySQL Workbench)

Abra o arquivo [`como_batalhar.sql`](como_batalhar.sql) no MySQL Workbench ou execute os passos abaixo:

```sql
USE pokemon_firered;

-- 1. Curar todo o time do Red antes de batalhar
CALL sp_enfermeira_joy(1);

-- 2. Equipar Leftovers (ID 1) no Charizard do Red (Instância ID 16) [FORA DE BATALHA]
CALL sp_equipar_held_item(16, 1);

-- 3. Iniciar Batalha 6v6 entre Red (ID 1) e Blue (ID 2)
CALL sp_iniciar_batalha(1, 2);

-- 4. Testar o bloqueio de Held Item durante a batalha (deve disparar erro SQLSTATE 45000):
-- CALL sp_equipar_held_item(16, 2); 

-- 5. Turno 1: Charizard ataca com Flamethrower (ID 53)
CALL sp_executar_turno_batalha(4, 53);

-- 6. Turno 2: Usar Super Potion (Item ID 2) da Mochila no Charizard (gasta turno e oponente revida)
CALL sp_usar_item_batalha(4, 2, 16);

-- 7. Turno 3: Trocar voluntariamente para o Lapras (ID 18)
CALL sp_trocar_pokemon_batalha(4, 18);

-- 8. Consultar o log completo dos eventos da batalha
SELECT numero_turno, ordem_acao, mensagem, dano_causado, hp_restante_defensor 
FROM log_batalha 
WHERE batalha_id = 4 
ORDER BY id DESC;
```

---

## 📥 Como Restaurar o Banco pelo Dump Oficial

Para recriar todo o banco com todos os 151 Pokémons, 323 golpes, rotas, procedures e dados de teste em qualquer computador com MySQL 8.0:

### Via Linha de Comando (CMD / PowerShell):
```bash
mysql -u root -p --default-character-set=utf8mb4 < dump_pokemon_firered.sql
```

### Via MySQL Workbench:
1. Acesse o menu **Server** > **Data Import**.
2. Selecione a opção **Import from Self-Contained File**.
3. Aponte para o arquivo `dump_pokemon_firered.sql`.
4. Clique em **Start Import**.

---

## 📁 Estrutura dos Arquivos do Projeto

| Arquivo | Descrição |
| :--- | :--- |
| **`dump_pokemon_firered.sql`** | **Arquivo principal para entrega acadêmica** (gerado com `mysqldump`, contendo 149 KB com todas as tabelas, dados, views e procedures). |
| `01_schema_ddl.sql` | DDL completo com constraints, held items e mochila de inventário. |
| `02_tabela_tipos_eficacia.sql` | Matriz de eficácia dos 17 tipos da 3ª Geração. |
| `03_dados_especies_golpes_mapas.sql` | Carga dos 151 Pokémons, 323 golpes, evoluções e 48 mapas de Kanto. |
| `04_procedures_batalha_e_mecanicas.sql` | Engine de combate, troca, prioridade, held items, mochila, enfermeira Joy e trocador de golpes. |
| `05_dados_teste_e_batalha.sql` | Times canônicos do Red e Blue e views de consulta. |
| `06_held_items_e_itens_batalha.sql` | Carga modular de held items e itens de inventário da mochila. |
| `como_batalhar.sql` | Roteiro interativo passo a passo para testar batalhas, trocas, held items, cura e golpes diretamente no Workbench. |
| `README.md` | Documentação técnica completa da arquitetura, regras de negócio e guia de execução. |


