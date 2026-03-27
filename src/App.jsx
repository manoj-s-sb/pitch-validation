import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import NocPage from './pages/noc';
import PitchValidationPage from './pages/pitch-validation';
import LaneDetials from './pages/noc/components/LaneDetails';

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Routes>
          <Route path="/noc" element={<NocPage />} />
          <Route path="/pitchValidation" element={<PitchValidationPage />} />
          <Route path="/noc/:facilityCode/:laneId" element={<LaneDetials />} />
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
