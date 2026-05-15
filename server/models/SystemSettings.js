import mongoose from 'mongoose';

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
      maxlength: [500, 'Announcement message cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

export default mongoose.model('SystemSettings', systemSettingsSchema);
