const Activity = require("../models/Activity");

// Coordinator profile page par sirf latest 3 activities dikhani hain —
// isliye DB me bhi per-user sirf 3 hi rakhte hain, purani apne aap
// delete ho jaati hain. Isse table hamesha chhoti rehti hai aur koi
// alag cleanup cron job bhi nahi chahiye.
const MAX_ACTIVITIES_PER_USER = 3;

// Reusable helper — jis bhi controller me coordinator koi action kare
// (job post, select/reject, NOC approve/reject, drive banana,
// announcement post karna), wahan se ye function call karo.
// Isse kabhi bhi error throw nahi hota — activity log fail hone se
// asli request (job create, status update, etc.) kabhi crash nahi honi
// chahiye, isliye try/catch khud yahin handle kiya hai.
const logActivity = async (userId, action, type = "other", refId = null) => {
  try {
    if (!userId) return;
    await Activity.create({ userId, action, type, refId });

    // Is user ki 3 se zyada purani entries dhoondo aur unhe delete karo
    const staleActivities = await Activity.find({ userId })
      .sort({ createdAt: -1 })
      .skip(MAX_ACTIVITIES_PER_USER)
      .select("_id");

    if (staleActivities.length > 0) {
      await Activity.deleteMany({
        _id: { $in: staleActivities.map((a) => a._id) },
      });
    }
  } catch (err) {
    console.error("Activity log failed:", err.message);
  }
};

module.exports = logActivity;