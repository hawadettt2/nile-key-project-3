'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldX, LogOut, RefreshCw } from 'lucide-react';
import { useLanguage } from '@/context/language-provider';
import { supabase } from '@/supabase/client';
import { useRouter } from 'next/navigation';

export default function UnauthorizedPage() {
  const { t } = useLanguage();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="flex items-center gap-2 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive">
          <ShieldX className="h-6 w-6 text-destructive-foreground" />
        </div>
        <span className="font-headline text-2xl font-semibold text-destructive">
          Access Denied
        </span>
      </div>

      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-headline text-center">
            Account Status Issue
          </CardTitle>
          <CardDescription className="text-center">
            Your account access has been restricted. Please contact support or try again.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted p-4 text-center">
            <p className="text-sm text-muted-foreground">
              Possible reasons:
            </p>
            <ul className="mt-2 text-sm text-muted-foreground space-y-1">
              <li>• Account is pending verification</li>
              <li>• Account has been suspended</li>
              <li>• Account has been rejected</li>
              <li>• WhatsApp number not verified</li>
            </ul>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleRefresh}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Need help? Contact us at:<br />
              <a href="mailto:support@nilekey.com" className="text-primary hover:underline">
                support@nilekey.com
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
