const jwt = require('jsonwebtoken')

// Request aai
const protect = (req, res, next) => {
    let token
    // Authorization header check karo .. "Bearer xxxxx.yyyyy.zzzzz" format mein hoga
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        // Token nikaalo
        try {
            token = req.headers.authorization.split(' ')[1]
            const decoded = jwt.verify(token, process.env.JWT_SECRET)   // Verify karo — secret key se
            req.user = decoded      // Decoded mein user ka data hoga — id, role
            next()          // Aage jaane do
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' })
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' })
    }
}

// User authenticated ho gaya
// Ab check karo role kya hai

const coordinatorOnly = (req, res, next) => {
    if (req.user && req.user.role === 'coordinator') {
        next()      // coordinator hai — jaane do
    } else {          // student hai — access denied
        res.status(403).json({ message: 'Access denied - coordinators only' })
    }
}
const checkCRCHead = (req, res, next) => {
    if (req.user && req.user.subRole === 'crc_head') {
        next()
    } else {
        res.status(403).json({ message: 'Access denied - CRC Head only' })
    }
}

module.exports = { protect, coordinatorOnly, checkCRCHead }