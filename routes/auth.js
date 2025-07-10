// FILE: routes/auth.js

const express        = require('express');
const router         = express.Router();
const path           = require('path');
const fs             = require('fs');
const multer         = require('multer');
const authController = require('../controllers/authController');

// Multer לתמונת פרופיל
const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// דפי Auth
router.get ('/login',    authController.showLogin);
router.post('/login',    authController.login);
router.post('/logout',   authController.logout);

// הרשמה מלאה של מטופל
router.get ('/register', authController.showRegister);
router.post('/register', upload.single('photo'), authController.register);

module.exports = router;
