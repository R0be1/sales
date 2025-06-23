'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Icons } from '@/components/icons';
import type { SalesLead } from '@/lib/types';
import { initialLeads, districts } from '@/lib/data';
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export default function DashboardPage() {
  const [leads, setLeads] = useState<SalesLead[]>([]);

  useEffect(() => {
    const storedLeadsJSON = localStorage.getItem('salesLeads');
    let leadsData: SalesLead[];
    if (storedLeadsJSON) {
      leadsData = JSON.parse(storedLeadsJSON).map((lead: any) => ({
        ...lead,
        createdAt: new Date(lead.createdAt),
        deadline: lead.deadline ? new Date(lead.deadline) : null,
        updates: (lead.updates || []).map((update: any) => ({
          ...update,
          timestamp: new Date(update.timestamp),
        })),
      }));
    } else {
      leadsData = initialLeads;
      localStorage.setItem('salesLeads', JSON.stringify(initialLeads));
    }
    setLeads(leadsData);
  }, []);

  const dashboardStats = useMemo(() => {
    const totalLeads = leads.length;
    const totalExpectedSavings = leads.reduce((acc, lead) => acc + lead.expectedSavings, 0);
    const totalGeneratedSavings = leads.reduce((acc, lead) => {
        const leadSavings = lead.updates.reduce((s, u) => s + (u.generatedSavings || 0), 0);
        return acc + leadSavings;
    }, 0);
    const overallAchievement = totalExpectedSavings > 0 ? (totalGeneratedSavings / totalExpectedSavings) * 100 : 0;
    const closedLeads = leads.filter(l => l.status === 'Closed').length;
    const successRate = totalLeads > 0 ? (closedLeads / totalLeads) * 100 : 0;

    const leadsByStatus = leads.reduce((acc, lead) => {
        acc[lead.status] = (acc[lead.status] || 0) + 1;
        return acc;
    }, {} as Record<SalesLead['status'], number>);
    
    const statusChartData = Object.entries(leadsByStatus).map(([status, count]) => ({ status, count }));

    const performanceByDistrict = districts.map(district => {
        const districtLeads = leads.filter(l => l.districtId === district.id);
        const expected = districtLeads.reduce((acc, lead) => acc + lead.expectedSavings, 0);
        const generated = districtLeads.reduce((acc, lead) => acc + lead.updates.reduce((s, u) => s + (u.generatedSavings || 0), 0), 0);
        return {
            name: district.name,
            expected,
            generated,
        }
    });

    return {
      totalLeads,
      totalExpectedSavings,
      totalGeneratedSavings,
      overallAchievement,
      successRate,
      statusChartData,
      performanceByDistrict,
    };
  }, [leads]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };
  
  const chartConfig = {
    expected: {
      label: 'Expected Savings',
      color: 'hsl(var(--chart-1))',
    },
    generated: {
      label: 'Generated Savings',
      color: 'hsl(var(--chart-2))',
    },
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <div className="flex items-center gap-2 p-2">
            <Icons.workflow className="w-6 h-6 text-primary" />
            <h2 className="font-semibold text-lg">SalesFlow</h2>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarMenu>
            <SidebarMenuItem>
                <Link href="/dashboard"><SidebarMenuButton isActive><Icons.dashboard className="mr-2" />Dashboard</SidebarMenuButton></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/"><SidebarMenuButton><Icons.clipboardList className="mr-2" />My Assignments</SidebarMenuButton></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/district-assignments"><SidebarMenuButton><Icons.building className="mr-2" />District View</SidebarMenuButton></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <Link href="/branch-assignments"><SidebarMenuButton><Icons.building2 className="mr-2" />Branch View</SidebarMenuButton></Link>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton><Icons.settings className="mr-2" />Settings</SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
              <h1 className="text-lg font-semibold md:text-2xl">Sales Dashboard</h1>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
                        <Icons.clipboardList className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.totalLeads}</div>
                        <p className="text-xs text-muted-foreground">All active and closed leads</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Expected Savings</CardTitle>
                        <Icons.dollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalExpectedSavings)}</div>
                        <p className="text-xs text-muted-foreground">Planned savings from all leads</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Generated Savings</CardTitle>
                        <Icons.checkCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{formatCurrency(dashboardStats.totalGeneratedSavings)}</div>
                        <p className="text-xs text-muted-foreground">Actual savings collected so far</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Achievement Rate</CardTitle>
                        <Icons.target className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{dashboardStats.overallAchievement.toFixed(1)}%</div>
                        <p className="text-xs text-muted-foreground">Generated vs. Expected savings</p>
                    </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Leads by Status</CardTitle>
                        <CardDescription>Distribution of leads across their current statuses.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={{count: {label: 'Count', color: 'hsl(var(--chart-1))'}}} className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardStats.statusChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="status" tickLine={false} axisLine={false} />
                                    <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="count" fill="var(--color-count)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Performance by District</CardTitle>
                        <CardDescription>Expected vs. Generated savings for each district.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig} className="h-[300px] w-full">
                             <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardStats.performanceByDistrict}>
                                    <CartesianGrid vertical={false} />
                                    <XAxis dataKey="name" tickLine={false} axisLine={false} />
                                    <YAxis />
                                    <Tooltip content={<ChartTooltipContent />} />
                                    <Legend />
                                    <Bar dataKey="expected" fill="var(--color-expected)" radius={4} />
                                    <Bar dataKey="generated" fill="var(--color-generated)" radius={4} />
                                </BarChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
