import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Droplet, Heart, Loader2, Users } from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

export default function LoginPage() {
  const { login, isLoggingIn } = useInternetIdentity();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel - branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Droplet className="w-5 h-5 text-white fill-white" />
          </div>
          <span className="text-2xl font-bold text-white">BloodLink</span>
        </div>
        <div className="space-y-6">
          <h1 className="text-4xl font-bold text-white leading-snug">
            Managing Blood Banks,
            <br />
            Saving Lives
          </h1>
          <p className="text-white/80 text-lg">
            A comprehensive platform for blood bank management — from donor
            tracking to inventory control.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {[
              {
                icon: Users,
                label: "Donor Tracking",
                desc: "Manage and monitor active donors",
              },
              {
                icon: Heart,
                label: "Inventory Control",
                desc: "Real-time blood stock monitoring",
              },
            ].map((item) => (
              <div key={item.label} className="bg-white/10 rounded-xl p-4">
                <item.icon className="w-6 h-6 text-white mb-2" />
                <div className="font-semibold text-white text-sm">
                  {item.label}
                </div>
                <div className="text-white/70 text-xs mt-0.5">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="text-white/50 text-sm">
          © {new Date().getFullYear()} BloodLink. All rights reserved.
        </p>
      </div>

      {/* Right panel - login form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 justify-center">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Droplet className="w-5 h-5 text-white fill-white" />
            </div>
            <span className="text-2xl font-bold text-foreground">
              BloodLink
            </span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-foreground">Welcome back</h2>
            <p className="text-muted-foreground mt-2">
              Sign in to access the blood bank management system
            </p>
          </div>

          <Card className="shadow-card border-border">
            <CardContent className="pt-6 pb-8 px-8 space-y-6">
              <div className="flex flex-col items-center gap-2 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Droplet className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Use your Internet Identity to securely access BloodLink
                </p>
              </div>

              <Button
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11"
                onClick={login}
                disabled={isLoggingIn}
                data-ocid="login.primary_button"
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Connecting...
                  </>
                ) : (
                  "Sign In with Internet Identity"
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                Your identity is protected by the Internet Computer’s
                decentralized authentication system.
              </p>
            </CardContent>
          </Card>

          <div className="flex flex-wrap gap-4 justify-center text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              Secure &amp; Decentralized
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              HIPAA-Aligned
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
              24/7 Availability
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
