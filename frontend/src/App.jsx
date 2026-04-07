import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './features/auth/AuthContext';

// Auth
import LoginPage from './features/auth/pages/LoginPage';
import RegisterPage from './features/auth/pages/RegisterPage';

// Landing (public)
import LandingPage from './features/landing/pages/LandingPage';
import AnnouncementsPage from './features/landing/pages/AnnouncementsPage';
import Home from './features/landing/pages/Home';
import ClassDetails from './features/landing/pages/ClassDetails';
import PastClassesPage from './features/student/pages/PastClassesPage';

// Conductor — new feature set
import ConductorLayout from './features/conductor/layouts/ConductorLayout';
import Dashboard from './features/conductor/pages/Dashboard';
import ClassList from './features/conductor/pages/ClassList';
import CreateClass from './features/conductor/pages/CreateClass';
import EditClass from './features/conductor/pages/EditClass';
import CreateAnnouncement from './features/conductor/pages/CreateAnnouncement';
import StudentsList from './features/conductor/pages/StudentsList';
import Profile from './features/conductor/pages/Profile';
import UploadNotesPage from './features/conductor/pages/UploadNotesPage';
import ClassRequestsPage from './features/conductor/pages/ClassRequestsPage';

// Student (Member 3)
import StudentHome from './features/student/pages/StudentHome';
import StudentRegistrationPage from './features/student/pages/StudentRegistrationPage';
import MyClasses from './features/student/pages/MyClasses';
import StudentProfile from './features/student/pages/StudentProfile';
import StudentLayout from './features/student/layouts/StudentLayout';
import MyRequests from './features/student/pages/MyRequests';

// Content (Member 4)
import ContentPage from './features/content/pages/ContentPage';
import ReviewsPage from './features/content/pages/ReviewsPage';

// Layouts
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './layouts/ProtectedRoute';

/** Redirect logged-in users away from /login and /register */
function PublicRoute({ children }) {
  const { user } = useAuth();
  if (user) {
    return <Navigate to={user.role === 'conductor' ? '/conductor' : '/student'} replace />;
  }
  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ── Public routes ── */}
        <Route path="/" element={<Home />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/announcements" element={<AnnouncementsPage />} />        <Route path="/past-classes" element={<PastClassesPage />} />        <Route path="/class/:id" element={<ClassDetails />} />

        {/* ── Auth (blocked when logged in) ── */}
        <Route path="/login"    element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />

        {/* ── Student routes ── */}
        <Route
          path="/student"
          element={<ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>}
        >
          <Route index element={<StudentHome />} />
          <Route path="classes"   element={<StudentRegistrationPage />} />
          <Route path="myclasses" element={<MyClasses />} />
          <Route path="requests"  element={<MyRequests />} />
          <Route path="profile"   element={<StudentProfile />} />
          <Route path="content"   element={<ContentPage />} />
          <Route path="reviews"   element={<ReviewsPage />} />
        </Route>

        {/* ── Conductor routes (new sidebar layout) ── */}
        <Route
          path="/conductor"
          element={<ProtectedRoute role="conductor"><ConductorLayout /></ProtectedRoute>}
        >
          <Route index element={<Navigate to="/conductor/dashboard" replace />} />
          <Route path="dashboard"     element={<Dashboard />} />
          <Route path="classes"       element={<ClassList />} />
          <Route path="create"        element={<CreateClass />} />
          <Route path="edit/:id"      element={<EditClass />} />
          <Route path="requests"      element={<ClassRequestsPage />} />
          <Route path="announcements" element={<CreateAnnouncement />} />
          <Route path="students"      element={<StudentsList />} />
          <Route path="notes"         element={<UploadNotesPage />} />
          <Route path="profile"       element={<Profile />} />
          <Route path="content"       element={<ContentPage />} />
          <Route path="reviews"       element={<ReviewsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

