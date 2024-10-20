const Inventory = require('../models/inventoryModel');
const generateId = require('../utils/generateId');

exports.addNewPart = async (model, number) => {
  const newPart = new Inventory({
    model,
    number,
    productId: generateId(),
  });
  return newPart.save();
};

exports.createProject = async (projectName, parts) => {
  for (let part of parts) {
    await Inventory.updateOne({ model: part }, { $inc: { number: -1 } });
  }
  return true;
};

exports.getInventory = () => {
  return Inventory.find();
};
