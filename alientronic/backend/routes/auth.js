const express = require('express');
const bcrypt  = require('bcrypt');
const pool    = require('../db');
const router  = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });

  try {
    const result = await pool.query(
      `SELECT u.*, e.nombre AS nombre_empleado, e.puesto
       FROM usuario u
       JOIN empleado e ON u.id_empleado = e.id_empleado
       WHERE u.username = $1`,
      [username]
    );
    if (result.rows.length === 0)
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });

    req.session.usuario = {
      id:      user.id_usuario,
      username: user.username,
      nombre:  user.nombre_empleado,
      puesto:  user.puesto
    };
    res.json({ ok: true, usuario: req.session.usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.json({ ok: true });
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  if (req.session.usuario)
    return res.json({ ok: true, usuario: req.session.usuario });
  res.status(401).json({ ok: false });
});

module.exports = router;
