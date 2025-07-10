const Patient = require('../models/patient');

exports.getMedicationsForm = async (req, res) => {
  try {
    console.log("🔍 session:", req.session);
    const patient = await Patient.findById(req.session.userId);
    if (!patient) {
      console.error("⚠ לא נמצא מטופל עם ID:", req.session.userId);
      return res.status(404).send("Patient not found");
    }
    res.render('medications', {
      medications: patient.medications || [],
      success: req.query.success
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Something went wrong");
  }
};

exports.postMedicationsForm = async (req, res) => {
  try {
    const { medications } = req.body;
    console.log("🔍 POST medications:", medications);

    await Patient.findByIdAndUpdate(req.session.userId, {
      medications: Array.isArray(medications) ? medications : [medications]
    });

    res.redirect('/medications?success=1');
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to update medications");
  }
};
