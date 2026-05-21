import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useRunSolver, useListSolverJobs, SolverJob } from "@workspace/api-client-react";
import { useAppContext } from "@/lib/context";
import { useLocation } from "wouter";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowRight, Play, History, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

const solverSchema = z.object({
  maxIter: z.coerce.number().min(10).max(2000),
  tabuTenure: z.coerce.number().min(5).max(100),
  maxNoImprove: z.coerce.number().min(10).max(500),
});

export default function SolverDashboard() {
  const { currentInstance, currentJob, setCurrentJob } = useAppContext();
  const runMutation = useRunSolver();
  const { data: jobs, isLoading: isLoadingJobs } = useListSolverJobs();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof solverSchema>>({
    resolver: zodResolver(solverSchema),
    defaultValues: {
      maxIter: 100,
      tabuTenure: 20,
      maxNoImprove: 30,
    },
  });

  function onSubmit(values: z.infer<typeof solverSchema>) {
    if (!currentInstance) {
      toast({ title: "No instance", description: "Please generate an instance first", variant: "destructive" });
      return;
    }

    runMutation.mutate(
      { data: { instance: currentInstance, config: values } },
      {
        onSuccess: (job) => {
          setCurrentJob(job);
          toast({
            title: "Solver Completed",
            description: `Ran in ${job.result?.runtime_ms}ms`,
          });
        },
        onError: (err) => {
          toast({ title: "Solver Failed", description: String(err), variant: "destructive" });
        }
      }
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Solver Dashboard</h1>
          <p className="text-muted-foreground mt-1">Run Tabu Search optimization algorithm</p>
        </div>
        {currentJob?.result && (
          <Button onClick={() => setLocation("/results")} data-testid="btn-view-results" variant="secondary">
            View Optimal Route
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle>Algorithm Config</CardTitle>
              <CardDescription>Tabu Search Parameters</CardDescription>
            </CardHeader>
            <CardContent>
              {!currentInstance ? (
                <div className="text-center py-6">
                  <p className="text-muted-foreground text-sm mb-4">No instance selected.</p>
                  <Button onClick={() => setLocation("/")} variant="outline" size="sm">
                    Go to Builder
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="maxIter"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Iterations</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-max-iter" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tabuTenure"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tabu Tenure</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-tabu-tenure" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxNoImprove"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max No Improve</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} data-testid="input-max-no-improve" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button 
                      type="submit" 
                      className="w-full mt-4" 
                      disabled={runMutation.isPending}
                      data-testid="btn-run-solver"
                    >
                      {runMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4 mr-2" />
                      )}
                      Execute Run
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center">
                <History className="w-4 h-4 mr-2 text-muted-foreground" />
                Previous Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingJobs ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : jobs && jobs.length > 0 ? (
                <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
                  {jobs.map((job) => (
                    <div 
                      key={job.job_id} 
                      className="flex justify-between items-center p-2 rounded border bg-card hover:bg-accent/10 cursor-pointer text-sm"
                      onClick={() => setCurrentJob(job)}
                      data-testid={`job-${job.job_id}`}
                    >
                      <div>
                        <p className="font-mono font-medium">{job.job_id.substring(0,8)}...</p>
                        <p className="text-xs text-muted-foreground">
                          {job.instance_summary?.n_customers} cust
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant={job.status === 'completed' ? 'secondary' : 'outline'}>
                          {job.status}
                        </Badge>
                        {job.result && (
                          <p className="text-xs font-mono mt-1 text-primary">
                            {job.result.best_cost.toFixed(2)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No previous jobs.</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="h-full">
            <CardHeader>
              <CardTitle>Convergence Analysis</CardTitle>
              <CardDescription>Objective function value over iterations</CardDescription>
            </CardHeader>
            <CardContent>
              {runMutation.isPending ? (
                <div className="h-[400px] flex flex-col items-center justify-center space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground font-mono animate-pulse">OPTIMIZING...</p>
                </div>
              ) : !currentJob?.result ? (
                <div className="h-[400px] flex items-center justify-center border border-dashed rounded-md bg-muted/10">
                  <p className="text-sm text-muted-foreground">Run the solver to view convergence.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={currentJob.result.convergence_history}
                        margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                        <XAxis 
                          dataKey="iteration" 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis 
                          stroke="hsl(var(--muted-foreground))"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          domain={['auto', 'auto']}
                        />
                        <Tooltip 
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                          labelStyle={{ color: 'hsl(var(--foreground))' }}
                        />
                        <Legend wrapperStyle={{ fontSize: '12px' }} />
                        <Line 
                          type="monotone" 
                          dataKey="cost" 
                          name="Current Cost"
                          stroke="hsl(var(--accent))" 
                          dot={false}
                          strokeWidth={1}
                          opacity={0.5}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="best_cost" 
                          name="Best Cost"
                          stroke="hsl(var(--primary))" 
                          dot={false}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Best Cost</p>
                      <p className="text-2xl font-mono text-foreground">
                        {currentJob.result.best_cost.toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Improvement</p>
                      <p className="text-2xl font-mono text-green-500">
                        {currentJob.result.improvement_pct.toFixed(1)}%
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Iterations</p>
                      <p className="text-2xl font-mono text-foreground">
                        {currentJob.result.iterations_run}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase font-semibold">Runtime</p>
                      <p className="text-2xl font-mono text-foreground">
                        {currentJob.result.runtime_ms}ms
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
