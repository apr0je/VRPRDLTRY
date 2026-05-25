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

const DUCK_POSITIONS = [
  { top: "6%",  left: "8%",  size: "2.8rem", rot: -20 },
  { top: "14%", left: "62%", size: "2.2rem", rot:  15 },
  { top: "23%", left: "31%", size: "3.2rem", rot: -10 },
  { top: "33%", left: "78%", size: "2rem",   rot:  30 },
  { top: "41%", left: "18%", size: "2.6rem", rot: -35 },
  { top: "52%", left: "88%", size: "3rem",   rot:   8 },
  { top: "58%", left: "45%", size: "2.4rem", rot: -25 },
  { top: "67%", left: "5%",  size: "2rem",   rot:  20 },
  { top: "73%", left: "70%", size: "3.4rem", rot: -12 },
  { top: "81%", left: "27%", size: "2.2rem", rot:  35 },
  { top: "88%", left: "55%", size: "2.8rem", rot: -18 },
  { top: "93%", left: "83%", size: "2rem",   rot:  22 },
  { top: "4%",  left: "44%", size: "2.4rem", rot: -28 },
  { top: "47%", left: "58%", size: "2rem",   rot:  16 },
  { top: "76%", left: "92%", size: "2.6rem", rot:  -8 },
  { top: "19%", left: "91%", size: "2.2rem", rot:  28 },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();

  const navItems = [
    { href: "/",           label: "Instance Builder", icon: Map        },
    { href: "/solver",     label: "Solver",           icon: Calculator },
    { href: "/results",    label: "Results",          icon: Route      },
    { href: "/algorithms", label: "Algorithms",       icon: BookOpen   },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row" style={{ background: "#e3f2fd", fontFamily: "'Comic Neue', cursive" }}>
      {/* Sidebar */}
      <aside
        className="w-full md:w-72 text-white flex flex-col shrink-0 md:my-4 md:ml-4 md:rounded-r-[3rem] z-10"
        style={{
          background: "#1a237e",
          border: "4px solid #0d1660",
          boxShadow: "5px 5px 0px 0px rgba(13,22,96,0.5)",
        }}
      >
        {/* Logo */}
        <div className="p-6 pb-4 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ background: "#FF8C00", border: "3px solid white", boxShadow: "2px 2px 0 rgba(0,0,0,0.3)" }}
          >
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1
              className="font-black text-xl leading-tight tracking-widest text-white"
              style={{ textShadow: "2px 2px 0 #FF8C00" }}
            >
              VRPRDL ⚓
            </h1>
            <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: "#ff6b6b" }}>
              Optimization Workbench
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav className="p-4 flex flex-col gap-3 flex-grow">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-5 py-3 rounded-3xl text-base font-black transition-all",
                  isActive ? "text-white" : "text-white/75 hover:text-white hover:bg-white/10"
                )}
                style={isActive ? {
                  background: "#FF8C00",
                  border: "3px solid white",
                  boxShadow: "3px 3px 0px 0px rgba(0,0,0,0.3)",
                } : {
                  border: "3px solid transparent",
                }}
                data-testid={`nav-${item.label.toLowerCase().replace(/ /g, "-")}`}
              >
                <Icon className={cn("w-5 h-5 shrink-0", isActive ? "text-white" : "text-[#FF8C00]")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/20 mt-auto">
          <p className="text-xs text-white/40 font-black text-center tracking-widest">
            v1.0.0-rc1
          </p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto relative" style={{ background: "#e3f2fd" }}>
        {/* Duck watermark layer */}
        <div
          className="absolute inset-0 pointer-events-none select-none overflow-hidden"
          aria-hidden="true"
          style={{ zIndex: 0 }}
        >
          {DUCK_POSITIONS.map((d, i) => (
            <span
              key={i}
              className="absolute"
              style={{
                top: d.top,
                left: d.left,
                fontSize: d.size,
                transform: `rotate(${d.rot}deg)`,
                opacity: 0.07,
              }}
            >
              🦆
            </span>
          ))}
        </div>

        {/* Page content above ducks */}
        <div className="relative" style={{ zIndex: 1 }}>
          {children}
        </div>
      </main>
    </div>
  );
}
