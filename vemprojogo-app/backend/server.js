const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Configuração do PostgreSQL (Supabase)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  },
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20,
  options: '-c search_path=public'
});

// Configuração do Multer para upload de imagens
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Apenas imagens são permitidas!'));
    }
  }
});

// Testar conexão com o banco
const initDatabase = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conectado ao Supabase:', result.rows[0].now);
  } catch (error) {
    console.error('❌ Erro ao conectar ao Supabase:', error.message);
    console.error('Verifique suas credenciais no arquivo .env');
  }
};

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET || 'seu-secret-key', (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// ========== ROTAS DE AUTENTICAÇÃO ==========

// Registro
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, nome, arena, cidade } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      'INSERT INTO users (email, password, nome, arena, cidade) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, nome, arena, cidade',
      [email, hashedPassword, nome, arena, cidade]
    );

    const token = jwt.sign(
      { id: result.rows[0].id, email: result.rows[0].email },
      process.env.JWT_SECRET || 'seu-secret-key',
      { expiresIn: '7d' }
    );

    res.json({ user: result.rows[0], token });
  } catch (error) {
    console.error('Erro no registro:', error);
    if (error.constraint === 'users_email_key') {
      return res.status(400).json({ error: 'Email já cadastrado' });
    }
    res.status(500).json({ error: 'Erro ao registrar usuário' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const user = result.rows[0];
    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET || 'seu-secret-key',
      { expiresIn: '7d' }
    );

    const { password: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// Obter perfil do usuário
app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, nome, foto_url, arena, cidade FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao buscar perfil:', error);
    res.status(500).json({ error: 'Erro ao buscar perfil' });
  }
});

// Atualizar perfil
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { nome, arena, cidade } = req.body;
    
    const result = await pool.query(
      'UPDATE users SET nome = $1, arena = $2, cidade = $3 WHERE id = $4 RETURNING id, email, nome, foto_url, arena, cidade',
      [nome, arena, cidade, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil' });
  }
});

// Upload de foto (armazenamento local)
app.post('/api/auth/upload-photo', authenticateToken, upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Nenhuma foto foi enviada' });
    }

    const photoUrl = `/uploads/${req.file.filename}`;
    
    await pool.query('UPDATE users SET foto_url = $1 WHERE id = $2', [photoUrl, req.user.id]);
    
    res.json({ foto_url: photoUrl });
  } catch (error) {
    console.error('Erro ao fazer upload:', error);
    res.status(500).json({ error: 'Erro ao fazer upload da foto' });
  }
});

// ========== ROTAS DE AULAS ==========

// Listar todas as aulas
app.get('/api/aulas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        a.*,
        COUNT(p.id) as participantes,
        u.nome as criador_nome
      FROM aulas a
      LEFT JOIN presencas p ON a.id = p.aula_id
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.data >= CURRENT_DATE
      GROUP BY a.id, u.nome
      ORDER BY a.data, a.horario
    `);
    res.json(result.rows);
  } catch (error) {
    console.error('Erro ao listar aulas:', error);
    res.status(500).json({ error: 'Erro ao listar aulas' });
  }
});

// Criar aula
app.post('/api/aulas', authenticateToken, async (req, res) => {
  try {
    const { data, horario, local } = req.body;
    const result = await pool.query(
      'INSERT INTO aulas (data, horario, local, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
      [data, horario, local, req.user.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar aula:', error);
    res.status(500).json({ error: 'Erro ao criar aula' });
  }
});

// Obter uma aula específica
app.get('/api/aulas/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const aulaResult = await pool.query('SELECT * FROM aulas WHERE id = $1', [id]);
    
    if (aulaResult.rows.length === 0) {
      return res.status(404).json({ error: 'Aula não encontrada' });
    }

    const participantesResult = await pool.query(`
      SELECT u.id, u.nome, u.foto_url
      FROM presencas p
      JOIN users u ON p.user_id = u.id
      WHERE p.aula_id = $1
    `, [id]);

    res.json({
      ...aulaResult.rows[0],
      participantes: participantesResult.rows
    });
  } catch (error) {
    console.error('Erro ao buscar aula:', error);
    res.status(500).json({ error: 'Erro ao buscar aula' });
  }
});

// Deletar aula
app.delete('/api/aulas/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM aulas WHERE id = $1 AND created_by = $2', [id, req.user.id]);
    res.json({ message: 'Aula deletada com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar aula:', error);
    res.status(500).json({ error: 'Erro ao deletar aula' });
  }
});

// ========== ROTAS DE PRESENÇAS ==========

// Confirmar presença
app.post('/api/presencas', authenticateToken, async (req, res) => {
  try {
    const { aula_id } = req.body;
    
    const existente = await pool.query(
      'SELECT * FROM presencas WHERE aula_id = $1 AND user_id = $2',
      [aula_id, req.user.id]
    );

    if (existente.rows.length > 0) {
      return res.status(400).json({ error: 'Presença já confirmada' });
    }

    const result = await pool.query(
      'INSERT INTO presencas (aula_id, user_id) VALUES ($1, $2) RETURNING *',
      [aula_id, req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao confirmar presença:', error);
    res.status(500).json({ error: 'Erro ao confirmar presença' });
  }
});

// Cancelar presença
app.delete('/api/presencas/:aula_id', authenticateToken, async (req, res) => {
  try {
    const { aula_id } = req.params;
    await pool.query('DELETE FROM presencas WHERE aula_id = $1 AND user_id = $2', [aula_id, req.user.id]);
    res.json({ message: 'Presença cancelada' });
  } catch (error) {
    console.error('Erro ao cancelar presença:', error);
    res.status(500).json({ error: 'Erro ao cancelar presença' });
  }
});

// Verificar se usuário está confirmado
app.get('/api/presencas/check/:aula_id', authenticateToken, async (req, res) => {
  try {
    const { aula_id } = req.params;
    const result = await pool.query(
      'SELECT * FROM presencas WHERE aula_id = $1 AND user_id = $2',
      [aula_id, req.user.id]
    );
    res.json({ confirmado: result.rows.length > 0 });
  } catch (error) {
    console.error('Erro ao verificar presença:', error);
    res.status(500).json({ error: 'Erro ao verificar presença' });
  }
});

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Backend rodando!' });
});

// Iniciar servidor
app.listen(PORT, async () => {
  await initDatabase();
  console.log(`Servidor rodando na porta ${PORT}`);
});