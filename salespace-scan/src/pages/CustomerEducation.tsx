import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, Video, FileText, Download, Eye } from "lucide-react";

const CustomerEducation = () => {
  const educationMaterials = [
    {
      id: 1,
      title: "Network Coverage Guide",
      type: "PDF Document",
      description: "Comprehensive guide about network coverage areas and quality",
      category: "Technical",
      downloads: 245,
      icon: FileText
    },
    {
      id: 2,
      title: "Data Plan Comparison",
      type: "Interactive Guide",
      description: "Compare different data plans and find the best fit",
      category: "Plans",
      downloads: 189,
      icon: BookOpen
    },
    {
      id: 3,
      title: "SIM Setup Tutorial",
      type: "Video",
      description: "Step-by-step video guide for SIM card activation",
      category: "Setup",
      downloads: 312,
      icon: Video
    },
    {
      id: 4,
      title: "Troubleshooting Guide",
      type: "PDF Document",
      description: "Common issues and solutions for customers",
      category: "Support",
      downloads: 156,
      icon: FileText
    },
    {
      id: 5,
      title: "Roaming Information",
      type: "Brochure",
      description: "International roaming rates and policies",
      category: "International",
      downloads: 98,
      icon: BookOpen
    },
    {
      id: 6,
      title: "Device Compatibility",
      type: "Interactive Tool",
      description: "Check device compatibility with our network",
      category: "Technical",
      downloads: 223,
      icon: BookOpen
    }
  ];

  const categories = ["All", "Technical", "Plans", "Setup", "Support", "International"];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customer Education</h1>
          <p className="text-muted-foreground">
            Educational materials and resources for customer support
          </p>
        </div>
        <Button>
          <BookOpen className="w-4 h-4 mr-2" />
          Add Material
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">+3 this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,223</div>
            <p className="text-xs text-muted-foreground">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">89</div>
            <p className="text-xs text-muted-foreground">+12 this week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Popular</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">SIM Setup</div>
            <p className="text-xs text-muted-foreground">312 downloads</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {categories.map((category) => (
          <Button
            key={category}
            variant={category === "All" ? "default" : "outline"}
            size="sm"
          >
            {category}
          </Button>
        ))}
      </div>

      {/* Materials Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {educationMaterials.map((material) => (
          <Card key={material.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <material.icon className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-lg">{material.title}</CardTitle>
                    <CardDescription>{material.type}</CardDescription>
                  </div>
                </div>
                <Badge variant="secondary">{material.category}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                {material.description}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Download className="h-3 w-3" />
                  {material.downloads} downloads
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm">
                    <Download className="w-3 h-3 mr-1" />
                    Share
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CustomerEducation;
