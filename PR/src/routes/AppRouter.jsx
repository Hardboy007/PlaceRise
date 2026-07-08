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
import StudentDatabasePage from "../pages/coordinator/StudentDatabase";
import CompanyManagementPage from "../pages/coordinator/CompanyManagement";
import CoordinatorProfile from "../pages/coordinator/CoordinatorProfile";
import CompanyCalendarPage from "../pages/coordinator/CompanyCalendarPage";
import ApplicationsManagementPage from "../pages/coordinator/ApplicationManagement";
import AnnouncementManagementPage from "../pages/coordinator/AnnouncementManagement";
import ProtectedRoute from "../components/common/ProtectedRoute";
import ChangePasswordPage from "../pages/student/ChangePasswordPage";
import DocumentRequestPage from '../pages/student/DocumentRequestPage'

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/student/change-password"
          element={<ChangePasswordPage />}
        />
        <Route path="/" element={<RoleSelectionPage />} />
        <Route
          path="/student/onboarding"
          element={
            <ProtectedRoute>
              <StudentOnboardingPage />
            </ProtectedRoute>
          }
        />

        {/* Student Routes - Layout ke andar */}
        <Route
          path="/student"
          element={
            <ProtectedRoute>
              <StudentLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<StudentDashboard />} />
          <Route path="companies" element={<CompanyListPage />} />
          <Route path="companies/:companyId" element={<CompanyDetailPage />} />
          <Route path="applications" element={<StudentApplication />} />
          <Route path="profile" element={<StudentProfilePage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
          <Route path="documents" element={<DocumentRequestPage />} />
        </Route>

        {/* Coordinator Routes - Layout ke andar */}
        <Route
          path="/coordinator"
          element={
            <ProtectedRoute>
              <CoordinatorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<CoordinatorDashboard />} />
          <Route path="students" element={<StudentDatabasePage />} />
          <Route path="companies" element={<CompanyManagementPage />} />
          <Route path="calendar" element={<CompanyCalendarPage />} />
          <Route path="applications" element={<ApplicationsManagementPage />} />
          <Route
            path="announcements"
            element={<AnnouncementManagementPage />}
          />
          <Route path="profile" element={<CoordinatorProfile />} />
          <Route path="noc" element={<div>NOC Management</div>} />
        </Route>
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
