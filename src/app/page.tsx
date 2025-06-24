
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { SalesLead } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { districts, branches, initialLeads } from '@/lib/data';
import { Progress } from '@/components/ui/progress';

export default function OfficerDashboard() {
  const [leads, setLeads] = useState<SalesLead[]>([]);

  useEffect(() => {
    const storedLeadsJSON = localStorage.getItem('salesLeads');
    let leadsData: SalesLead[];
    if (storedLeadsJSON) {
        leadsData = JSON.parse(storedLeadsJSON).map((lead: any) => ({
            ...lead,
            createdAt: new Date(lead.createdAt),
            deadline: lead.deadline ? new Date(lead.deadline) : new Date(new Date().setDate(new Date().getDate() + 7)),
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
  
  const getStatusBadgeVariant = (status: SalesLead['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'New': return 'default';
      case 'Assigned': return 'secondary';
      case 'Reopened': return 'secondary';
      case 'In Progress': return 'outline';
      case 'Pending Closure': return 'destructive';
      case 'Pending District Approval': return 'destructive';
      case 'Closed': return 'default';
      default: return 'secondary';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }
  
  const getAssigneeInfo = (lead: SalesLead) => {
      const district = districts.find(d => d.id === lead.districtId);
      const branch = lead.branchId ? branches.find(b => b.id === lead.branchId) : undefined;
      const officer = branch && lead.officerId ? branch.officers.find(o => o.id === lead.officerId) : undefined;
      return { district, branch, officer };
  }

  const filteredLeads = useMemo(() => leads.filter(lead => !!lead.officerId), [leads]);

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
                    <Link href="/dashboard"><SidebarMenuButton><Icons.dashboard className="mr-2" />Dashboard</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/"><SidebarMenuButton isActive><Icons.clipboardList className="mr-2" />My Assignments</SidebarMenuButton></Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/district-assignments"><SidebarMenuButton><Icons.building className="mr-2" />District View</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/branch-assignments"><SidebarMenuButton><Icons.building2 className="mr-2" />Branch View</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/offsite-reports"><SidebarMenuButton><Icons.alertTriangle className="mr-2" />Off-site Reports</SidebarMenuButton></Link>
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
                <h1 className="text-lg font-semibold md:text-2xl">My Assignments</h1>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Manage Your Leads</CardTitle>
                    <CardDescription>
                      An overview of all leads assigned to you.
                    </CardDescription>
                </div>
                <Link href="/new-lead">
                  <Button><Icons.plusCircle className="mr-2 h-4 w-4" /> Create New Lead</Button>
                </Link>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Lead Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden md:table-cell">Assigned To</TableHead>
                        <TableHead>Savings Progress</TableHead>
                        <TableHead className="hidden lg:table-cell">Location</TableHead>
                        <TableHead className="hidden lg:table-cell">Created At</TableHead>
                        <TableHead className="hidden md:table-cell">Deadline</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredLeads.map((lead) => {
                        const { officer, branch, district } = getAssigneeInfo(lead);
                        const totalGeneratedSavings = lead.updates.reduce((acc, update) => acc + (update.generatedSavings || 0), 0);
                        const achievementPercentage = lead.expectedSavings > 0 ? Math.min(100, (totalGeneratedSavings / lead.expectedSavings) * 100) : 0;
                        return (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.title}</TableCell>
                                <TableCell><Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge></TableCell>
                                <TableCell className="hidden md:table-cell">{officer?.name || 'N/A'}, {branch?.name || 'N/A'}, {district?.name || 'N/A'}</TableCell>
                                <TableCell>
                                    <div className="font-medium">{formatCurrency(lead.expectedSavings)} <span className="text-xs text-muted-foreground">Target</span></div>
                                    <Progress value={achievementPercentage} className="mt-1 h-2" />
                                    <div className="text-xs text-muted-foreground">{achievementPercentage.toFixed(0)}% achieved</div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${lead.location.lat},${lead.location.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                        <Icons.mapPin className="h-4 w-4" /> View Map
                                    </a>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell">{format(lead.createdAt, "PPP")}</TableCell>
                                <TableCell className="hidden md:table-cell">{lead.deadline ? format(new Date(lead.deadline), "PPP") : 'N/A'}</TableCell>
                                <TableCell>
                                    <Link href={`/assignments/${lead.id}`}>
                                        <Button variant="outline" size="sm">Details</Button>
                                    </Link>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    </TableBody>
                </Table>
                </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
