const Status = require('../models/status');
const mongoose = require('mongoose');

const getAllStatuses = async (filter = {}) => {
  return await Status.find(filter).sort({ name: 1 });
};

const createStatus = async ({ name, description }) => {
  const existing = await Status.findOne({ name: name.trim() });
  if (existing) {
    const error = new Error('Ya existe un estado con ese nombre.');
    error.status = 400;
    throw error;
  }

  const status = new Status({ name: name.trim(), description: description?.trim() || '' });
  return await status.save();
};

const toggleStatus = async (statusId) => {
  if (!mongoose.Types.ObjectId.isValid(statusId)) {
    const error = new Error('El estado enviado no es válido.');
    error.status = 400;
    throw error;
  }

  const status = await Status.findById(statusId);
  if (!status) {
    const error = new Error('Estado no encontrado.');
    error.status = 404;
    throw error;
  }

  status.isActive = !status.isActive;
  return await status.save();
};

module.exports = { getAllStatuses, createStatus, toggleStatus };