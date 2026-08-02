import { BottomNav } from "@/components/layout/bottom-nav";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-background flex min-h-dvh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 lg:pb-0">
        <TopBar />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
