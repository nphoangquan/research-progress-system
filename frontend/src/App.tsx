import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { WebSocketProvider } from './contexts/WebSocketContext';
// import { useAuth } from './hooks/useAuth';

// Pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
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
import UserProfile from './pages/UserProfile';
import ArchivedProjects from './pages/projects/ArchivedProjects';

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
                <UserProfile />
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
                    <h1 className="text-2xl font-bold text-gray-900">404 - Page Not Found</h1>
                    <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
                    <button
                      onClick={() => window.history.back()}
                      className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
                    >
                      Go Back
                    </button>
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
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
