import { BrowserRouter, Routes, Route } from 'react-router-dom'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div>Role Selection Page</div>} />
        <Route path="/student/dashboard" element={<div>Student Dashboard</div>} />
        <Route path="/student/companies" element={<div>Company List</div>} />
        <Route path="/student/companies/:companyId" element={<div>Company Detail</div>} />
        <Route path="/student/applications" element={<div>My Applications</div>} />
        <Route path="/student/profile" element={<div>Profile</div>} />
        <Route path="/student/settings" element={<div>Settings</div>} />
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter