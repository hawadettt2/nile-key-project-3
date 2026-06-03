import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { SearchX, Leaf } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
        <div className="flex items-center gap-2 mb-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary">
                <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
            <span className="font-headline text-3xl font-semibold">
                Nile Key
            </span>
        </div>
      <SearchX className="h-24 w-24 stroke-1 text-muted-foreground" />
      <h1 className="mt-6 font-headline text-6xl font-bold">404</h1>
      <p className="mt-4 text-lg text-muted-foreground" dir="ltr">
        Sorry, the page you are looking for does not exist.
      </p>
       <p className="mt-2 text-lg text-muted-foreground" dir="rtl">
        عفواً، الصفحة التي تبحث عنها غير موجودة.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Go back to Homepage / العودة للصفحة الرئيسية</Link>
      </Button>
    </div>
  );
}
