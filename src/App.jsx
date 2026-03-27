import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import MultiCentreView from './pages/noc/views/MultiCentreView';
import CentreDevicesView from './pages/noc/views/CentreDevicesView';
import LaneDetailsView from './pages/noc/views/LaneDetailsView';
import PitchValidationPage from './pages/pitch-validation';

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Routes>
          {/* Step 1 — All centres overview */}
          <Route path="/noc" element={<MultiCentreView />} />

          {/* Step 2 — Single centre device table */}
          <Route path="/noc/:facilityCode" element={<CentreDevicesView />} />

          {/* Step 3 — Lane details */}
          <Route path="/noc/:facilityCode/:laneId" element={<LaneDetailsView />} />

          <Route path="/pitchValidation" element={<PitchValidationPage />} />
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
