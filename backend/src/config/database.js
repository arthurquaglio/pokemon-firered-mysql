import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'bronco48',
  database: process.env.DB_NAME || 'pokemon_firered',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true
});

// Test connection
export async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexão com MySQL (pokemon_firered) estabelecida com sucesso!');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao MySQL:', error.message);
    throw error;
  }
}

export default pool;
