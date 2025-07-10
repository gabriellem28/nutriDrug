const vision = require('@google-cloud/vision');
const path   = require('path');
const Patient = require('../models/patient');

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, '..', 'config', 'google-service-account.json')
});

// 1. דף הבית (doctor → patients, patient → patient-home)
exports.showHome = async (req, res, next) => {
  try {
      if (req.session.userRole === 'doctor') {
      // עבור רופא, שלוף את כל המטופלים והצג אותם בתבנית doctor-home
      const patients = await Patient.find().lean();
      return res.render('doctor-home', {
        title:    'בית רופא',
        name:     req.session.userName,
        patients
      });
    }
    const patient = await Patient.findById(req.session.userId).lean();
    if (!patient) return res.redirect('/logout');

    const today = new Date().toLocaleDateString('he-IL', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    res.render('patient-home', {
      title: 'בית',
      name: patient.name,
      today,
      chronicDiseases: patient.chronicDiseases || 'לא צוינו'
    });
  } catch (err) {
    next(err);
  }
};

// 2. מציג טופס הוספת מטופל (doctor) או השלמת פרופיל (patient)
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

// 3. יצירת מטופל על ידי רופא
exports.createPatient = async (req, res) => {
  // הקוד שלך ל־createPatient
};

// 4. השלמת פרופיל למטופל (הפונקציה שהייתה חסרה)
exports.completePatientProfile = async (req, res) => {
  try {
    // parse birthDate, calc age, וכו'
    // עדכון מסד: await Patient.findByIdAndUpdate(req.session.userId, {...});
    return res.redirect('/scan');
  } catch (err) {
    return res.render('patient-form', {
      title: 'השלמת פרופיל',
      errorMessage: err.message,
      patient: req.body
    });
  }
};

// 5. רשימת מטופלים (doctor)
exports.listPatients = async (req, res) => {
  // הקוד שלך ל־listPatients
};
