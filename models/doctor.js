const mongoose = require('mongoose');
const bcrypt   = require('bcrypt');

const doctorSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  idNumber: { type: String, required: true, unique: true },
  password: { type: String, required: true }
}, { timestamps: true });

doctorSchema.pre('save', async function() {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

doctorSchema.methods.comparePassword = function(candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('Doctor', doctorSchema);
