import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useApp } from "@/hooks/AppContext";
import { canAccess } from "@/lib/nav";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import Login from "@/pages/Login";
import ExecutiveOverview from "@/pages/ExecutiveOverview";
import AssetHealth from "@/pages/AssetHealth";
import AssetDetail from "@/pages/AssetDetail";
import Baselines from "@/pages/Baselines";
import Predictive from "@/pages/Predictive";
import Alerts from "@/pages/Alerts";
import Maintenance from "@/pages/Maintenance";
import Esg from "@/pages/Esg";
import DataQuality from "@/pages/DataQuality";
import Governance from "@/pages/Governance";
import Reports from "@/pages/Reports";
import NotAuthorized from "@/pages/NotAuthorized";

function Protected({ path, children }: { path: string; children: React.ReactNode }) {
  const { role } = useApp();
  const location = useLocation();
  if (!role) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (!canAccess(role, path)) return <NotAuthorized />;
  return <>{children}</>;
}

export default function App() {
  const { role } = useApp();

  return (
    <Routes>
      <Route path="/login" element={role ? <Navigate to="/overview" replace /> : <Login />} />

      <Route element={<DashboardLayout />}>
        <Route path="/overview" element={<Protected path="/overview"><ExecutiveOverview /></Protected>} />
        <Route path="/assets" element={<Protected path="/assets"><AssetHealth /></Protected>} />
        <Route path="/assets/:assetId" element={<Protected path="/assets/:id"><AssetDetail /></Protected>} />
        <Route path="/baselines" element={<Protected path="/baselines"><Baselines /></Protected>} />
        <Route path="/predictive" element={<Protected path="/predictive"><Predictive /></Protected>} />
        <Route path="/alerts" element={<Protected path="/alerts"><Alerts /></Protected>} />
        <Route path="/maintenance" element={<Protected path="/maintenance"><Maintenance /></Protected>} />
        <Route path="/esg" element={<Protected path="/esg"><Esg /></Protected>} />
        <Route path="/data-quality" element={<Protected path="/data-quality"><DataQuality /></Protected>} />
        <Route path="/governance" element={<Protected path="/governance"><Governance /></Protected>} />
        <Route path="/reports" element={<Protected path="/reports"><Reports /></Protected>} />
      </Route>

      <Route path="/" element={<Navigate to={role ? "/overview" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={role ? "/overview" : "/login"} replace />} />
    </Routes>
  );
}
