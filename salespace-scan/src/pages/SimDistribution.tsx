import { useState } from "react"
import { Smartphone, Scan, Package, Users, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatCard } from "@/components/ui/stat-card"
import { useAuth } from "@/hooks/use-auth"

const SimDistribution = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">SIM Distribution</h1>
          <p className="text-muted-foreground">Manage SIM card inventory and distribution</p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Smartphone className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">SIM Distribution Management</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              SIM distribution features are coming soon. This will allow you to manage SIM card inventory and track distributions.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Track SIM card inventory</p>
              <p>• Scan and distribute SIM cards</p>
              <p>• Monitor stock levels</p>
              <p>• Generate distribution reports</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Placeholder */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total SIMs"
          value="--"
          icon={Package}
          description="Total SIM inventory"
        />
        <StatCard
          title="Distributed"
          value="--"
          icon={Users}
          description="SIMs distributed"
        />
        <StatCard
          title="Remaining"
          value="--"
          icon={Smartphone}
          description="SIMs available"
        />
        <StatCard
          title="Low Stock"
          value="--"
          icon={AlertTriangle}
          description="Items running low"
        />
      </div>

      {/* Feature Placeholders */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scan className="w-5 h-5" />
              Barcode Scanner
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <Scan className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Scan SIM card barcodes</p>
              <p className="text-xs text-muted-foreground mt-1">
                Barcode scanning will be integrated
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5" />
              Inventory Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <Package className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Manage inventory levels</p>
              <p className="text-xs text-muted-foreground mt-1">
                Real-time inventory tracking coming soon
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
              Once implemented, you'll be able to scan SIM card barcodes, track distributions, 
              and manage your assigned SIM card inventory from this page.
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
              As a manager, you'll be able to monitor SIM card distributions across your team, 
              manage inventory allocations, and track distribution performance.
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
              As an admin, you'll have comprehensive oversight of all SIM card inventory, 
              distribution analytics, and the ability to manage stock levels across all locations.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SimDistribution;