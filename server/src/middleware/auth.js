const jwt = require('jsonwebtoken');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.error('Erreur vérification token:', err.message);
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    console.log('✅ Utilisateur authentifié:', req.user);
    next();
  });
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, telephone: user.telephone, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = { authenticateToken, generateToken };