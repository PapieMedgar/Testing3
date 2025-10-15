import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Download,
  Eye,
  Calendar,
  Users,
  Building
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const Compliance = () => {
  const complianceReports = [
    {
      id: 1,
      type: "KYC Verification",
      region: "Gauteng",
      manager: "Sarah Johnson",
      status: "Compliant",
      lastAudit: "2024-08-10",
      nextAudit: "2024-11-10",
      score: 95,
      issues: 0
    },
    {
      id: 2,
      type: "RICA Compliance",
      region: "Western Cape",
      manager: "Michael Chen",
      status: "Compliant",
      lastAudit: "2024-08-05",
      nextAudit: "2024-11-05",
      score: 98,
      issues: 0
    },
    {
      id: 3,
      type: "Data Protection",
      region: "KwaZulu-Natal",
      manager: "Priya Patel",
      status: "Warning",
      lastAudit: "2024-07-28",
      nextAudit: "2024-10-28",
      score: 78,
      issues: 2
    },
    {
      id: 4,
      type: "Agent Training",
      region: "Eastern Cape",
      manager: "David Williams",
      status: "Non-Compliant",
      lastAudit: "2024-07-15",
      nextAudit: "2024-08-30",
      score: 65,
      issues: 5
    },
    {
      id: 5,
      type: "Visit Documentation",
      region: "Mpumalanga",
      manager: "Amanda Roberts",
      status: "Compliant",
      lastAudit: "2024-08-12",
      nextAudit: "2024-11-12",
      score: 92,
      issues: 1
    }
  ];

  const upcomingAudits = [
    {
      id: 1,
      type: "Quarterly KYC Review",
      region: "All Regions",
      date: "2024-08-25",
      auditor: "Compliance Team",
      priority: "High"
    },
    {
      id: 2,
      type: "Agent Certification Check",
      region: "Eastern Cape",
      date: "2024-08-30",
      auditor: "Regional Supervisor",
      priority: "Critical"
    },
    {
      id: 3,
      type: "Data Privacy Assessment",
      region: "Gauteng",
      date: "2024-09-05",
      auditor: "External Auditor",
      priority: "Medium"
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Compliant":
        return "bg-green-100 text-green-800";
      case "Warning":
        return "bg-yellow-100 text-yellow-800";
      case "Non-Compliant":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Compliant":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "Warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case "Non-Compliant":
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-100 text-red-800";
      case "High":
        return "bg-orange-100 text-orange-800";
      case "Medium":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const compliantCount = complianceReports.filter(r => r.status === "Compliant").length;
  const warningCount = complianceReports.filter(r => r.status === "Warning").length;
  const nonCompliantCount = complianceReports.filter(r => r.status === "Non-Compliant").length;
  const avgScore = Math.round(complianceReports.reduce((sum, r) => sum + r.score, 0) / complianceReports.length);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compliance</h1>
          <p className="text-muted-foreground">
            Monitor regulatory compliance and audit status
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <FileText className="w-4 h-4 mr-2" />
            New Audit
          </Button>
        </div>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{compliantCount}</div>
            <p className="text-xs text-muted-foreground">
              {Math.round((compliantCount / complianceReports.length) * 100)}% of audits
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{nonCompliantCount}</div>
            <p className="text-xs text-muted-foreground">Immediate action needed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Score</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgScore}%</div>
            <p className="text-xs text-muted-foreground">Overall compliance</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="reports" className="space-y-4">
        <TabsList>
          <TabsTrigger value="reports">Compliance Reports</TabsTrigger>
          <TabsTrigger value="audits">Upcoming Audits</TabsTrigger>
          <TabsTrigger value="policies">Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compliance Status by Region</CardTitle>
              <CardDescription>
                Current compliance status across all regions and audit types
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Audit Type</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Manager</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Issues</TableHead>
                    <TableHead>Last Audit</TableHead>
                    <TableHead>Next Audit</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {complianceReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.type}</TableCell>
                      <TableCell>{report.region}</TableCell>
                      <TableCell>{report.manager}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(report.status)}
                          <Badge className={getStatusColor(report.status)}>
                            {report.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={report.score >= 80 ? "text-green-600" : report.score >= 70 ? "text-yellow-600" : "text-red-600"}>
                          {report.score}%
                        </span>
                      </TableCell>
                      <TableCell>
                        {report.issues > 0 ? (
                          <span className="text-red-600">{report.issues} issues</span>
                        ) : (
                          <span className="text-green-600">No issues</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.lastAudit}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {report.nextAudit}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audits" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Audits</CardTitle>
              <CardDescription>
                Scheduled compliance audits and assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingAudits.map((audit) => (
                  <div key={audit.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <h3 className="font-medium">{audit.type}</h3>
                        <p className="text-sm text-muted-foreground">
                          {audit.region} • {audit.auditor}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{audit.date}</div>
                        <Badge className={getPriorityColor(audit.priority)}>
                          {audit.priority}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  KYC/RICA Policies
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Customer Identity Verification</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span>RICA Compliance Guidelines</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Data Retention Policy</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Agent Training
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Onboarding Checklist</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Certification Requirements</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Continuing Education</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Shop Operations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>Visit Documentation Standards</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Equipment Safety Guidelines</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
                <div className="flex justify-between items-center">
                  <span>Incident Reporting</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Regulatory Updates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>POPIA Amendments 2024</span>
                  <Badge variant="outline">New</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>ICASA Regulations Update</span>
                  <Badge variant="outline">Updated</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Consumer Protection Act</span>
                  <Button variant="outline" size="sm">View</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Compliance;
