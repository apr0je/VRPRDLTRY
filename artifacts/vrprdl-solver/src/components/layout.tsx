import { Link, useLocation } from "wouter";
import { 
  Calculator, 
  Map, 
  Activity,
  BookOpen,
  Route
} from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Instance Builder", icon: Map },
    { href: "/solver", label: "Solver", icon: Calculator },
    { href: "/results", label: "Results", icon: Route },
    { href: "/algorithms", label: "Algorithms", icon: BookOpen },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      <aside className="w-full md:w-64 border-r border-border bg-card flex flex-col shrink-0">
        <div className="p-6 border-b border-border flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center text-primary-foreground">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">VRPRDL</h1>
            <p className="text-xs text-muted-foreground font-mono">OPTIMIZATION WORKBENCH</p>
          </div>
        </div>
        
        <nav className="p-4 flex flex-col gap-2 flex-grow">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-border mt-auto">
          <p className="text-xs text-muted-foreground font-mono text-center">
            v1.0.0-rc1
          </p>
        </div>
      </aside>
      <main className="flex-1 overflow-auto bg-background">
        {children}
      </main>
    </div>
  );
}
