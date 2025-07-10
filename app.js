// FILE: app.js

require('dotenv').config();
require('./config/db');             // ← חיבור למסד הנתונים MongoDB

const express      = require('express');
const path         = require('path');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const multer       = require('multer');

const app = express();

// ---- Session & Cookies ----
app.use(cookieParser());
app.use(session({
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false
}));

// session middleware
app.use((req, res, next) => {
  res.locals.userName = req.session.userName;
  res.locals.userRole = req.session.userRole;
  next();
});

// ---- View Engine & Static ----
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- Authentication Routes (login/register/logout) ----
const authRouter = require('./routes/auth');
app.use(authRouter);

// ---- Authorization Middleware ----
const {
  ensureLoggedIn,
  ensureDoctor,
  ensurePatient
} = require('./middleware/auth');
// רופא יכול לראות רק /patients, מטופל רק /scan
console.log('authRouter =', authRouter);
console.log('ensureLoggedIn =', ensureLoggedIn);
console.log('ensureDoctor   =', ensureDoctor);
console.log('ensurePatient  =', ensurePatient);

app.use('/patients', ensureLoggedIn, ensureDoctor);
app.use('/scan',    ensureLoggedIn, ensurePatient);

// ---- Main Application Routes ----
const indexRouter = require('./routes/index');

app.use('/', indexRouter);

// ---- Multer Error Handler ----
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    console.error('🔥 MulterError:', err.message);
    // שגיאה ב־/scan
    if (req.path === '/scan') {
      return res.status(400).render('scan', {
        title:       'סריקת מזון',
        error:       err.message,
        imageUrl:    null,
        dishName:    null,
        ingredients: null
      });
    }
    // שגיאה ב־/patients
    if (req.path === '/patients') {
      return res.status(400).render('patient-form', {
        title:        'הוספת מטופל',
        errorMessage: err.message
      });
    }
  }
  next(err);
});

// ---- Start Server ----
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🔊 Server listening on http://localhost:${PORT}`));
