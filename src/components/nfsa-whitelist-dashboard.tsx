'use client';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { useLanguage } from '@/context/language-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { AlertTriangle, BadgeCheck, Loader2, PlusCircle, Building2, Search, Info, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { nfsaSuppliersData, NfsaSupplier } from '@/lib/nfsa-data';
import { governorates } from '@/lib/governorates';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

export function NfsaWhitelistDashboard() {
  const { language, t } = useLanguage();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  const [nameFilter, setNameFilter] = useState('');
  const [addressFilter, setAddressFilter] = useState('');
  const [activityFilter, setActivityFilter] = useState('');
  const [governorateFilter, setGovernorateFilter] = useState('');

  const nfsaSuppliersQuery = useMemo(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'nfsaSuppliers'), orderBy('supplierName', 'asc'));
  }, [firestore, user]);

  const { data: userSuppliers, isLoading: isLoadingUserSuppliers } = useCollection<NfsaSupplier>(nfsaSuppliersQuery);

  const displayData = useMemo(() => {
    return userSuppliers && userSuppliers.length > 0 ? userSuppliers : nfsaSuppliersData;
  }, [userSuppliers]);

  const filteredSuppliers = useMemo(() => {
    return displayData.filter(s => {
      const nameMatch = s.supplierName.toLowerCase().includes(nameFilter.toLowerCase());
      const addressMatch = s.address.toLowerCase().includes(addressFilter.toLowerCase());
      const activityMatch = s.activityType.toLowerCase().includes(activityFilter.toLowerCase());
      const governorateMatch = governorateFilter === '' || (language === 'ar' ? s.governorate === governorateFilter : s.governorate === governorateFilter);
      return nameMatch && addressMatch && activityMatch && governorateMatch;
    });
  }, [displayData, nameFilter, addressFilter, activityFilter, governorateFilter, language]);
  
  if (isUserLoading) {
    return <div className="flex h-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
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
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BadgeCheck className="h-6 w-6 text-green-500" /> {t.nfsaWhitelistTitle}
        </CardTitle>
        <CardDescription>{t.nfsaWhitelistDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        <Alert className="mb-4 bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800">
            <Info className="h-4 w-4 !text-blue-500" />
            <AlertTitle className="text-blue-800 dark:text-blue-300">{t.dataSourceTitle}</AlertTitle>
            <AlertDescription className="text-blue-700 dark:text-blue-400">
                {t.dataSourceDescription}
                <Button asChild variant="link" className="p-0 h-auto mt-2 text-blue-700 dark:text-blue-400">
                  <a href="https://www.nfsa.gov.eg" target="_blank" rel="noopener noreferrer">
                    {t.nfsaOfficialSite}
                    <ExternalLink className="ms-2 h-4 w-4" />
                  </a>
                </Button>
            </AlertDescription>
        </Alert>
        <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-2 lg:grid-cols-5">
          <Input
            placeholder={t.filterByNamePlaceholder}
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="lg:col-span-1"
          />
          <Input
            placeholder={t.filterByAddressPlaceholder}
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="lg:col-span-1"
          />
           <Input
            placeholder={t.filterByActivityPlaceholder}
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
            className="lg:col-span-1"
          />
           <Select 
            value={governorateFilter} 
            onValueChange={(value) => setGovernorateFilter(value === 'all' ? '' : value)}
           >
            <SelectTrigger className="lg:col-span-1">
              <SelectValue placeholder={t.filterByGovernoratePlaceholder} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t.filterByGovernorateAll}</SelectItem>
              {governorates.map(gov => (
                <SelectItem key={gov.code} value={language === 'ar' ? gov.ar : gov.en}>
                  {language === 'ar' ? gov.ar : gov.en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button asChild className="lg:col-span-1">
            <Link href="/suppliers/whitelist/new">
              <PlusCircle className="me-2" />
              <span>{t.addNfsaSupplierButton}</span>
            </Link>
          </Button>
        </div>

        {isLoadingUserSuppliers ? (
          <div className="flex h-60 items-center justify-center text-muted-foreground">
            <Loader2 className="mx-2 h-4 w-4 animate-spin" /> {t.loadingSuppliers}
          </div>
        ) : filteredSuppliers.length > 0 ? (
          <div className="max-h-[60vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background">
                <TableRow>
                  <TableHead>{t.tableHeaderSupplierName}</TableHead>
                  <TableHead>{t.tableHeaderActivity}</TableHead>
                  <TableHead>{t.tableHeaderAddress}</TableHead>
                  <TableHead>{t.tableHeaderGovernorate}</TableHead>
                  <TableHead>{t.tableHeaderPhoneNumber}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier, index) => (
                    <TableRow key={supplier.id || index}>
                      <TableCell className="font-medium">{supplier.supplierName}</TableCell>
                      <TableCell>{supplier.activityType}</TableCell>
                      <TableCell>{supplier.address}</TableCell>
                      <TableCell>{supplier.governorate}</TableCell>
                      <TableCell>{supplier.phoneNumber || '-'}</TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
             <div className="flex h-60 flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <Search className="h-12 w-12" />
                <h3 className="font-semibold">{t.noFilterResultsTitle}</h3>
                <p className="max-w-xs text-sm">{t.noFilterResultsDescription}</p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
