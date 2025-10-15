import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "./components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import Schedule from "./pages/Schedule";
import VisitLog from "./pages/VisitLog";
import Advertising from "./pages/Advertising";
import SimDistribution from "./pages/SimDistribution";
import CustomerEducation from "./pages/CustomerEducation";
import Settings from "./pages/Settings";
import Users from "./pages/Users";
import Shops from "./pages/Shops";
import Analytics from "./pages/Analytics";
import TeamOverview from "./pages/TeamOverview";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import StartVisit from "./pages/StartVisit";
import NewShop from "./pages/NewShop";
import SolarDataExportDemo from "./pages/SolarDataExportDemo";
import IndividualVisit from "./pages/IndividualVisit";
import CustomerVisit from "./pages/CustomerVisit";
import ManagerContact from "./pages/ManagerContact";
import Goals from "./pages/Goals";
import BrandManagement from "./pages/BrandManagement";
import ProductManagement from "./pages/ProductManagement";
import AdminVisits from "./pages/AdminVisits";
import ManagerVisitLog from "./pages/ManagerVisitLog";
import Reports from "./pages/Reports";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            
            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route 
                path="/" 
                element={
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                } 
              />
              <Route 
                path="/dashboard" 
                element={
                  <MainLayout>
                    <Dashboard />
                  </MainLayout>
                } 
              />
              <Route 
                path="/schedule" 
                element={
                  <MainLayout>
                    <Schedule />
                  </MainLayout>
                } 
              />
              <Route 
                path="/visits" 
                element={
                  <MainLayout>
                    <VisitLog />
                  </MainLayout>
                } 
              />
              <Route 
                path="/manager-contact" 
                element={
                  <MainLayout>
                    <ManagerContact />
                  </MainLayout>
                } 
              />
              <Route 
                path="/advertising" 
                element={
                  <MainLayout>
                    <Advertising />
                  </MainLayout>
                } 
              />
              <Route 
                path="/sim-distribution" 
                element={
                  <MainLayout>
                    <SimDistribution />
                  </MainLayout>
                } 
              />
              <Route 
                path="/education" 
                element={
                  <MainLayout>
                    <CustomerEducation />
                  </MainLayout>
                } 
              />
              <Route 
                path="/settings" 
                element={
                  <MainLayout>
                    <Settings />
                  </MainLayout>
                } 
              />
              <Route 
                path="/managers" 
                element={
                  <MainLayout>
                    <Users />
                  </MainLayout>
                } 
              />
              <Route 
                path="/shops" 
                element={
                  <MainLayout>
                    <Shops />
                  </MainLayout>
                } 
              />
              <Route 
                path="/analytics" 
                element={
                  <MainLayout>
                    <Analytics />
                  </MainLayout>
                } 
              />
              <Route 
                path="/goals" 
                element={
                  <MainLayout>
                    <Goals />
                  </MainLayout>
                } 
              />
              <Route 
                path="/team" 
                element={
                  <MainLayout>
                    <TeamOverview />
                  </MainLayout>
                } 
              />
          
              {/* Brand Management Routes */}
              <Route 
                path="/brands" 
                element={
                  <MainLayout>
                    <BrandManagement />
                  </MainLayout>
                } 
              />
              <Route 
                path="/brand/:brandId/products" 
                element={
                  <MainLayout>
                    <ProductManagement />
                  </MainLayout>
                } 
              />
              
              {/* Admin Routes */}
              <Route 
                path="/admin/visits" 
                element={
                  <MainLayout>
                    <AdminVisits />
                  </MainLayout>
                } 
              />
              
              {/* Manager Routes */}
              <Route 
                path="/manager/visits" 
                element={
                  <MainLayout>
                    <ManagerVisitLog />
                  </MainLayout>
                } 
              />
              
              {/* Utility/Demo Routes */}
              <Route 
                path="/solar-demo" 
                element={
                  <MainLayout>
                    <SolarDataExportDemo />
                  </MainLayout>
                } 
              />
              
              {/* Visit Routes */}
              <Route 
                path="/start-visit" 
                element={
                  <MainLayout>
                    <StartVisit />
                  </MainLayout>
                } 
              />
              <Route 
                path="/visit/new-shop" 
                element={
                  <MainLayout>
                    <NewShop />
                  </MainLayout>
                } 
              />
              <Route 
                path="/visit/individual" 
                element={
                  <MainLayout>
                    <IndividualVisit />
                  </MainLayout>
                } 
              />
              <Route 
                path="/visit/customer" 
                element={
                  <MainLayout>
                    <CustomerVisit />
                  </MainLayout>
                }
              />
              <Route
                path="/reports"
                element={
                  <MainLayout>
                    <Reports />
                  </MainLayout>
                }
              />
            </Route>
            
            {/* 404 Route */}
            <Route 
              path="*" 
              element={
                <MainLayout>
                  <NotFound />
                </MainLayout>
              }
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
