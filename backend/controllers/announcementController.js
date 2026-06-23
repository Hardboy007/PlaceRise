const Announcement = require('../models/Announcement');

// GET /api/announcements
// Students ko sirf 'Published' announcements dikhani hain
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ status: 'Published' });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/announcements
// req.body se data + req.user.id se createdBy set karke save karo
const createAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.create(req.body);
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// DELETE /api/announcements/:id
const deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await Announcement.findByIdAndDelete(id);

    if (!announcement) {
      return res.status(404).json({ message: 'Announcement not found' });
    }

    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllAnnouncements,
  createAnnouncement,
  deleteAnnouncement
};