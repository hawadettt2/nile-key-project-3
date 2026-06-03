'use client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/context/language-provider";
import Link from "next/link";
import { ArrowRight, BarChart, Globe, Trophy } from "lucide-react";

export function HomePage() {
    const { t } = useLanguage();

    return (
        <div className="flex flex-col gap-6">
            <Card className="flex min-h-[360px] w-full flex-col items-center justify-center p-6 text-center">
                <div className="max-w-3xl">
                    <h1 className="font-headline text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
                        {t.homeTitle}
                    </h1>
                    <p className="mt-4 text-lg md:text-xl text-muted-foreground">
                        {t.homeDescription}
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <Button size="lg" asChild>
                            <Link href="/dashboard">{t.sidebarDashboard} <ArrowRight className="ms-2 h-5 w-5" /></Link>
                        </Button>
                        <Button size="lg" variant="outline" asChild>
                            <Link href="/services">{t.sidebarServices}</Link>
                        </Button>
                    </div>
                </div>
            </Card>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
                        <div className="space-y-1">
                            <CardTitle>{t.stat1Title}</CardTitle>
                        </div>
                        <Trophy className="h-6 w-6 text-primary" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                         <p className="text-sm text-muted-foreground">{t.stat1Value}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
                        <div className="space-y-1">
                            <CardTitle>{t.stat2Title}</CardTitle>
                        </div>
                        <Globe className="h-6 w-6 text-primary" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                         <p className="text-sm text-muted-foreground">{t.stat2Value}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 p-4">
                        <div className="space-y-1">
                            <CardTitle>{t.stat3Title}</CardTitle>
                        </div>
                        <BarChart className="h-6 w-6 text-primary" />
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                         <p className="text-sm text-muted-foreground">{t.stat3Value}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
