// FILE: controllers/authController.js

const path    = require('path');
const vision  = require('@google-cloud/vision');
const Patient = require('../models/patient');
const Doctor  = require('../models/doctor');

const client = new vision.ImageAnnotatorClient({
  keyFilename: path.join(__dirname, '..', 'config', 'google-service-account.json')
});

// Show login form
exports.showLogin = (req, res) => {
  res.render('login', {
    title: 'התחברות',
    error: null
  });
};

// Handle login
exports.login = async (req, res) => {
  const { idNumber, password, role } = req.body;

  try {
    const Model = role === 'doctor' ? Doctor : Patient;
    const user  = await Model.findOne({ idNumber });

    if (!user || !(await user.comparePassword(password))) {
      throw new Error('תעודת זהות או סיסמה שגויים');
    }

    // Initialize session
    req.session.userId   = user._id;
    req.session.userRole = role;
    req.session.userName = user.name;

    // Redirect by role
   return res.redirect('/');
  } catch (err) {
    return res.render('login', {
      title: 'התחברות',
      error: err.message
    });
  }
};

// Show registration form
exports.showRegister = (req, res) => {
  res.render('register', {
    title:        'הרשמה',
    errorMessage: null,
    formData:     {}
  });
};

// Handle registration (doctor or patient)
exports.register = async (req, res) => {
  const { role, name, idNumber, password } = req.body;

  try {
    // --- Doctor registration ---
    if (role === 'doctor') {
      await Doctor.create({ name, idNumber, password });
      return res.redirect('/login');
    }

    // --- Patient registration ---
    // Parse birthDate & compute age
    const [y, m, d] = (req.body.birthDate || '').split('-').map(Number);
    const dob = new Date(y, m - 1, d);
    if (isNaN(dob.getTime())) {
      throw new Error('תאריך לידה לא תקין');
    }
    let age = new Date().getFullYear() - dob.getFullYear();
    const mm = new Date().getMonth() - dob.getMonth();
    if (mm < 0 || (mm === 0 && new Date().getDate() < dob.getDate())) {
      age--;
    }

    // Optional: face detection if photo uploaded
    if (req.file) {
      const imgPath = path.join('public', 'images', 'uploads', req.file.filename);
      const [result] = await client.faceDetection(imgPath);
      if (!result.faceAnnotations?.length) {
        throw new Error('לא זוהו פנים בתמונה');
      }
    }

    // Create patient record
    const patient = new Patient({
      name,
      idNumber,
      password,
      gender:          req.body.gender,
      pregnant:        req.body.pregnant === 'true',
      breastfeeding:   req.body.breastfeeding === 'true',
      dateOfBirth:     dob,
      age,
      chronicDiseases: req.body.chronicDiseases,
      email:           req.body.email,
      phone:           req.body.phone,
      photoUrl:        req.file ? `/images/uploads/${req.file.filename}` : ''
    });
    await patient.save();

    // Initialize session
    req.session.userId   = patient._id;
    req.session.userRole = 'patient';
    req.session.userName = patient.name;

    return res.redirect('/scan');

  } catch (err) {
    console.error('🔥 register error:', err);
    return res.render('register', {
      title:        'הרשמה',
      errorMessage: err.message,
      formData:     req.body
    });
  }
};

// Handle logout
exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
};
