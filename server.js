const express = require("express");
const sqlite3 = require("sqlite3").verbose();

const app = express();
const port = 3000;

// Middleware para receber JSON no corpo das requisições
app.use(express.json());

// Cria ou abre o banco de dados local SQLite
const db = new sqlite3.Database("./database.db", (err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err.message);
  } else {
    console.log("Conectado ao banco de dados SQLite.");
  }
});

// Cria a tabela se não existir
db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
  )
`);

// === CRUD ===

// [C] CREATE - Adicionar usuário
app.post("/usuarios", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Username e password são obrigatórios." });
  }

  const query = "INSERT INTO usuarios (username, password) VALUES (?, ?)";
  db.run(query, [username, password], function (err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.status(201).json({ id: this.lastID, username });
  });
});

// [R] READ - Listar todos os usuários
app.get("/usuarios", (req, res) => {
  db.all("SELECT * FROM usuarios", [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// [R] READ - Buscar usuário por ID
app.get("/usuarios/:id", (req, res) => {
  const { id } = req.params;
  db.get("SELECT id, username FROM usuarios WHERE id = ?", [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    res.json(row);
  });
});

// [U] UPDATE - Atualizar usuário
app.put("/usuarios/:id", (req, res) => {
  const { id } = req.params;
  const { username, password } = req.body;

  db.run(
    "UPDATE usuarios SET username = ?, password = ? WHERE id = ?",
    [username, password, id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: "Usuário não encontrado." });
      }
      res.json({ message: "Usuário atualizado com sucesso." });
    }
  );
});

// [D] DELETE - Deletar usuário
app.delete("/usuarios/:id", (req, res) => {
  const { id } = req.params;

  db.run("DELETE FROM usuarios WHERE id = ?", [id], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: "Usuário não encontrado." });
    }
    res.json({ message: "Usuário deletado com sucesso." });
  });
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});
