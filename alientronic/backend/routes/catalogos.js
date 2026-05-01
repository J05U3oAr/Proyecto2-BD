const express = require('express');
const pool    = require('../db');
const { requireAuth } = require('../middleware/auth');
const router  = express.Router();

router.get('/categorias', requireAuth, async (req, res) => {
  const r = await pool.query('SELECT * FROM categoria ORDER BY nombre');
  res.json(r.rows);
});

router.get('/proveedores', requireAuth, async (req, res) => {
  const r = await pool.query('SELECT * FROM proveedor ORDER BY nombre');
  res.json(r.rows);
});

router.get('/empleados', requireAuth, async (req, res) => {
  const r = await pool.query('SELECT * FROM empleado ORDER BY nombre');
  res.json(r.rows);
});

module.exports = router;
