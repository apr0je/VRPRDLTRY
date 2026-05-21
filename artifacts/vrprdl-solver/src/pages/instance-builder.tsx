import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useGenerateInstance } from "@workspace/api-client-react";
import { useAppContext } from "@/lib/context";
import { useLocation } from "wouter";

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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { InstanceVisualizer } from "@/components/instance-visualizer";
import { Loader2, ArrowRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  instanceType: z.enum(["general", "realistic"]),
  nCustomers: z.coerce.number().min(5).max(60),
  seed: z.coerce.number().optional(),
  vehicleCapacity: z.coerce.number().optional(),
  planningHorizon: z.coerce.number().optional(),
});

export default function InstanceBuilder() {
  const { currentInstance, setCurrentInstance } = useAppContext();
  const generateMutation = useGenerateInstance();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instanceType: "general",
      nCustomers: 15,
      seed: 42,
      vehicleCapacity: 100,
      planningHorizon: 12,
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    generateMutation.mutate(
      { data: values },
      {
        onSuccess: (instance) => {
          setCurrentInstance(instance);
          toast({
            title: "Instance Generated",
            description: `Successfully created ${instance.metadata.n_customers} customer instance.`,
          });
        },
        onError: (err) => {
          toast({
            title: "Generation Failed",
            description: String(err),
            variant: "destructive"
          });
        }
      }
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Instance Builder</h1>
          <p className="text-muted-foreground mt-1">Configure and generate VRPRDL benchmark instances</p>
        </div>
        {currentInstance && (
          <Button onClick={() => setLocation("/solver")} data-testid="btn-proceed-solver">
            Proceed to Solver
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-primary/20">
          <CardHeader>
            <CardTitle>Configuration</CardTitle>
            <CardDescription>Set generation parameters</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="instanceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instance Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-instance-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="general">General</SelectItem>
                          <SelectItem value="realistic">Realistic</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nCustomers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Customers (5-60)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-n-customers" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="seed"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>RNG Seed</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-seed" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vehicleCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity</FormLabel>
                        <FormControl>
                          <Input type="number" {...field} data-testid="input-capacity" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="planningHorizon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planning Horizon</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-horizon" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full mt-2" 
                  disabled={generateMutation.isPending}
                  data-testid="btn-generate"
                >
                  {generateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Instance
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Visualization</CardTitle>
            <CardDescription>Spatial distribution of roaming locations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <InstanceVisualizer instance={currentInstance} className="h-[400px]" />
            
            {currentInstance && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Customers</p>
                  <p className="text-2xl font-mono text-foreground">{currentInstance.metadata.n_customers}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Locations</p>
                  <p className="text-2xl font-mono text-foreground">{currentInstance.metadata.total_locations}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Total Demand</p>
                  <p className="text-2xl font-mono text-foreground">{currentInstance.metadata.total_demand}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-semibold">Capacity</p>
                  <p className="text-2xl font-mono text-foreground">{currentInstance.metadata.vehicle_capacity}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
