import { lazy, Suspense, Component } from "react";
import type { ReactNode } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SkeletonPage } from "@/components/ui/Skeleton";

// Contexts
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { ToastProvider } from "@/context/ToastContext";
import { SimpleModeProvider } from "@/context/SimpleModeContext";
import { DateFilterProvider } from "@/context/DateFilterContext";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { SmoothScrollProvider } from "@/components/SmoothScrollProvider";
// Lazy-loaded pages
const Landing          = lazy(() => import("@/pages/Landing").then(m => ({ default: m.Landing })));
const Login            = lazy(() => import("@/pages/Login").then(m => ({ default: m.Login })));
const Signup           = lazy(() => import("@/pages/Signup").then(m => ({ default: m.Signup })));
const Onboarding       = lazy(() => import("@/pages/Onboarding").then(m => ({ default: m.Onboarding })));
const Dashboard        = lazy(() => import("@/pages/Dashboard").then(m => ({ default: m.Dashboard })));
const Bookings         = lazy(() => import("@/pages/Bookings").then(m => ({ default: m.Bookings })));
const Clients          = lazy(() => import("@/pages/Clients").then(m => ({ default: m.Clients })));
const ClientProfile    = lazy(() => import("@/pages/ClientProfile").then(m => ({ default: m.ClientProfile })));
const Inventory        = lazy(() => import("@/pages/Inventory").then(m => ({ default: m.Inventory })));
const Invoices         = lazy(() => import("@/pages/Invoices").then(m => ({ default: m.Invoices })));
const InvoiceDetail    = lazy(() => import("@/pages/InvoiceDetail").then(m => ({ default: m.InvoiceDetail })));
const PublicInvoice    = lazy(() => import("@/pages/PublicInvoice").then(m => ({ default: m.PublicInvoice })));
const Settings         = lazy(() => import("@/pages/Settings").then(m => ({ default: m.Settings })));
const Tasks            = lazy(() => import("@/pages/Tasks").then(m => ({ default: m.Tasks })));
const PublicPage       = lazy(() => import("@/pages/PublicPage").then(m => ({ default: m.PublicPage })));
const PublicPageEditor = lazy(() => import("@/pages/PublicPageEditor").then(m => ({ default: m.PublicPageEditor })));
const NotFound         = lazy(() => import("@/pages/not-found"));

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, retry: 1 } }
});

class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-background p-8 text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-foreground mb-2">Something went wrong</h1>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">{this.state.error.message}</p>
          <button onClick={() => { this.setState({ error: null }); window.location.reload(); }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:bg-primary/90">
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function PageLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { user, token, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  if (isLoading) return <PageLoader />;
  if (!token || !user) { setLocation("/login"); return null; }
  return <Component />;
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
        <Route path="/"         component={Landing} />
        <Route path="/login"    component={Login}   />
        <Route path="/signup"   component={Signup}  />

        <Route path="/onboarding">  <ProtectedRoute component={Onboarding}      /></Route>
        <Route path="/dashboard">   <ProtectedRoute component={Dashboard}        /></Route>
        <Route path="/bookings">    <ProtectedRoute component={Bookings}         /></Route>
        <Route path="/clients">     <ProtectedRoute component={Clients}          /></Route>
        <Route path="/clients/:id"> <ProtectedRoute component={ClientProfile}    /></Route>
        <Route path="/tasks">       <ProtectedRoute component={Tasks}            /></Route>
        <Route path="/settings">    <ProtectedRoute component={Settings}         /></Route>
        <Route path="/public-page"> <ProtectedRoute component={PublicPageEditor} /></Route>
        <Route path="/invoices">    <ProtectedRoute component={Invoices}         /></Route>
        <Route path="/invoices/:id"><ProtectedRoute component={InvoiceDetail}    /></Route>
        <Route path="/inventory">   <ProtectedRoute component={Inventory}        /></Route>

        <Route path="/p/:slug"            component={PublicPage}    />
        <Route path="/invoice/public/:id" component={PublicInvoice} />

        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <SmoothScrollProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <SimpleModeProvider>
              <DateFilterProvider>
                <AuthProvider>
                  <NotificationsProvider>
                    <TooltipProvider>
                      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                        <Router />
                      </WouterRouter>
                    </TooltipProvider>
                  </NotificationsProvider>
                </AuthProvider>
              </DateFilterProvider>
            </SimpleModeProvider>
          </ToastProvider>
        </QueryClientProvider>
      </SmoothScrollProvider>
    </ErrorBoundary>
  );
}

export default App;
