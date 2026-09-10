import { Router } from 'express';
import {
  listarPokedex,
  listarMovimentosEspecie,
  listarHeldItems,
  listarTreinadores
} from '../controllers/pokedexController.js';
import {
  obterTimeTreinador,
  criarPokemon,
  removerPokemon,
  equiparHeldItem,
  removerHeldItem,
  trocarGolpe,
  centroPokemon,
  obterMochila,
  atualizarMochila
} from '../controllers/teambuilderController.js';
import {
  iniciarBatalha,
  executarTurno,
  trocarPokemon,
  usarItem,
  obterStatusBatalha,
  obterLogsBatalha,
  cancelarBatalha
} from '../controllers/batalhaController.js';

const router = Router();

// ==========================================
// 1. ROTAS DE POKÉDEX, GOLPES E ITENS
// ==========================================
router.get('/pokedex', listarPokedex);
router.get('/movimentos/:especieId', listarMovimentosEspecie);
router.get('/held-items', listarHeldItems);
router.get('/treinadores', listarTreinadores);

// ==========================================
// 2. ROTAS DO TEAMBUILDER E MOCHILA
// ==========================================
router.get('/treinador/:id/time', obterTimeTreinador);
router.get('/treinador/:id/mochila', obterMochila);
router.post('/treinador/:id/mochila/atualizar', atualizarMochila);

router.post('/pokemon/criar', criarPokemon);
router.post('/pokemon/remover', removerPokemon);
router.post('/pokemon/held-item', equiparHeldItem);
router.post('/pokemon/remover-held-item', removerHeldItem);
router.post('/pokemon/trocar-golpe', trocarGolpe);
router.post('/centro-pokemon', centroPokemon);

// ==========================================
// 3. ROTAS DE BATALHA
// ==========================================
router.post('/batalha/iniciar', iniciarBatalha);
router.post('/batalha/turno', executarTurno);
router.post('/batalha/trocar', trocarPokemon);
router.post('/batalha/usar-item', usarItem);
router.get('/batalha/:id/status', obterStatusBatalha);
router.get('/batalha/:id/logs', obterLogsBatalha);
router.post('/batalha/cancelar', cancelarBatalha);

export default router;
