
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (!error) {
        // Check if the user is an admin
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', (await supabase.auth.getUser()).data.user?.id)
          .single();
        
        if (profileError) {
          toast({
            title: "Error",
            description: "Could not verify admin privileges",
            variant: "destructive",
          });
          // Sign out if not an admin
          await supabase.auth.signOut();
          setIsLoading(false);
          return;
        }
        
        if (profile?.role === 'admin') {
          toast({
            title: "Login successful",
            description: "Welcome to the admin panel",
          });
          navigate('/admin/dashboard');
        } else {
          toast({
            title: "Access denied",
            description: "You do not have admin privileges",
            variant: "destructive",
          });
          // Sign out if not an admin
          await supabase.auth.signOut();
        }
      }
    } catch (error: any) {
      toast({
        title: "Login error",
        description: error.message || "An error occurred during login",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto flex items-center justify-center min-h-[calc(100vh-200px)] px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 bg-red-600 text-white p-3 rounded-md inline-flex">
            <Shield className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">TheraLink Admin</h1>
          <p className="text-muted-foreground mt-2">Sign in to access admin controls</p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Admin Sign In</CardTitle>
            <CardDescription>
              This page is restricted to TheraLink administrators
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="admin@theralink.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={isLoading}
              >
                {isLoading ? "Signing In..." : "Sign In as Administrator"}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center text-sm text-muted-foreground">
            <p>For authorized personnel only</p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default AdminLogin;
