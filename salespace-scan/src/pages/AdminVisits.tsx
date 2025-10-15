import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { adminAPI, User } from '@/lib/api';
import { AgentVisitHistory } from '@/components/visits/AgentVisitHistory';
import { AllVisitsTable } from '@/components/visits/AllVisitsTable';
import { ExportVisitData } from '@/components/visits/ExportVisitData';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, FileDown } from 'lucide-react';

const AdminVisits = () => {
  const [selectedAgent, setSelectedAgent] = useState<number | null>(null);
  const [showExport, setShowExport] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Check if user is admin
  useEffect(() => {
    if (user?.role !== 'ADMIN') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const { data: agents, isLoading: isLoadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: adminAPI.getAgents,
  });

  // If showing export interface, render that instead
  if (showExport) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Export Visit Data</h1>
          <Button variant="outline" onClick={() => setShowExport(false)}>
            Back to Agent Visits
          </Button>
        </div>
        <ExportVisitData />
      </div>
    );
  }

  // If an agent is selected, show their visit history
  if (selectedAgent) {
    const selectedAgentData = agents?.find(agent => agent.id === selectedAgent);
    
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">
            Visit History for {selectedAgentData?.name || `Agent #${selectedAgent}`}
          </h1>
          <Button variant="outline" onClick={() => setSelectedAgent(null)}>
            Back to All Agents
          </Button>
        </div>
        <AgentVisitHistory agentId={selectedAgent} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Agent Visits</h1>
        <Button onClick={() => setShowExport(true)}>
          <FileDown className="w-4 h-4 mr-2" />
          Export All Data
        </Button>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="all-visits">All Visits</TabsTrigger>
        </TabsList>
        
        <TabsContent value="agents" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingAgents ? (
              <div className="col-span-full flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              agents?.map((agent: User) => (
                <Card key={agent.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/50">
                    <CardTitle className="text-lg">{agent.name || `Agent ${agent.id}`}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground mb-4">
                      {agent.phone}
                      {agent.manager && (
                        <span className="block mt-1">
                          Manager: {agent.manager.name || agent.manager.phone}
                        </span>
                      )}
                    </p>
                    <Button 
                      onClick={() => setSelectedAgent(agent.id)}
                      className="w-full"
                    >
                      View Visit History
                    </Button>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="all-visits" className="mt-6">
          <AllVisitsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminVisits;
