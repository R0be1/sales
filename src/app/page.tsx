import {SidebarProvider} from '@/components/ui/sidebar';
import Dashboard from '@/components/dashboard';

export default function Home() {
  return (
    <SidebarProvider>
      <Dashboard />
    </SidebarProvider>
  );
}
