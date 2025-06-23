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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import type { SalesLead } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { branches, initialLeads } from '@/lib/data';

export default function BranchAssignmentsPage() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const { toast } = useToast();

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

  const handleAssignOfficer = (leadId: string, officerId: string) => {
    const updatedLeads = leads.map(lead => {
        if (lead.id === leadId) {
            const branch = branches.find(b => b.id === lead.branchId);
            const officer = branch?.officers.find(o => o.id === officerId);
            return {
                ...lead,
                officerId: officerId,
                status: 'In Progress',
                updates: [
                    ...lead.updates,
                    { text: `Assigned to officer ${officer?.name || 'N/A'}.`, timestamp: new Date(), author: 'Branch Manager' }
                ]
            };
        }
        return lead;
    });
    setLeads(updatedLeads);
    localStorage.setItem('salesLeads', JSON.stringify(updatedLeads));
    toast({
        title: "Lead Assigned",
        description: "The lead has been assigned to an officer.",
    });
  };

  const filteredLeads = useMemo(() => leads.filter(lead => lead.branchId && !lead.officerId), [leads]);

  const getBranchInfo = (branchId?: string) => {
    if (!branchId) return { branchName: 'N/A', officers: [] };
    const branch = branches.find(b => b.id === branchId);
    return {
      branchName: branch?.name || 'N/A',
      officers: branch?.officers || []
    };
  }

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
                    <Link href="/"><SidebarMenuButton><Icons.clipboardList className="mr-2" />My Assignments</SidebarMenuButton></Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/district-assignments"><SidebarMenuButton><Icons.building className="mr-2" />District View</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/branch-assignments"><SidebarMenuButton isActive><Icons.building2 className="mr-2" />Branch View</SidebarMenuButton></Link>
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
                <h1 className="text-lg font-semibold md:text-2xl">Branch Assignments</h1>
            </div>
            <Card>
                <CardHeader>
                <div>
                    <CardTitle>Assign Leads to Officers</CardTitle>
                    <CardDescription>
                      An overview of all unassigned leads in each branch.
                    </CardDescription>
                </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>Lead Title</TableHead>
                        <TableHead>Branch</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Assign to Officer</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredLeads.map((lead) => {
                        const { branchName, officers } = getBranchInfo(lead.branchId);
                        return (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.title}</TableCell>
                                <TableCell>{branchName}</TableCell>
                                <TableCell>{format(lead.createdAt, "PPP")}</TableCell>
                                <TableCell>{lead.deadline ? format(new Date(lead.deadline), "PPP") : 'N/A'}</TableCell>
                                <TableCell>
                                    <Select onValueChange={(officerId) => handleAssignOfficer(lead.id, officerId)}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Select an officer" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {officers.map(officer => (
                                                <SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    </TableBody>
                </Table>
                {filteredLeads.length === 0 && (
                    <div className="text-center p-8 text-muted-foreground">
                        No new leads to assign.
                    </div>
                )}
                </CardContent>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
