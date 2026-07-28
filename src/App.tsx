import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import Ferramentas from "./pages/Ferramentas";
import FerramentaLP from "./pages/FerramentaLP";
import Talentos from "./pages/Talentos";
import VagaDetalhe from "./pages/VagaDetalhe";
import Artigos from "./pages/Artigos";
import ArtigoDetalhe from "./pages/ArtigoDetalhe";
import Contato from "./pages/Contato";
import NotFound from "./pages/NotFound";
import ResetPassword from "./pages/ResetPassword";
import AdminLogin from "./pages/admin/AdminLogin";
import ForgotPassword from "./pages/admin/ForgotPassword";
import AdminDashboard from "./pages/admin/AdminDashboard";
import PostsList from "./pages/admin/PostsList";
import PostEditor from "./pages/admin/PostEditor";
import JobsList from "./pages/admin/JobsList";
import JobEditor from "./pages/admin/JobEditor";
import ArticlesList from "./pages/admin/ArticlesList";
import ArticleEditor from "./pages/admin/ArticleEditor";
import AuditPage from "./pages/admin/AuditPage";
import LeadsList from "./pages/admin/LeadsList";
import ApplicationsList from "./pages/admin/ApplicationsList";
import AccountsList from "./pages/admin/AccountsList";
import AdminLayout from "./components/admin/AdminLayout";
import RequireAdmin from "./components/admin/RequireAdmin";
import { ThemeProvider } from "./hooks/use-theme";
import { AuthProvider } from "./hooks/use-auth";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/ferramentas" element={<Ferramentas />} />
              <Route path="/ferramentas/:slug" element={<FerramentaLP />} />
              <Route path="/talentos" element={<Talentos />} />
              <Route path="/talentos/:id" element={<VagaDetalhe />} />
              <Route path="/artigos" element={<Artigos />} />
              <Route path="/artigos/:slug" element={<ArtigoDetalhe />} />
              <Route path="/contato" element={<Contato />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/forgot-password" element={<ForgotPassword />} />
              <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
                <Route index element={<AdminDashboard />} />
                <Route path="posts" element={<PostsList />} />
                <Route path="posts/new" element={<PostEditor />} />
                <Route path="posts/:id/edit" element={<PostEditor />} />
                <Route path="jobs" element={<JobsList />} />
                <Route path="jobs/new" element={<JobEditor />} />
                <Route path="jobs/:id/edit" element={<JobEditor />} />
                <Route path="articles" element={<ArticlesList />} />
                <Route path="articles/new" element={<ArticleEditor />} />
                <Route path="articles/:id/edit" element={<ArticleEditor />} />
                <Route path="audit" element={<AuditPage />} />
                <Route path="leads" element={<LeadsList />} />
                <Route path="applications" element={<ApplicationsList />} />
                <Route path="accounts" element={<AccountsList />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
