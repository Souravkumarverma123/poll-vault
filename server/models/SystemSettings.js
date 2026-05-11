const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema(
  {
    allowRegistrations: {
      type: Boolean,
      default: true,
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    announcementMessage: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);
