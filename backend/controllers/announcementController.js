const Announcement = require("../models/Announcement");

// GET /api/announcements
// Students ko sirf 'Published' announcements dikhani hain
const getAllAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find({ status: "Published" }).sort(
      {
        createdAt: -1,
      },
    );
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/announcements
// req.body se data + req.user.id se createdBy set karke save karo
const createAnnouncement = async (req, res) => {
  try {
    const announcement = await Announcement.create({
      ...req.body,
      // Coordinator panel se banaya hua announcement seedha live hona
      // chahiye — status ab yahan explicitly set ho raha hai, warna
      // schema ka default ('Draft') lag jata tha aur GET (jo sirf
      // Published filter karta hai) usko kabhi return hi nahi karta tha.
      status: req.body.status || "Published",
      // req.user coordinator ke auth middleware se aata hai
      ...(req.user?.id ? { createdBy: req.user.id } : {}),
    });
    res.status(201).json(announcement);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/announcements/:id
// Existing announcement edit karna
const updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;

    const announcement = await Announcement.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json(announcement);
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
      return res.status(404).json({ message: "Announcement not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
};
