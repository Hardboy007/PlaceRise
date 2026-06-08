const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const Student = require('../models/Student')
const Coordinator = require('../models/Coordinator')

// Token generate karne ka function
const generateToken = (id, role) => {
    return jwt.sign(
        { id, role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
    )
}

// Student Login
const studentLogin = async (req, res) => {
    try{
        const { erpId, password } = req.body

        //ERP ID se user dhundho
        const user = await User.findOne({ erpId, role: 'student' })
        if(!user){
            return res.status(401).json({ message: 'Invalid ERP ID' })
        }

        //Password check kro
        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) {
            return res.status(401).json({ message: 'Invalid password' })
        }

        //Student profile fetch karo
        const student = await Student.findOne({ userId: user._id })

        //Token banao aur bhejo
        res.json({
            token: generateToken(user._id, user.role),
            isFirstLogin: user.isFirstLogin,
            student: {
                id: student._id,
                name: student.name,
                erpId: user.erpId,
                branch: student.branch,
                role: user.role
            }
        })

    } catch(error){
        res.status(500).json({ message: error.message })
    }
}

//Coordinator Login
const coordinatorLogin = async (req, res) => {
    try{
        const { erpId, password } = req.body

        //Erp se user dhundho
        const user = await User.findOne({ erpId, role: 'coordinator' })
        if (!user) {
            return res.status(401).json({ message: 'Invalid ERP ID' })
        }

        //password check kro
        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid password' })
        }

        // Coordinator profile fetch karo
        const coordinator = await Coordinator.findOne({ userId: user._id })
        
        // Token banao aur bhejo
        res.json({
            token: generateToken(user._id, user.role),
            coordinator: {
            id: coordinator._id,
            name: coordinator.name,
            erpId: user.erpId,
            designation: coordinator.designation,
            role: user.role
            }
        })
    } catch(error){
        res.status(500).json({ message: error.message })
    }
}

module.exports = { studentLogin, coordinatorLogin }