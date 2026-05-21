import { useGetAlgorithmsInfo } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, GitCommit, ListTree, RefreshCw } from "lucide-react";

import tabuFlowchart from "@assets/TabuSearch_Flowchart_(1)_1779380947188.png";
import dpFlowchart from "@assets/DP_Flowchart_(1)_1779380947189.png";
import swapFlowchart from "@assets/Swap_Flowchart_1779380947188.png";
import insertFlowchart from "@assets/Insert_Flowchart_1779380947188.png";
import twoOptFlowchart from "@assets/2-opt_Flowchart_1779380947189.png";

export default function AlgorithmsRef() {
  const { data: info, isLoading } = useGetAlgorithmsInfo();

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!info) return null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center">
          <BookOpen className="w-8 h-8 mr-3 text-primary" />
          Algorithm Reference
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Detailed documentation on the metaheuristic algorithms driving the solver.
        </p>
      </div>

      <Tabs defaultValue="tabu" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="tabu" className="font-mono uppercase tracking-wider text-xs">Tabu Search</TabsTrigger>
          <TabsTrigger value="dp" className="font-mono uppercase tracking-wider text-xs">Dynamic Prog</TabsTrigger>
          <TabsTrigger value="neighborhood" className="font-mono uppercase tracking-wider text-xs">Operators</TabsTrigger>
        </TabsList>

        <TabsContent value="tabu" className="mt-6 space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">{info.tabu_search.name}</CardTitle>
              <CardDescription className="text-base">{info.tabu_search.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
              <div className="bg-card border rounded-lg p-2 overflow-hidden shadow-sm">
                <img src={tabuFlowchart} alt="Tabu Search Flowchart" className="w-full h-auto rounded" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ListTree className="w-5 h-5 mr-2" /> Pseudocode Steps
                </h3>
                <ScrollArea className="h-[400px] pr-4">
                  <ol className="space-y-4">
                    {info.tabu_search.steps.map((step, i) => (
                      <li key={i} className="flex bg-muted/40 p-3 rounded border border-border/50">
                        <span className="font-mono font-bold text-accent mr-3 min-w-[20px]">{i+1}.</span>
                        <span className="font-mono text-sm leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dp" className="mt-6 space-y-6 animate-in fade-in-50">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-primary">{info.dynamic_programming.name}</CardTitle>
              <CardDescription className="text-base">{info.dynamic_programming.description}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-8 items-start">
              <div className="bg-card border rounded-lg p-2 overflow-hidden shadow-sm">
                <img src={dpFlowchart} alt="DP Flowchart" className="w-full h-auto rounded" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <ListTree className="w-5 h-5 mr-2" /> Pseudocode Steps
                </h3>
                <ScrollArea className="h-[400px] pr-4">
                  <ol className="space-y-4">
                    {info.dynamic_programming.steps.map((step, i) => (
                      <li key={i} className="flex bg-muted/40 p-3 rounded border border-border/50">
                        <span className="font-mono font-bold text-accent mr-3 min-w-[20px]">{i+1}.</span>
                        <span className="font-mono text-sm leading-relaxed">{step}</span>
                      </li>
                    ))}
                  </ol>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="neighborhood" className="mt-6 space-y-6 animate-in fade-in-50">
          <div className="grid grid-cols-1 space-y-8">
            {info.neighborhood_operators.map((op, opIndex) => {
              
              let imgSrc = swapFlowchart;
              if (op.name.toLowerCase().includes('insert')) imgSrc = insertFlowchart;
              if (op.name.toLowerCase().includes('2-opt')) imgSrc = twoOptFlowchart;

              return (
                <Card key={opIndex}>
                  <CardHeader>
                    <CardTitle className="text-xl text-primary flex items-center">
                      <RefreshCw className="w-5 h-5 mr-2" />
                      {op.name}
                    </CardTitle>
                    <CardDescription>{op.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="bg-card border rounded-lg p-2 overflow-hidden shadow-sm">
                      <img src={imgSrc} alt={`${op.name} Flowchart`} className="w-full h-auto rounded" />
                    </div>
                    <div>
                      <ol className="space-y-3">
                        {op.steps.map((step, i) => (
                          <li key={i} className="flex items-start">
                            <span className="bg-primary/10 text-primary w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 shrink-0">{i+1}</span>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
