// ודא ששם הקובץ מדויק: middleware/auth.js

exports.ensureLoggedIn = (req, res, next) => {
  if (req.session && req.session.userId) return next();
  res.redirect('/login');
};

exports.ensureDoctor = (req, res, next) => {
  if (req.session.userRole === 'doctor') return next();
  res.status(403).send('אין לך הרשאה לגשת לכאן.');
};

exports.ensurePatient = (req, res, next) => {
  if (req.session.userRole === 'patient') return next();
  res.status(403).send('אין לך הרשאה לגשת לכאן.');
};
