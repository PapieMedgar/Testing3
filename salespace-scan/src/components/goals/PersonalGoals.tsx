import { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award, Target } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { goalAPI } from "@/lib/api";

interface PersonalGoalsProps {
  userId: number;
}

export function PersonalGoals({ userId }: PersonalGoalsProps) {
  const { data: goals, refetch } = useQuery({
    queryKey: ['personal-goals', userId],
    queryFn: () => goalAPI.getPersonalGoals(userId),
  });

  useEffect(() => {
    // Refresh goals when the component mounts
    refetch();
  }, [refetch]);

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 80) return 'bg-blue-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStatusBadge = (goal: any) => {
    const progress = (goal.current_value / goal.target_value) * 100;
    if (progress >= 100) {
      return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
    }
    if (new Date(goal.end_date) < new Date()) {
      return <Badge className="bg-red-100 text-red-800">Overdue</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="w-5 h-5" />
          My Goals
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!goals || goals.length === 0 ? (
          <div className="text-center py-8">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No active goals</h3>
            <p className="text-muted-foreground">
              You don't have any assigned goals yet
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal: any) => (
              <div key={goal.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{goal.title}</h4>
                  {getStatusBadge(goal)}
                </div>
                {goal.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {goal.description}
                  </p>
                )}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress: {goal.current_value} / {goal.target_value}</span>
                    <span>{Math.round((goal.current_value / goal.target_value) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getProgressColor((goal.current_value / goal.target_value) * 100)
                      }`}
                      style={{ 
                        width: `${Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))}%` 
                      }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground mt-2">
                    <span>{goal.recurring_type !== 'none' && `${goal.recurring_type} goal`}</span>
                    <span>Due: {new Date(goal.end_date).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
