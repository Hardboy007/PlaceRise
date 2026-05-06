import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StudentLayout from '../layouts/StudentLayout'
import RoleSelectionPage from '../pages/common/RoleSelection'
import StudentDashboard from '../pages/student/StudentDashboard'
import StudentApplication from '../pages/student/StudentApplication'
import StudentOnboardingPage from '../pages/student/StudentOnboardingPage'
import StudentProfilePage from '../pages/student/StudentProfile'
import CompanyListPage from '../pages/student/CompanyList'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelectionPage />} />
        <Route path="/student/onboarding" element={<StudentOnboardingPage />} />

        {/* Student Routes - Layout ke andar */}
        <Route path="/student" element={<StudentLayout />}>
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="companies" element={<CompanyListPage />} />
          <Route path="companies/:companyId" element={<div>Company Detail</div>} />
          <Route path="applications" element={<StudentApplication />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="settings" element={<div>Settings</div>} />
        </Route>

        <Route path="*" element={<div>404 - Page Not Found</div>} />

      </Routes>
    </BrowserRouter>
  )
}

export default AppRouter