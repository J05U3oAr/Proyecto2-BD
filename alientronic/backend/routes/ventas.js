const express = require('express');
const pool    = require('../db');
const { requireAuth } = require('../middleware/auth');
const router  = express.Router();

// GET /api/ventas - usa la VIEW
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT id_venta, fecha, cliente, empleado,
             SUM(subtotal) AS total
      FROM vista_ventas_detalle
      GROUP BY id_venta, fecha, cliente, empleado
      ORDER BY fecha DESC, id_venta DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener ventas.' });
  }
});

// GET /api/ventas/:id - detalle completo
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM vista_ventas_detalle WHERE id_venta=$1',
      [req.params.id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ error: 'Venta no encontrada.' });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener detalle de venta.' });
  }
});

// POST /api/ventas - TRANSACCIÓN EXPLÍCITA con ROLLBACK
router.post('/', requireAuth, async (req, res) => {
  const { id_cliente, id_empleado, fecha, items } = req.body;

  if (!id_cliente || !id_empleado || !items || items.length === 0)
    return res.status(400).json({ error: 'Cliente, empleado e items son requeridos.' });

  for (const item of items) {
    if (!item.id_producto || !item.cantidad || item.cantidad <= 0)
      return res.status(400).json({ error: 'Cada item debe tener producto y cantidad válida.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insertar venta
    const ventaResult = await client.query(
      `INSERT INTO venta (fecha, id_cliente, id_empleado)
       VALUES ($1, $2, $3) RETURNING id_venta`,
      [fecha || new Date().toISOString().split('T')[0], id_cliente, id_empleado]
    );
    const id_venta = ventaResult.rows[0].id_venta;

    for (const item of items) {
      // Verificar stock disponible
      const stockResult = await client.query(
        'SELECT stock, precio FROM producto WHERE id_producto=$1 FOR UPDATE',
        [item.id_producto]
      );
      if (stockResult.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: `Producto ${item.id_producto} no encontrado.` });
      }
      const { stock, precio } = stockResult.rows[0];
      if (stock < item.cantidad) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: `Stock insuficiente para el producto ${item.id_producto}. Disponible: ${stock}, solicitado: ${item.cantidad}.`
        });
      }

      // Insertar detalle
      const precio_unitario = item.precio_unitario || precio;
      await client.query(
        `INSERT INTO detalle_venta (id_venta, id_producto, cantidad, precio_unitario)
         VALUES ($1,$2,$3,$4)`,
        [id_venta, item.id_producto, item.cantidad, precio_unitario]
      );

      // Descontar stock
      await client.query(
        'UPDATE producto SET stock = stock - $1 WHERE id_producto = $2',
        [item.cantidad, item.id_producto]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ ok: true, id_venta });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error en transacción de venta:', err);
    res.status(500).json({ error: 'Error al registrar la venta. Transacción revertida.' });
  } finally {
    client.release();
  }
});

module.exports = router;
