// FILE: controllers/scanController.js

const path = require('path');
const { analyzeFood } = require('../services/foodVision');
const { checkInteractions } = require('../services/medicationService');
const Patient = require('../models/patient');

/**
 * GET /scan
 * Render the initial scan page (upload form)
 */
exports.getScanPage = (req, res) => {
  res.render('scan', {
    title: 'סריקת מזון',
    detected: null,
    confirmed: null,
    error: null
  });
};

/**
 * POST /scan
 * Handle image upload or manual dish name entry and detect dish + ingredients
 */
exports.postScan = async (req, res) => {
  try {
    // --- Manual entry branch ---
    if (req.body.manualDishName) {
      const dishName = req.body.manualDishName.trim();
      const ingredients = [dishName];
      return res.render('scan', {
        title: 'אשר/ערוך מרכיבים',
        detected: { dishName, ingredients, imageUrl: null },
        confirmed: null,
        error: null
      });
    }

    // --- Image upload branch ---
    if (!req.file) {
      return res.render('scan', {
        title: 'סריקת מזון',
        detected: null,
        confirmed: null,
        error: 'לא נבחרה תמונה'
      });
    }

    // Build file path & URL
    const fullPath = path.join(req.file.destination, req.file.filename);
    const imageUrl = `/images/uploads/${req.file.filename}`;

    // Use AI to detect dish name and ingredients
    const { dishName, ingredients } = await analyzeFood(fullPath);

    // Show for user confirmation/editing
    res.render('scan', {
      title: 'אשר/ערוך מרכיבים',
      detected: { dishName, ingredients, imageUrl },
      confirmed: null,
      error: null
    });
  } catch (err) {
    console.error('🔥 scanController.postScan:', err);
    res.render('scan', {
      title: 'סריקת מזון',
      detected: null,
      confirmed: null,
      error: err.message || 'שגיאה בעיבוד הנתונים, נסה שנית'
    });
  }
};

/**
 * POST /scan/confirm
 * Handle user confirmation/editing of ingredients, check interactions, and save
 */
exports.confirmScan = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { dishName } = req.body;
    // Ensure we always work with an array
    const userIngredients = Array.isArray(req.body.ingredients)
      ? req.body.ingredients
      : [req.body.ingredients];

    // Fetch patient record to get current medications
    const patient = await Patient.findById(userId).lean();
    const medications = patient.medications || [];

    // If no medications are recorded, warn and stop
    if (medications.length === 0) {
      return res.render('scan', {
        title: 'סריקת מזון',
        detected: null,
        confirmed: null,
        error: 'לא נמצאו תרופות רשומות , יש להוסיף תרופות לפני סריקת מזון'
      });
    }

    // Otherwise, check interactions via AI service
    const interactionData = await checkInteractions(userIngredients, medications);

    // Save scan history
    await Patient.findByIdAndUpdate(userId, {
      $push: {
        scans: {
          date: new Date(),
          dishName,
          ingredients: userIngredients,
          interactions: interactionData
        }
      }
    });

    // Render final results
    res.render('scan', {
      title: 'תוצאות הסריקה',
      detected: null,
      confirmed: { dishName, ingredients: userIngredients, interactionData },
      error: null
    });
  } catch (err) {
    console.error('🔥 scanController.confirmScan:', err);
    res.render('scan', {
      title: 'סריקת מזון',
      detected: null,
      confirmed: null,
      error: err.message || 'שגיאה בשמירת הסריקה, נסה שנית'
    });
  }
};
