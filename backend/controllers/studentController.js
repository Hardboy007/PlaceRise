const Student = require('../models/Student'); 
const csv = require('csv-parser')
const fs = require('fs')
const bcrypt = require('bcryptjs') 
const ExcelJS = require('exceljs')
const User = require('../models/User')      


// GET all students
const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET single student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const student = await Student.findById(id);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE student by ID
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const updatedStudent = await Student.findByIdAndUpdate(id, data, { new: true });

    if (!updatedStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// ================== BULK IMPORT ==================
const bulkImportStudents = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }

    const results = []

    // CSV parse karke ek array me collect karo
    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv())
        .on('data', (row) => results.push(row))
        .on('end', resolve)
        .on('error', reject)
    })

    let imported = 0
    let skipped = 0

    for (const row of results) {
      try {
        const erpId = row['ERP ID']
        const name = row['Student Name']
        const email = row['Email']
        const course = row['Course']
        const dobRaw = row['Date of Birth']

        if (!erpId || !dobRaw) {
          skipped++
          continue
        }

        // Already exists check
        const existingUser = await User.findOne({ erpId })
        if (existingUser) {
          skipped++
          continue
        }

        // DOB se password banao: DDMMYYYY
        const dobParts = dobRaw.split(/[-\/]/)
        const day = dobParts[0].padStart(2, '0')
        const month = dobParts[1].padStart(2, '0')
        const year = dobParts[2]
        const defaultPassword = `${day}${month}${year}`

        const hashedPassword = await bcrypt.hash(defaultPassword, 10)

        // User create
        const newUser = await User.create({
          erpId,
          email,
          password: hashedPassword,
          role: 'student',
          isFirstLogin: true,
        })

        // Student create
        await Student.create({
          userId: newUser._id,
          name,
          email,
          course,
          dob: dobRaw,
        })

        imported++
      } catch (rowError) {
        console.error('Row error:', rowError.message)
        skipped++
      }
    }

    // Uploaded temp file delete kardo
    fs.unlink(req.file.path, () => {})

    res.status(200).json({ imported, skipped })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ================== EXPORT EXCEL ==================
const exportStudentsExcel = async (req, res) => {
  try {
    const students = await Student.find().populate('userId', 'erpId email')
    const workbook = new ExcelJS.Workbook()
    const sheet = workbook.addWorksheet('Students')

    sheet.columns = [
      { header: 'Name', key: 'name', width: 25 },
      { header: 'ERP ID', key: 'erpId', width: 15 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'School', key: 'school', width: 30 },
      { header: 'Course', key: 'course', width: 25 },
      { header: 'Batch', key: 'batch', width: 10 },
      { header: 'CGPA', key: 'cgpa', width: 10 },
      { header: 'Backlogs', key: 'backlogs', width: 10 },
      { header: 'Placement Status', key: 'placementStatus', width: 18 },
    ]

    students.forEach((s) => {
      sheet.addRow({
        name: s.name,
        erpId: s.userId?.erpId || '',
        email: s.email,
        phone: s.phone || '',
        school: s.school || '',
        course: s.course || '',
        batch: s.batch || '',
        cgpa: s.cgpa || '',
        backlogs: s.backlogs || 0,
        placementStatus: s.placementStatus || 'Not Placed',
      })
    })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx')

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}




module.exports = {
  getAllStudents,
  getStudentById,
  updateStudent,
  bulkImportStudents,
  exportStudentsExcel,
};
