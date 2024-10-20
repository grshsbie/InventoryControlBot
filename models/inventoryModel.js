const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const inventorySchema = new Schema({
  productId: { type: String, required: true, unique: true },
  model: { type: String, required: true },
  number: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  isDeleted: { type: Boolean, default: false }  // فیلد جدید برای مشخص کردن حذف قطعه
});

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
