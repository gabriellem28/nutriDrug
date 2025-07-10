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
 * Handle image upload and detect dish + ingredients
 */
exports.postScan = async (req, res) => {
  try {
    if (!req.file) {
      return res.render('scan', {
        title: 'סריקת מזון',
        detected: null,
        confirmed: null,
        error: 'לא נבחרה תמונה'
      });
    }

    // Build file path and URL
    const fullPath = path.join(req.file.destination, req.file.filename);
    const imageUrl = `/images/uploads/${req.file.filename}`;

    // Detect dish name and ingredients
    const { dishName, ingredients } = await analyzeFood(fullPath);

    // Show user the detected data for confirmation/editing
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
      error: err.message || 'שגיאה בעיבוד התמונה, נסה שנית'
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
    // Ensure ingredients is always an array
    const userIngredients = Array.isArray(req.body.ingredients)
      ? req.body.ingredients
      : [req.body.ingredients];

    // Fetch user medications
    const patient = await Patient.findById(userId).lean();
    const medications = patient.medications || [];

    // Check interactions via AI service (returns array of objects)
    const interactionData = await checkInteractions(userIngredients, medications);

    // Save scan to user's history
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

    // Render final result with structured interaction data
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
