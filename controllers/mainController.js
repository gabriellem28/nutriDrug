// FILE: controllers/mainController.js

const vision = require('@google-cloud/vision');
const path   = require('path');
const Patient = require('../models/patient');

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, '..', 'config', 'google-service-account.json')
});

// 1. Show home page (doctor or patient)
exports.showHome = async (req, res, next) => {
  try {
    if (req.session.userRole === 'doctor') {
      // Redirect doctors to the patients list
      return res.redirect('/patients');
    }

    // Patient flow:
    const patient = await Patient.findById(req.session.userId).lean();
    if (!patient) return res.redirect('/logout');

    // Today's date in Hebrew
    const today = new Date().toLocaleDateString('he-IL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // Last 5 scans with interactions
    const recentScans = (patient.scans || [])
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 5)
      .map(scan => ({
        date: scan.date,
        dishName: scan.dishName,
        interactions: scan.interactions || []
      }));

    // Active medications and chronic diseases
    const medications = patient.medications || [];
    const chronicDiseases = Array.isArray(patient.chronicDiseases)
      ? patient.chronicDiseases
      : [];

    return res.render('patient-home', {
      title: 'בית',
      name: patient.name,
      today,
      recentScans,
      medications,
      chronicDiseases
    });
  } catch (err) {
    next(err);
  }
};

// 2. Update chronic diseases via modal form
exports.updateChronic = async (req, res, next) => {
  try {
    const chronicInput = req.body.chronicDiseases || '';
    const chronicArray = chronicInput
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    await Patient.findByIdAndUpdate(req.session.userId, { chronicDiseases: chronicArray });
    return res.redirect('/');
  } catch (err) {
    next(err);
  }
};

// 3. Show form for adding patient (doctor) or completing profile (patient)
exports.showPatientForm = async (req, res) => {
  try {
    let title = 'הוספת מטופל';
    let data  = {};
    if (req.session.userRole === 'patient') {
      title = 'השלמת פרופיל';
      data  = await Patient.findById(req.session.userId).lean() || {};
    }
    return res.render('patient-form', {
      title,
      errorMessage: null,
      patient: data
    });
  } catch (err) {
    return res.render('patient-form', {
      title: 'הוספת מטופל',
      errorMessage: 'שגיאה בטעינת פרטים',
      patient: {}
    });
  }
};

// 4. Create patient (doctor)
exports.createPatient = async (req, res, next) => {
  try {
    // TODO: implement createPatient logic (e.g., parse req.body, handle photo upload)
    const { name, idNumber } = req.body;
    // Add other fields as needed
    const newPatient = new Patient({ name, idNumber /*, ... */ });
    await newPatient.save();
    return res.redirect('/patients');
  } catch (err) {
    next(err);
  }
};

// 5. Complete profile (patient)
exports.completePatientProfile = async (req, res) => {
  try {
    // TODO: parse birthDate, calculate age, and update other fields
    // await Patient.findByIdAndUpdate(req.session.userId, { ... });
    return res.redirect('/scan');
  } catch (err) {
    return res.render('patient-form', {
      title: 'השלמת פרופיל',
      errorMessage: err.message,
      patient: req.body
    });
  }
};

// 6. List patients (doctor)
exports.listPatients = async (req, res, next) => {
  try {
    const patients = await Patient.find().lean();
    return res.render('doctor-home', {
      title: 'רשימת מטופלים',
      name: req.session.userName,
      patients
    });
  } catch (err) {
    next(err);
  }
};
