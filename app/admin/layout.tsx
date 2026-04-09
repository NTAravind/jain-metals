import { AppSidebar } from "@/components/admin/app-sidebar"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/admin/theme-toggle"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-white dark:bg-zinc-950 transition-colors duration-300">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center gap-4 px-6 border-b border-black/5 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30">
            <SidebarTrigger className="-ml-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-md p-1.5 transition-colors" />
            <div className="h-4 w-px bg-black/10 dark:bg-white/10 shrink-0" />
            <div className="flex items-center gap-3 text-sm tracking-tight">
              <span className="font-bold text-black dark:text-white uppercase tracking-widest text-[10px]">Jain Metals</span>
              <span className="text-black/20 dark:text-white/20">/</span>
              <span className="text-black/50 dark:text-white/50 font-medium">Administration</span>
            </div>
          </header>

          <main className="flex-1 p-6 lg:p-8 overflow-auto max-w-[1600px] mx-auto w-full">
            {children}
          </main>
        </div>
      </div >
    </SidebarProvider >
  )
}
