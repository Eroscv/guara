import { Suspense, lazy } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import AdminLayout from "./components/admin/AdminLayout";
import RequireAdmin from "./components/admin/RequireAdmin";
import { ThemeProvider } from "./hooks/use-theme";
import { AuthProvider } from "./hooks/use-auth";

// Home carrega ansiosamente (é a rota de entrada pública mais comum).
import Index from "./pages/Index";

// Demais páginas públicas e todo o admin carregam sob demanda — evita que a
// Home puxe dependências pesadas usadas só no admin (recharts, jspdf, tiptap).
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Ferramentas = lazy(() => import("./pages/Ferramentas"));
const FerramentaLP = lazy(() => import("./pages/FerramentaLP"));
const Talentos = lazy(() => import("./pages/Talentos"));
const VagaDetalhe = lazy(() => import("./pages/VagaDetalhe"));
const Artigos = lazy(() => import("./pages/Artigos"));
const ArtigoDetalhe = lazy(() => import("./pages/ArtigoDetalhe"));
const Contato = lazy(() => import("./pages/Contato"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const ForgotPassword = lazy(() => import("./pages/admin/ForgotPassword"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const PostsList = lazy(() => import("./pages/admin/PostsList"));
const PostEditor = lazy(() => import("./pages/admin/PostEditor"));
const JobsList = lazy(() => import("./pages/admin/JobsList"));
const JobEditor = lazy(() => import("./pages/admin/JobEditor"));
const ArticlesList = lazy(() => import("./pages/admin/ArticlesList"));
const ArticleEditor = lazy(() => import("./pages/admin/ArticleEditor"));
const AuditPage = lazy(() => import("./pages/admin/AuditPage"));
const LeadsList = lazy(() => import("./pages/admin/LeadsList"));
const ApplicationsList = lazy(() => import("./pages/admin/ApplicationsList"));
const AccountsList = lazy(() => import("./pages/admin/AccountsList"));

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

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Suspense fallback={<RouteFallback />}>
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
            </Suspense>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
