const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// تعریف مدل پروژه
const projectSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  parts: [
    {
      model: String,  // نام قطعه
      number: Number  // تعداد قطعه
    }
  ],
  startDate: {
    type: Date,  // تاریخ شروع پروژه
    required: true
  },
  endDate: {
    type: Date,  // تاریخ پایان پروژه
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// ساخت مدل پروژه
const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
