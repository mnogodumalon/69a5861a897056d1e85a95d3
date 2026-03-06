import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import DashboardOverview from '@/pages/DashboardOverview';
import AdminPage from '@/pages/AdminPage';
import MitarbeiterPage from '@/pages/MitarbeiterPage';
import SchichtvorlagenPage from '@/pages/SchichtvorlagenPage';
import SchichtzuweisungPage from '@/pages/SchichtzuweisungPage';

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<DashboardOverview />} />
          <Route path="mitarbeiter" element={<MitarbeiterPage />} />
          <Route path="schichtvorlagen" element={<SchichtvorlagenPage />} />
          <Route path="schichtzuweisung" element={<SchichtzuweisungPage />} />
          <Route path="admin" element={<AdminPage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}