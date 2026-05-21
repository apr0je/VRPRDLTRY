import { VrprdlInstance, SolverJob } from "@workspace/api-client-react";

interface RouteVisualizerProps {
  instance: VrprdlInstance | null;
  job: SolverJob | null;
  className?: string;
}

export function RouteVisualizer({ instance, job, className = "" }: RouteVisualizerProps) {
  if (!instance || !job?.result) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 border border-dashed rounded-lg ${className}`}>
        <p className="text-muted-foreground text-sm font-mono">NO ROUTE DATA</p>
      </div>
    );
  }

  const { assignments } = job.result;
  
  // Find min/max coordinates to scale the SVG
  let minX = instance.depot.x;
  let maxX = instance.depot.x;
  let minY = instance.depot.y;
  let maxY = instance.depot.y;

  instance.customers.forEach(c => {
    c.locations.forEach(l => {
      if (l.x < minX) minX = l.x;
      if (l.x > maxX) maxX = l.x;
      if (l.y < minY) minY = l.y;
      if (l.y > maxY) maxY = l.y;
    });
  });

  const padding = 15;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  const scaleX = (x: number) => x - minX + padding;
  const scaleY = (y: number) => y - minY + padding;

  return (
    <div className={`bg-card border rounded-lg overflow-hidden relative ${className}`}>
      <svg 
        viewBox={`0 0 ${width || 100} ${height || 100}`} 
        className="w-full h-full"
        style={{ minHeight: "400px" }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="hsl(var(--primary))" />
          </marker>
        </defs>

        <rect width="100%" height="100%" fill="hsl(var(--background))" />
        
        {/* Draw unvisited locations faded */}
        {instance.customers.map(c => {
          const visitedLocId = assignments.find(a => a.customer_id === c.customer_id)?.location_id;
          return (
            <g key={`unv-${c.customer_id}`}>
              {c.locations.filter(l => l.location_id !== visitedLocId).map(l => (
                <circle 
                  key={`loc-faded-${l.location_id}`}
                  cx={scaleX(l.x)} 
                  cy={scaleY(l.y)} 
                  r={1}
                  fill="hsl(var(--muted-foreground))"
                  opacity={0.3}
                />
              ))}
            </g>
          );
        })}

        {/* Draw Route Paths */}
        {(() => {
          const points = [
            { x: instance.depot.x, y: instance.depot.y },
            ...assignments.map(a => ({ x: a.x, y: a.y })),
            { x: instance.depot.x, y: instance.depot.y }
          ];

          return points.map((p, i) => {
            if (i === 0) return null;
            const prev = points[i - 1];
            return (
              <line 
                key={`route-${i}`}
                x1={scaleX(prev.x)} 
                y1={scaleY(prev.y)} 
                x2={scaleX(p.x)} 
                y2={scaleY(p.y)} 
                stroke="hsl(var(--primary))" 
                strokeWidth={0.8}
                markerEnd="url(#arrowhead)"
              />
            );
          });
        })()}

        {/* Draw visited locations */}
        {assignments.map((a, i) => {
          return (
            <g key={`vis-${a.location_id}`}>
              <circle 
                cx={scaleX(a.x)} 
                cy={scaleY(a.y)} 
                r={2.5}
                fill="hsl(var(--accent))"
                stroke="hsl(var(--background))"
                strokeWidth={0.5}
              >
                <title>Stop {i+1}: Cust {a.customer_id}</title>
              </circle>
              <text 
                x={scaleX(a.x)} 
                y={scaleY(a.y) - 3} 
                fontSize="3" 
                fill="hsl(var(--foreground))"
                textAnchor="middle"
                fontWeight="bold"
              >
                {i+1}
              </text>
            </g>
          );
        })}

        {/* Draw Depot */}
        <polygon 
          points={`
            ${scaleX(instance.depot.x)},${scaleY(instance.depot.y) - 4} 
            ${scaleX(instance.depot.x) + 4},${scaleY(instance.depot.y)} 
            ${scaleX(instance.depot.x)},${scaleY(instance.depot.y) + 4} 
            ${scaleX(instance.depot.x) - 4},${scaleY(instance.depot.y)}
          `}
          fill="hsl(var(--destructive))"
          stroke="hsl(var(--background))"
          strokeWidth={1}
        >
          <title>Depot</title>
        </polygon>
      </svg>
    </div>
  );
}
