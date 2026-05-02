import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StudentLayout from '../layouts/StudentLayout'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Role Selection Page</div>} />

        {/* Student Routes - Layout ke andar */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<div>Student Dashboard</div>} />
          <Route path="companies" element={<div>Company List</div>} />
          <Route path="companies/:companyId" element={<div>Company Detail</div>} />
          <Route path="applications" element={<div>My Applications</div>} />
          <Route path="profile" element={<div>Profile</div>} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>

        <Route path="*" element={<div>404 - Page Not Found</div>} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter