const requireTeamAccess = (req, res, next) => {
  if (req.user.role === 'admin' || req.user.canManageUzbekTeam) return next();
  return res.status(403).json({ error: 'Accès refusé' });
};

module.exports = requireTeamAccess;
