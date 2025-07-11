const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const patientSchema = new mongoose.Schema({
  name:            { type: String, required: true },
  idNumber:        { type: String, required: true, unique: true },
  password:        { type: String, required: true },         // <-- הוספה
  gender:          { type: String, enum: ['male','female','other'], required: true },
  pregnant:        { type: Boolean, default: false },
  breastfeeding:   { type: Boolean, default: false },
  dateOfBirth:     { type: Date, required: true },
  age:             { type: Number, required: true },
  chronicDiseases: [String],
  medications:     { type: [String], default: [] },
  email:           { type: String },
  phone:           { type: String },
  photoUrl:        { type: String }
}, { timestamps: true });

// 1. הגדרת sub-schema לסריקות
const scanSchema = new mongoose.Schema({
  date: {
    type: Date,
    default: Date.now
  },
  dishName: String,
  ingredients: [String],
  interactions: [{
    medication:     { type: String, required: true },
    interaction:    { type: String, required: true },
    recommendation: { type: String, required: true }
  }]
});

// 2. הוספת השדה לסכמת ה־Patient
patientSchema.add({
  scans: {
    type: [scanSchema],
    default: []
  }
});

// לפני שמירת סיסמה – חשישׁ
patientSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

patientSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};


console.log('💡 Mongoose schema for medications:', patientSchema.paths.medications);
module.exports = mongoose.models.Patient || mongoose.model('Patient', patientSchema);

