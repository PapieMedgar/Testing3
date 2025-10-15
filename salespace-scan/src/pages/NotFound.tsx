import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center space-y-6">
        <div className="relative">
          <FileQuestion className="w-24 h-24 text-muted-foreground mx-auto mb-4 animate-pulse" />
          <div className="absolute -right-2 -top-2 w-12 h-12 rounded-full bg-background border-2 flex items-center justify-center">
            <span className="text-xl font-bold">?</span>
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">404</h1>
          <p className="text-xl text-muted-foreground">Oops! Page not found</p>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>
        <div className="space-x-4">
          <Button 
            onClick={() => navigate(-1)} 
            variant="outline"
          >
            Go Back
          </Button>
          <Button 
            onClick={() => navigate('/')}
            className="brand-gradient text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
