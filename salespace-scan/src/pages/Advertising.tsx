import { useState } from "react"
import { Camera, Upload, BarChart3, Target, Image, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

const Advertising = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Advertising</h1>
          <p className="text-muted-foreground">Manage advertising boards and brand presence</p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Target className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">Advertising Management</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Advertising management features are coming soon. This will allow you to manage brand presence and advertising boards.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Upload and manage advertising materials</p>
              <p>• Track brand presence across locations</p>
              <p>• Monitor advertising board placements</p>
              <p>• Generate advertising reports</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feature Placeholders */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Photo Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Upload advertising photos</p>
              <p className="text-xs text-muted-foreground mt-1">
                Feature will be integrated with backend API
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Brand Analytics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Track brand performance</p>
              <p className="text-xs text-muted-foreground mt-1">
                Analytics dashboard coming soon
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Role-specific Info */}
      {user?.role === 'AGENT' && (
        <Card>
          <CardHeader>
            <CardTitle>For Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Once implemented, you'll be able to upload photos of advertising boards, 
              track brand placements, and report on advertising activities at each location.
            </p>
          </CardContent>
        </Card>
      )}

      {user?.role === 'MANAGER' && (
        <Card>
          <CardHeader>
            <CardTitle>For Managers</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              As a manager, you'll be able to review advertising materials uploaded by your agents, 
              monitor brand compliance, and generate advertising reports for your territory.
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
              As an admin, you'll have access to comprehensive advertising analytics, 
              brand performance metrics across all locations, and the ability to manage advertising policies.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Advertising;