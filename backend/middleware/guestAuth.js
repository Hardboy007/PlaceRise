const jwt = require("jsonwebtoken");

// Short-lived token issued after a company access code is verified.
// Separate from the student/coordinator `protect` middleware since guests
// never have a User account — the token just carries a companyId claim.
const guestProtect = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Guest access token required" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.type !== "hr-guest") {
      return res.status(403).json({ message: "Invalid token type" });
    }
    req.guestCompanyId = decoded.companyId;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired access token" });
  }
};

module.exports = { guestProtect };