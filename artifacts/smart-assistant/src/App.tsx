import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { AppProvider } from '@/context/AppContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Layout } from '@/components/Layout';

import Dashboard from '@/pages/Dashboard';
import Chat from '@/pages/Chat';
import Analyze from '@/pages/Analyze';
import Rewards from '@/pages/Rewards';
import Settings from '@/pages/Settings';
import Tasks from '@/pages/Tasks';
import GitHub from '@/pages/GitHub';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chat" component={Chat} />
        <Route path="/analyze" component={Analyze} />
        <Route path="/rewards" component={Rewards} />
        <Route path="/tasks" component={Tasks} />
        <Route path="/github" component={GitHub} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppProvider>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </QueryClientProvider>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
