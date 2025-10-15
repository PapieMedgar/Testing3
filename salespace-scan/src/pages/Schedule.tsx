import { useState } from "react"
import { Calendar, MapPin, Clock, User, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"

const Schedule = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Schedule</h1>
          <p className="text-muted-foreground">Manage your visit schedule and assignments</p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Schedule Management</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Schedule management features are coming soon. This will allow you to view and manage visit assignments.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• View daily and weekly schedules</p>
              <p>• Manage visit assignments</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Current Date Display */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Today's Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">Selected Date: {new Date(selectedDate).toLocaleDateString()}</span>
            </div>
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">No scheduled visits for today</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Role-specific Info */}
      {/* {user?.role === 'AGENT' && (
        <Card>
          <CardHeader>
            <CardTitle>For Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Once implemented, you'll be able to view your assigned visits, check schedules, 
              and update visit status from this page.
            </p>
          </CardContent>
        </Card>
      )} */}

      {user?.role === 'MANAGER' && (
        <Card>
          <CardHeader>
            <CardTitle>For Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As a manager, you'll be able to assign visits to your agents, monitor schedules, 
              and track team performance from this page.
            </p>
          </CardContent>
        </Card>
      )}

      {user?.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>For Administrators</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As an admin, you'll have oversight of all schedules across teams, 
              ability to reassign visits, and manage scheduling conflicts.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Schedule;