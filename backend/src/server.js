import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import { testConnection } from './config/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Logger simples
app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Rotas da API
app.use('/api', apiRoutes);

// Rota de Healthcheck
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    sistema: 'Pokémon FireRed Battle Simulator Backend',
    timestamp: new Date().toISOString()
  });
});

// Inicialização
async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, () => {
      console.log(`🚀 Servidor backend rodando com sucesso em: http://localhost:${PORT}`);
      console.log(`📡 Endpoints disponíveis sob o prefixo /api`);
    });
  } catch (error) {
    console.error('Falha crítica ao iniciar o servidor:', error);
    process.exit(1);
  }
}

startServer();

export default app;
