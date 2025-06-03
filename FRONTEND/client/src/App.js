import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { UserProvider } from './contexts/UserContext';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import PrivateRoute from './components/PrivateRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Importa le pagine principali
import HomePage from './pages/Home/HomePage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProfilePage from './pages/Profile/ProfilePage';
import MealsPage from './pages/Meals/MealsPage';
import NotFoundPage from './pages/NotFound/NotFoundPage';
import MealDetailPage from './pages/Meals/MealDetailPage';
import CreateMealPage from './pages/Meals/CreateMealPage';
import EditMealPage from './pages/Meals/EditMealPage';

const App = () => {
  return (
    <AuthProvider>
      <UserProvider>
          <div className="min-h-screen bg-gray-50">
            <Navbar />
            <Container fluid className="app-container">
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <ProfilePage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/meals"
                  element={
                    <PrivateRoute>
                      <MealsPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/meals/:id"
                  element={
                    <PrivateRoute>
                      <MealDetailPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/meals/create"
                  element={
                    <PrivateRoute>
                      <CreateMealPage />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/meals/:id/edit"
                  element={
                    <PrivateRoute>
                      <EditMealPage />
                    </PrivateRoute>
                  }
                />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </Container>
          </div>        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
      </UserProvider>
    </AuthProvider>
  );
};

export default App;