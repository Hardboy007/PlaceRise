import { BrowserRouter, Routes, Route } from "react-router-dom";
import StudentLayout from "../layouts/StudentLayout";
import CoordinatorLayout from "../layouts/CoordinatorLayout";
import RoleSelectionPage from "../pages/common/RoleSelection";
import StudentDashboard from "../pages/student/StudentDashboard";
import StudentApplication from "../pages/student/StudentApplication";
import StudentOnboardingPage from "../pages/student/StudentOnboardingPage";
import StudentProfilePage from "../pages/student/StudentProfile";
import CompanyListPage from "../pages/student/CompanyList";
import CompanyDetailPage from "../pages/student/CompanyDetailPage";
import StudentSettingsPage from "../pages/student/StudentSettings";
import CoordinatorDashboard from "../pages/coordinator/CoordinatorDashboard";

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
          <Route path="companies/:companyId" element={<CompanyDetailPage />} />
          <Route path="applications" element={<StudentApplication />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
        </Route>

        {/* Coordinator Routes - Layout ke andar */}
        <Route path="/coordinator" element={<CoordinatorLayout />}>
          <Route path="dashboard" element={<CoordinatorDashboard />} />
          <Route path="students" element={<div>Student Database</div>} />
          <Route path="companies" element={<div>Company Management</div>} />
          <Route path="calendar" element={<div>Company Calendar</div>} />
          <Route path="applications" element={<div>Applications Management</div>} />
          <Route path="announcements" element={<div>Announcements</div>} />
          <Route path="profile" element={<div>Coordinator Profile</div>} />
        </Route>
        
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
