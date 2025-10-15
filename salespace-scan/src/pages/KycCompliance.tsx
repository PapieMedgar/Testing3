import { useState } from "react"
import { UserCheck, Shield, FileText, AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatCard } from "@/components/ui/stat-card"
import { useAuth } from "@/hooks/use-auth"

const KycCompliance = () => {
  const { user } = useAuth();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">KYC Compliance</h1>
          <p className="text-muted-foreground">Manage Know Your Customer compliance and documentation</p>
        </div>
      </div>

      {/* Coming Soon Message */}
      <Card>
        <CardContent className="p-12">
          <div className="text-center">
            <Shield className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-semibold mb-2">KYC Compliance Management</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              KYC compliance features are coming soon. This will allow you to manage customer verification and compliance documentation.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Customer identity verification</p>
              <p>• Document upload and management</p>
              <p>• Compliance status tracking</p>
              <p>• Regulatory reporting</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Placeholder */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard
          title="Total KYC"
          value="--"
          icon={UserCheck}
          description="Total verifications"
        />
        <StatCard
          title="Pending Review"
          value="--"
          icon={AlertTriangle}
          description="Awaiting verification"
        />
        <StatCard
          title="Approved"
          value="--"
          icon={Shield}
          description="Verified customers"
        />
        <StatCard
          title="Rejected"
          value="--"
          icon={FileText}
          description="Failed verification"
        />
      </div>

      {/* Feature Placeholders */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5" />
              Customer Verification
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <UserCheck className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Verify customer identity</p>
              <p className="text-xs text-muted-foreground mt-1">
                Identity verification system coming soon
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Document Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
              <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-muted-foreground">Manage compliance documents</p>
              <p className="text-xs text-muted-foreground mt-1">
                Document management system coming soon
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
              Once implemented, you'll be able to capture customer information, 
              upload ID documents, and complete KYC verification processes during visits.
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
              As a manager, you'll be able to review KYC submissions from your agents, 
              approve or reject verifications, and monitor compliance rates across your team.
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
              As an admin, you'll have access to comprehensive compliance reports, 
              regulatory oversight tools, and the ability to manage KYC policies across the organization.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default KycCompliance;