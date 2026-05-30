
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle>Access restricted</CardTitle>
          <CardDescription>
            Your account does not have permission to view this section or its current status prevents access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link href="/">Return home</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
