require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const session = require('express-session');

const authRoutes      = require('./routes/auth');
const productosRoutes = require('./routes/productos');
const clientesRoutes  = require('./routes/clientes');
const ventasRoutes    = require('./routes/ventas');
const reportesRoutes  = require('./routes/reportes');
const catalogosRoutes = require('./routes/catalogos');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'alientronic_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 1000 * 60 * 60 * 8 } // 8 horas
}));

// Rutas
app.use('/api/auth',      authRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes',  clientesRoutes);
app.use('/api/ventas',    ventasRoutes);
app.use('/api/reportes',  reportesRoutes);
app.use('/api/catalogos', catalogosRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ ok: true, time: new Date() }));

app.listen(PORT, () => {
  console.log(`🚀 Alientronic backend corriendo en puerto ${PORT}`);
});
