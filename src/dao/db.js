import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Cria a conexão usando as variáveis de ambiente
const sequelize = new Sequelize(
  process.env.DB_NAME,    // Nome do Banco
  process.env.DB_USER,    // Usuário
  process.env.DB_PASS,    // Senha
  {
    host: process.env.DB_HOST, // Host (no docker será 'mysqldb', na AWS será o endpoint RDS)
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false, 
    timezone: '-03:00', 
  }
);

// Função auxiliar para esperar (sleep)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const connectToDatabase = async () => {
  let retries = 3; // Tenta 3 vezes antes de desistir
  
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('Conexão com MySQL estabelecida com sucesso!');
      
      // Sincroniza tabelas
      await sequelize.sync({ alter: true }); 
      console.log('Tabelas sincronizadas.');
      return; // Sucesso, sai da função
      
    } catch (error) {
      console.error(`Falha na conexão (Tentativas restantes: ${retries})...`);
      console.error('Erro:', error.message);
      
      retries -= 1;
      
      if (retries === 0) {
        console.error('Não foi possível conectar ao banco após várias tentativas.');
        process.exit(1); // Desiste apenas no final
      }
      
      // Espera 5 segundos antes de tentar de novo
      console.log('Tentando novamente em 5 segundos...');
      await wait(5000);
    }
  }
};

export { sequelize }; 
export default connectToDatabase;