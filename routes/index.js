// FILE: routes/index.js
const express      = require('express');
const path         = require('path');
const fs           = require('fs');
const multer       = require('multer');
const mainController       = require('../controllers/mainController');
const scanController       = require('../controllers/scanController');
const medicationController = require('../controllers/medicationController');
const { ensureLoggedIn, ensureDoctor, ensurePatient } = require('../middleware/auth');

const router = express.Router();

// — Multer setup for uploads —
const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// — New: edit chronic diseases —
router.post(
  '/profile/edit-chronic',
  ensureLoggedIn,
  ensurePatient,
  mainController.updateChronic
);

// — Home —
router.get('/', ensureLoggedIn, mainController.showHome);

// — Doctor only: manage patients —
router.get('/patients',       ensureLoggedIn, ensureDoctor, mainController.listPatients);
router.get('/patients/new',   ensureLoggedIn, ensureDoctor, mainController.showPatientForm);
router.post(
  '/patients',
  ensureLoggedIn,
  ensureDoctor,
  upload.single('photo'),
  mainController.createPatient
);

// — Patient: complete profile —
router.get(
  '/patients/profile',
  ensureLoggedIn,
  ensurePatient,
  mainController.showPatientForm
);
router.post(
  '/patients/profile',
  ensureLoggedIn,
  ensurePatient,
  upload.single('photo'),
  mainController.completePatientProfile
);

// — Patient: scan food —
router.get(
  '/scan',
  ensureLoggedIn,
  ensurePatient,
  scanController.getScanPage
);
router.post(
  '/scan',
  ensureLoggedIn,
  ensurePatient,
  upload.single('image'),
  scanController.postScan
);
router.post(
  '/scan/confirm',
  ensureLoggedIn,           // חשוב גם כאן לוודא שהמטופל מחובר
  ensurePatient,
  scanController.confirmScan
);

// — Patient: medications form —
router.get(
  '/medications',
  ensureLoggedIn,
  ensurePatient,
  medicationController.getMedicationsForm
);
router.post(
  '/medications',
  ensureLoggedIn,
  ensurePatient,
  medicationController.postMedicationsForm
);

module.exports = router;
