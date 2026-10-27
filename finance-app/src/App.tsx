import { AppShell } from './components/layout/AppShell';
import { Header } from './components/layout/Header';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { ErrorBoundary } from './components/dashboard/ErrorBoundary';

export default function App() {
  return (
    <AppShell header={<Header />}>
      <ErrorBoundary>
        <DashboardPage />
      </ErrorBoundary>
    </AppShell>
  );
}
