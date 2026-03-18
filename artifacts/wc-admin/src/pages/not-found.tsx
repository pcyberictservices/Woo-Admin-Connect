import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center p-8 text-center space-y-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full blur-3xl bg-primary/20" />
        <AlertCircle className="h-24 w-24 text-primary relative z-10" />
      </div>
      <div className="space-y-2">
        <h1 className="text-4xl font-bold tracking-tight text-white">Page Not Found</h1>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Button asChild size="lg" className="bg-primary text-primary-foreground shadow-lg shadow-primary/20">
        <Link href="/">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
