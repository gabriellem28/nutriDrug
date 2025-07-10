const express = require('express');
const path    = require('path');
const fs      = require('fs');
const multer  = require('multer');

const mainController = require('../controllers/mainController');
const scanController = require('../controllers/scanController');
const { ensureLoggedIn, ensureDoctor, ensurePatient } = require('../middleware/auth');
const medicationController = require('../controllers/medicationController'); 
const router = express.Router();

// תיקיית העלאות ושאר המולטר
const uploadDir = path.join(__dirname, '..', 'public', 'images', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
const upload = multer({ dest: uploadDir });

// דף הבית
router.get('/', ensureLoggedIn, mainController.showHome);

// רופא: ניהול מטופלים
router.get('/patients',     ensureLoggedIn, ensureDoctor, mainController.listPatients);
router.get('/patients/new', ensureLoggedIn, ensureDoctor, mainController.showPatientForm);
router.post('/patients',    ensureLoggedIn, ensureDoctor, upload.single('photo'), mainController.createPatient);

// מטופל: השלמת פרופיל
router.get( '/patients/profile', ensureLoggedIn, ensurePatient, mainController.showPatientForm);
router.post('/patients/profile', ensureLoggedIn, ensurePatient, upload.single('photo'), mainController.completePatientProfile);

// מטופל: סריקת מזון
router.get( '/scan', ensureLoggedIn, ensurePatient, scanController.getScanPage);
router.post('/scan', ensureLoggedIn, ensurePatient, upload.single('image'), scanController.postScan);
router.post('/scan/confirm', scanController.confirmScan);

// ---  נתיבי שאלון תרופות (מטופל בלבד) ---
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
