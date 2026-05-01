function requireAuth(req, res, next) {
  if (req.session && req.session.usuario) {
    return next();
  }
  res.status(401).json({ error: 'No autorizado. Por favor inicia sesión.' });
}

module.exports = { requireAuth };
