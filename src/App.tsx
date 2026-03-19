import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Seasons from './pages/Seasons';
import SeasonDetail from './pages/SeasonDetail';
import RaceDetail from './pages/RaceDetail';
import Drivers from './pages/Drivers';
import DriverDetail from './pages/DriverDetail';
import ConstructorDetail from './pages/ConstructorDetail';
import Search from './pages/Search';
import Records from './pages/Records';
import AdminDashboard from './pages/admin/Dashboard';
import Login from './pages/Login';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

export default function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-black text-white font-sans selection:bg-red-600 selection:text-white">
        <Navbar />
        <main className="pt-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/seasons" element={<Seasons />} />
            <Route path="/seasons/:id" element={<SeasonDetail />} />
            <Route path="/races/:id" element={<RaceDetail />} />
            <Route path="/drivers" element={<Drivers />} />
            <Route path="/drivers/:id" element={<DriverDetail />} />
            <Route path="/constructors/:id" element={<ConstructorDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/records" element={<Records />} />
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </main>
        <Footer />
      </div>
    </AuthProvider>
  );
}
