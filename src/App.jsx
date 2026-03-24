import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NocPage from './pages/noc';
import PitchValidationPage from './pages/pitch-validation';

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Routes>
          <Route path="/noc" element={<NocPage />} />
          <Route path="/pitch-validation" element={<PitchValidationPage />} />
          <Route path="*" element={<Navigate to="/noc" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}
