import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import DDoSGuard from './components/DDoSGuard';
import Home from './pages/Home';
import Scripts from './pages/Scripts';
import ScriptDetails from './pages/ScriptDetails';
import Upload from './pages/Upload';
import Admin from './pages/Admin';
import Owner from './pages/Owner';
import Dashboard from './pages/Dashboard';
import Trending from './pages/Trending';
import ExecutorStatus from './pages/ExecutorStatus';
import RobloxDownloader from './pages/RobloxDownloader';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Contact from './pages/Contact';
import Notifications from './pages/Notifications';
import { Login, Register } from './pages/Auth';

function App() {
  return (
    <AuthProvider>
      <DDoSGuard>
        <Router>
          <Toaster position="top-right" toastOptions={{ style: { background: '#1e1e1e', color: '#fff', border: '1px solid #333' } }} />
          <Navbar />
          <div className="main-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/scripts" element={<Scripts />} />
              <Route path="/trending" element={<Trending />} />
              <Route path="/executors" element={<ExecutorStatus />} />
              <Route path="/rdd" element={<RobloxDownloader />} />
              <Route path="/script/:id" element={<ScriptDetails />} />
              <Route path="/upload" element={<Upload />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="/owner" element={<Owner />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/notifications" element={<Notifications />} />
              <Route path="/u/:username" element={<Profile />} />
              <Route path="/@:username" element={<Profile />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </DDoSGuard>
    </AuthProvider>
  );
}

export default App;
