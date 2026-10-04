import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import OperatorHud from './pages/OperatorHud';
import MicroLanding from './pages/MicroLanding';
import Dashboard from './pages/Dashboard';
import CrmPipeline from './pages/CrmPipeline';
import CrmTasks from './pages/CrmTasks';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/operator" replace />} />
        <Route path="/operator" element={<OperatorHud />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/crm/pipeline" element={<CrmPipeline />} />
        <Route path="/crm/tasks" element={<CrmTasks />} />
        <Route path="/m/:shortCode" element={<MicroLanding />} />
        <Route path="*" element={<Navigate to="/operator" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
