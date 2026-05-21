import { useAppContext } from "@/lib/context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RouteVisualizer } from "@/components/route-visualizer";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { ArrowLeft, Route } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ResultsView() {
  const { currentInstance, currentJob } = useAppContext();
  const [, setLocation] = useLocation();

  if (!currentInstance || !currentJob?.result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-4">
        <Route className="w-16 h-16 text-muted-foreground opacity-20" />
        <h2 className="text-xl font-semibold">No Results Available</h2>
        <p className="text-muted-foreground">You need to run the solver first to view results.</p>
        <Button onClick={() => setLocation("/solver")}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Go to Solver
        </Button>
      </div>
    );
  }

  const { result } = currentJob;
  const { assignments } = result;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Optimal Route</h1>
          <p className="text-muted-foreground mt-1">Delivery sequence and location selection</p>
        </div>
        <div className="flex items-center gap-4 text-sm font-mono bg-primary/10 text-primary px-4 py-2 rounded-md border border-primary/20">
          <span>Cost: {result.best_cost.toFixed(2)}</span>
          <span className="w-px h-4 bg-primary/30"></span>
          <span>Time: {result.runtime_ms}ms</span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Route Map</CardTitle>
            <CardDescription>Geographic representation of the optimal path</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 p-0 px-6 pb-6">
            <RouteVisualizer 
              instance={currentInstance} 
              job={currentJob} 
              className="h-full min-h-[500px]" 
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Delivery Assignments</CardTitle>
            <CardDescription>Chronological delivery schedule</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto max-h-[600px] p-0">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10 shadow-sm">
                <TableRow>
                  <TableHead className="w-16 text-center">Stop</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Location ID</TableHead>
                  <TableHead className="text-right">Time</TableHead>
                  <TableHead className="text-right">Coords (X,Y)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow className="bg-destructive/5 hover:bg-destructive/10">
                  <TableCell className="text-center font-bold">0</TableCell>
                  <TableCell className="font-semibold">Depot</TableCell>
                  <TableCell className="font-mono text-muted-foreground">
                    {currentInstance.depot.location_id}
                  </TableCell>
                  <TableCell className="text-right font-mono">0.00</TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">
                    ({currentInstance.depot.x.toFixed(1)}, {currentInstance.depot.y.toFixed(1)})
                  </TableCell>
                </TableRow>
                {assignments.map((assignment, index) => (
                  <TableRow key={`${assignment.customer_id}-${assignment.location_id}`} data-testid={`row-assignment-${index}`}>
                    <TableCell className="text-center font-bold">{index + 1}</TableCell>
                    <TableCell>Customer {assignment.customer_id}</TableCell>
                    <TableCell className="font-mono text-muted-foreground">
                      {assignment.location_id}
                    </TableCell>
                    <TableCell className="text-right font-mono text-accent">
                      {assignment.arrival_time.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      ({assignment.x.toFixed(1)}, {assignment.y.toFixed(1)})
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-destructive/5 hover:bg-destructive/10">
                  <TableCell className="text-center font-bold">{assignments.length + 1}</TableCell>
                  <TableCell className="font-semibold">Depot Return</TableCell>
                  <TableCell className="font-mono text-muted-foreground">-</TableCell>
                  <TableCell className="text-right font-mono text-primary font-bold">
                    {result.best_cost.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-muted-foreground">-</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
