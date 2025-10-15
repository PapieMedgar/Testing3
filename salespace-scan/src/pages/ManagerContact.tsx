import { useState, useEffect } from "react";
import { Phone, Mail, Building2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { agentAPI } from "@/lib/api";

interface Manager {
  id: string;
  name: string;
  email: string;
  phone: string;
  office: string;
}




const ManagerContact = () => {
  const { user } = useAuth();
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchManagerData = async () => {
      if (!user?.manager_id) {
        setLoading(false);
        return;
      }

      try {
        // In the real app, we should add a getMyManager endpoint to the API
        const managerData = await agentAPI.getMyManager();
        
        if (!managerData) {
          throw new Error('No manager assigned');
        }

        setManager({
          id: managerData.id.toString(),
          name: managerData.name || 'Unknown',
          email: managerData.phone, // Using phone as email since email is not available
          phone: managerData.phone,
          office: managerData.office || 'Regional Office'
        });
      } catch (error) {
        console.error('Error fetching manager data:', error);
        toast.error("Failed to load manager information. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchManagerData();
  }, [user?.manager_id]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="h-32 animate-pulse rounded-lg bg-muted" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-bold">Manager Contact Information</h2>
      
      {manager ? (
        <Card>
          <CardHeader>
            <CardTitle>My Manager</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">{manager.name}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <a 
                href={`mailto:${manager.email}`}
                className="text-primary hover:underline"
              >
                {manager.email}
              </a>
            </div>
            
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <a 
                href={`tel:${manager.phone}`}
                className="text-primary hover:underline"
              >
                {manager.phone}
              </a>
            </div>
            
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span>{manager.office}</span>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">No manager information available.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ManagerContact;
