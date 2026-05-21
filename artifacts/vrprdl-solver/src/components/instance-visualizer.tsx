import { VrprdlInstance } from "@workspace/api-client-react";

interface InstanceVisualizerProps {
  instance: VrprdlInstance | null;
  className?: string;
}

export function InstanceVisualizer({ instance, className = "" }: InstanceVisualizerProps) {
  if (!instance) {
    return (
      <div className={`flex items-center justify-center bg-muted/20 border border-dashed rounded-lg ${className}`}>
        <p className="text-muted-foreground text-sm font-mono">NO INSTANCE GENERATED</p>
      </div>
    );
  }

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

  const padding = 10;
  const width = maxX - minX + padding * 2;
  const height = maxY - minY + padding * 2;

  const scaleX = (x: number) => x - minX + padding;
  const scaleY = (y: number) => y - minY + padding;

  return (
    <div className={`bg-card border rounded-lg overflow-hidden ${className}`}>
      <svg 
        viewBox={`0 0 ${width || 100} ${height || 100}`} 
        className="w-full h-full"
        style={{ minHeight: "300px" }}
      >
        <rect width="100%" height="100%" fill="hsl(var(--background))" />
        
        {/* Draw customer connections */}
        {instance.customers.map(c => {
          if (c.locations.length < 2) return null;
          return (
            <g key={`conn-${c.customer_id}`}>
              {c.locations.map((l, i) => {
                if (i === 0) return null;
                const prev = c.locations[i - 1];
                return (
                  <line 
                    key={`l-${c.customer_id}-${i}`}
                    x1={scaleX(prev.x)} 
                    y1={scaleY(prev.y)} 
                    x2={scaleX(l.x)} 
                    y2={scaleY(l.y)} 
                    stroke="hsl(var(--muted-foreground))" 
                    strokeWidth={0.5}
                    strokeDasharray="1,1"
                    opacity={0.5}
                  />
                );
              })}
            </g>
          );
        })}

        {/* Draw locations */}
        {instance.customers.map(c => {
          // Color based on customer id
          const hue = (c.customer_id * 137.5) % 360;
          return (
            <g key={`cust-${c.customer_id}`}>
              {c.locations.map(l => (
                <circle 
                  key={`loc-${l.location_id}`}
                  cx={scaleX(l.x)} 
                  cy={scaleY(l.y)} 
                  r={l.type === 'primary' ? 1.5 : 1}
                  fill={`hsl(${hue}, 70%, 50%)`}
                  opacity={l.type === 'primary' ? 1 : 0.7}
                >
                  <title>Customer {c.customer_id} - Loc {l.location_id}</title>
                </circle>
              ))}
            </g>
          );
        })}

        {/* Draw Depot */}
        <polygon 
          points={`
            ${scaleX(instance.depot.x)},${scaleY(instance.depot.y) - 3} 
            ${scaleX(instance.depot.x) + 3},${scaleY(instance.depot.y)} 
            ${scaleX(instance.depot.x)},${scaleY(instance.depot.y) + 3} 
            ${scaleX(instance.depot.x) - 3},${scaleY(instance.depot.y)}
          `}
          fill="hsl(var(--destructive))"
        >
          <title>Depot</title>
        </polygon>
      </svg>
    </div>
  );
}
