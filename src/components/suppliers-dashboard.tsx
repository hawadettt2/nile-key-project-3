'use client';

import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Building2, Bot, Search, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useUser, useFirestore, useCollection } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { searchSuppliers, type SearchSuppliersInput, type SearchSuppliersOutput } from '@/ai/flows/search-suppliers';
import { useLanguage } from '@/context/language-provider';

export function SuppliersDashboard() {
  const { language, t } = useLanguage();

  type Station = { 
    id: string;
    name: string;
    address: string;
    activity: string;
    phone?: string;
    notes?: string;
  };

  const { toast } = useToast();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isSearching, setIsSearching] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchSuppliersOutput | null>(null);

  const suppliersQuery = useMemo(() => {
    if (!firestore) return null;
    const appId = 'nile-key-master';
    return query(collection(firestore, 'artifacts', appId, 'public', 'data', 'stations'), orderBy('name', 'asc'));
  }, [firestore]);

  const { data: suppliers, isLoading: isLoadingSuppliers } = useCollection<Station>(suppliersQuery);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults(null);
    try {
      const input: SearchSuppliersInput = { query: searchQuery };
      const result = await searchSuppliers(input);
      setSearchResults(result);
    } catch (error) {
      console.error('Failed to search suppliers:', error);
      toast({ variant: 'destructive', title: t.aiSearchFailTitle, description: t.aiSearchFailDescription });
    } finally {
      setIsSearching(false);
    }
  };

  if (isUserLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  if (!user) {
    return (
        <div className="flex h-full items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-semibold">{t.loginRequiredTitle}</h2>
            <p className="mt-2 text-muted-foreground">{t.loginRequiredDescription}</p>
            <Button asChild className="mt-4">
              <a href="/login">{t.sidebarLoginButton}</a>
            </Button>
          </div>
        </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Building2 className="h-6 w-6" /> {t.suppliersTitle}
          </CardTitle>
          <CardDescription>{t.suppliersDescription}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingSuppliers ? (
            <div className="flex h-40 items-center justify-center text-muted-foreground">
              <Loader2 className="mx-2 h-4 w-4 animate-spin" /> {t.loadingSuppliers}
            </div>
          ) : suppliers && suppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t.tableHeaderFarmName}</TableHead>
                  <TableHead>{t.tableHeaderAddress}</TableHead>
                  <TableHead>{t.tableHeaderActivity}</TableHead>
                  <TableHead>{t.tableHeaderContact}</TableHead>
                  <TableHead>{t.tableHeaderNotes}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {suppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.address}</TableCell>
                    <TableCell>{supplier.activity}</TableCell>
                    <TableCell>{supplier.phone || '-'}</TableCell>
                    <TableCell>{supplier.notes || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
              <Building2 className="h-12 w-12" />
              <h3 className="font-semibold">{t.noSuppliersTitle}</h3>
              <p className="max-w-xs text-sm">{t.noSuppliersDescription}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline flex items-center gap-2">
            <Bot className="h-6 w-6" /> {t.aiSupplierSearchTitle}
          </CardTitle>
          <CardDescription>{t.aiSupplierSearchDescription}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t.aiSearchSupplierPlaceholder}
              />
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? <Loader2 className="mx-2 h-4 w-4 animate-spin" /> : <Search className="mx-2 h-4 w-4" />}
                {t.aiSearchButton}
              </Button>
            </div>

            {(isSearching || searchResults) && (
            <div className="rounded-md border bg-background p-4">
              <h4 className="mb-2 font-semibold text-foreground">{t.resultsTitle}</h4>
              {isSearching ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p className="mx-4 text-muted-foreground">{t.geminiAnalyzing}</p>
                </div>
              ) : searchResults && searchResults.suppliers.length > 0 ? (
                <div className="space-y-4">
                  {searchResults.suppliers.map((supplier, index) => (
                    <div key={index} className="rounded-md border p-4">
                      <h5 className="font-bold">{supplier.farmName}</h5>
                      <p className="text-sm text-muted-foreground">{t.tableHeaderCropType}: {supplier.cropVarieties}</p>
                      <p className="text-sm text-muted-foreground">{t.tableHeaderLocation}: {supplier.location}</p>
                      <p className="text-sm text-muted-foreground">{t.tableHeaderContact}: {supplier.contactNumber}</p>
                      <a href={supplier.source} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline">{t.aiSource}</a>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">{t.aiNoResults}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
