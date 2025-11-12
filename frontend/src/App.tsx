import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { WebSocketProvider } from './contexts/WebSocketContext';
import ErrorBoundary from './components/ErrorBoundary';
// import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/projects/ProjectList';
import ProjectDetail from './pages/projects/ProjectDetail';
import CreateProject from './pages/projects/CreateProject';
import EditProject from './pages/projects/EditProject';
import ProjectSettings from './pages/projects/ProjectSettings';
import TaskList from './pages/tasks/TaskList';
import ProjectTaskList from './pages/projects/ProjectTaskList';
import TaskKanban from './pages/tasks/TaskKanban';
import TaskDetail from './pages/tasks/TaskDetail';
import ProjectTaskDetail from './pages/projects/ProjectTaskDetail';
import TaskForm from './pages/tasks/TaskForm';
import DocumentList from './pages/documents/DocumentList';
import ProjectDocumentList from './pages/projects/ProjectDocumentList';
import DocumentDetail from './pages/documents/DocumentDetail';
import DocumentUpload from './pages/documents/DocumentUpload';
import DocumentEdit from './pages/documents/DocumentEdit';
import PublicLibrary from './pages/documents/PublicLibrary';
import Analytics from './pages/Analytics';
import UserActivity from './pages/UserActivity';
import ProjectProgress from './pages/projects/ProjectProgress';
import AccountSettingsPage from './pages/account/AccountSettingsPage';
import ArchivedProjects from './pages/projects/ArchivedProjects';
import UserManagement from './pages/admin/UserManagement';

// Components
import ProtectedRoute from './components/layout/ProtectedRoute';

function AppContent() {
  return (
    <Router>
      <WebSocketProvider>
        <div className="App">
          <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={<Login />}
          />
          <Route 
            path="/register" 
            element={<Register />}
          />
          <Route 
            path="/verify-email/:token" 
            element={<VerifyEmail />}
          />
          <Route 
            path="/verify-email" 
            element={<VerifyEmail />}
          />
          <Route 
            path="/forgot-password" 
            element={<ForgotPassword />}
          />
          <Route 
            path="/reset-password/:token" 
            element={<ResetPassword />}
          />
          <Route 
            path="/reset-password" 
            element={<ResetPassword />}
          />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <ProjectList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/archived" 
            element={
              <ProtectedRoute>
                <ArchivedProjects />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/new" 
            element={
              <ProtectedRoute>
                <CreateProject />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:id/edit" 
            element={
              <ProtectedRoute>
                <EditProject />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:id/settings" 
            element={
              <ProtectedRoute>
                <ProjectSettings />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/user-activity" 
            element={
              <ProtectedRoute>
                <UserActivity />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <Analytics />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/profile" 
            element={
              <ProtectedRoute>
                <AccountSettingsPage />
              </ProtectedRoute>
            }
          />
          
          {/* Admin Routes */}
          <Route 
            path="/admin/users" 
            element={
              <ProtectedRoute>
                <UserManagement />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/projects/:id/progress" 
            element={
              <ProtectedRoute>
                <ProjectProgress />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:id" 
            element={
              <ProtectedRoute>
                <ProjectDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Task Routes */}
          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute>
                <TaskList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks/kanban" 
            element={
              <ProtectedRoute>
                <TaskKanban />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks/new" 
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks/:id" 
            element={
              <ProtectedRoute>
                <TaskDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/tasks/:id/edit" 
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            } 
          />
          
          {/* Project Task Routes */}
          <Route 
            path="/projects/:projectId/tasks" 
            element={
              <ProtectedRoute>
                <ProjectTaskList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:projectId/tasks/kanban" 
            element={
              <ProtectedRoute>
                <TaskKanban />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:projectId/tasks/new" 
            element={
              <ProtectedRoute>
                <TaskForm />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:projectId/tasks/:id" 
            element={
              <ProtectedRoute>
                <ProjectTaskDetail />
              </ProtectedRoute>
            } 
          />
          
          {/* Project Document Routes */}
          <Route 
            path="/projects/:projectId/documents" 
            element={
              <ProtectedRoute>
                <ProjectDocumentList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/projects/:projectId/documents/upload" 
            element={
              <ProtectedRoute>
                <DocumentUpload />
              </ProtectedRoute>
            } 
          />
          
          {/* Document Routes */}
          <Route 
            path="/documents" 
            element={
              <ProtectedRoute>
                <DocumentList />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents/upload" 
            element={
              <ProtectedRoute>
                <DocumentUpload />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents/:id" 
            element={
              <ProtectedRoute>
                <DocumentDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/library" 
            element={
              <ProtectedRoute>
                <PublicLibrary />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/documents/:id/edit" 
            element={
              <ProtectedRoute>
                <DocumentEdit />
              </ProtectedRoute>
            } 
          />
          
          {/* Default redirect */}
          <Route 
            path="/" 
            element={<Navigate to="/login" replace />}
          />
            
            {/* 404 */}
            <Route 
              path="*" 
              element={
                <div className="min-h-screen flex items-center justify-center bg-gray-50">
                  <div className="text-center">
                    <h1 className="text-2xl font-bold text-gray-900">404 - Trang không tìm thấy</h1>
                    <p className="mt-2 text-gray-600">Trang bạn đang tìm kiếm không tồn tại.</p>
                    <div className="mt-6 space-x-4">
                      <button
                        onClick={() => window.history.back()}
                        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
                      >
                        Quay lại
                      </button>
                      <Link
                        to="/dashboard"
                        className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        Về Trang chủ
                      </Link>
                    </div>
                  </div>
                </div>
              } 
            />
          </Routes>
          
          {/* Toast Notifications */}
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </WebSocketProvider>
    </Router>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppContent />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
