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
import NOCManagementPage from "../pages/coordinator/NOCManagementPage";
import AttendancePage from "../pages/coordinator/AttendancePage";
import DocumentRequestPage from "../pages/student/DocumentRequestPage";
import ScanAttendancePage from "../pages/student/ScanAttendancePage";
import RecruiterCRMPage from "../pages/coordinator/RecruiterCRMPage";
import AnalyticsDashboardPage from "../pages/coordinator/AnalyticsDashboardPage";
import AboutPage from "../pages/common/About";
import SupportPage from "../pages/common/SupportPage";
import PrivacyPolicyPage from "../pages/common/PrivacyPage";
import ResetPasswordPage from "../pages/common/ResetPasswordPage";
import HRLoginPage from "../pages/common/HRLoginPage";
import HRFeedbackFormPage from "../pages/common/HRFeedbackFormPage";
import HRFeedbackManagementPage from "../pages/coordinator/HRFeedbackManagementPage";
import CoordinatorStudentProfilePage from "../pages/coordinator/CoordinatorStudentProfilePage";

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
        <Route path="/attendance" element={<ScanAttendancePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/support" element={<SupportPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        <Route path="/hr-login" element={<HRLoginPage />} />
        <Route path="/hr-feedback" element={<HRFeedbackFormPage />} />
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
          <Route path="jobs">
            <Route path="all" element={<CompanyManagementPage />} />
          </Route>
          <Route path="recruiter-crm" element={<RecruiterCRMPage />} />
          <Route path="calendar" element={<CompanyCalendarPage />} />
          <Route path="applications" element={<ApplicationsManagementPage />} />
          <Route
            path="announcements"
            element={<AnnouncementManagementPage />}
          />
          <Route path="noc" element={<NOCManagementPage />} />
          <Route path="attendance" element={<AttendancePage />} />
          <Route path="analytics" element={<AnalyticsDashboardPage />} />
          <Route path="/coordinator/hr-feedback" element={<HRFeedbackManagementPage />} />
          <Route path="profile" element={<CoordinatorProfile />} />
          <Route path="students/:studentId" element={<CoordinatorStudentProfilePage />} />
        </Route>
        <Route path="*" element={<div>404 - Page Not Found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
