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
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { SalesLead } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { districts, branches, initialLeads } from '@/lib/data';

export default function DistrictAssignmentsPage() {
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

  const handleAssignBranch = (leadId: string, branchId: string) => {
    const updatedLeads = leads.map(lead => {
        if (lead.id === leadId) {
            const branch = branches.find(b => b.id === branchId);
            return {
                ...lead,
                branchId: branchId,
                status: 'Assigned',
                updates: [
                    ...lead.updates,
                    { text: `Assigned to ${branch?.name || 'branch'}.`, timestamp: new Date(), author: 'District Manager' }
                ]
            };
        }
        return lead;
    });
    setLeads(updatedLeads);
    localStorage.setItem('salesLeads', JSON.stringify(updatedLeads));
    toast({
        title: "Lead Assigned",
        description: "The lead has been assigned to the branch.",
    });
  };

  const filteredLeads = useMemo(() => leads.filter(lead => lead.districtId && !lead.branchId), [leads]);

  const getDistrictName = (districtId: string) => districts.find(d => d.id === districtId)?.name || 'N/A';

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
                    <Link href="/district-assignments"><SidebarMenuButton isActive><Icons.building className="mr-2" />District View</SidebarMenuButton></Link>
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
                <h1 className="text-lg font-semibold md:text-2xl">District Assignments</h1>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Assign Leads to Branches</CardTitle>
                    <CardDescription>
                      An overview of all unassigned leads in each district.
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
                        <TableHead>District</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead>Assign to Branch</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.title}</TableCell>
                            <TableCell>{getDistrictName(lead.districtId)}</TableCell>
                            <TableCell>{format(lead.createdAt, "PPP")}</TableCell>
                            <TableCell>{lead.deadline ? format(new Date(lead.deadline), "PPP") : 'N/A'}</TableCell>
                            <TableCell>
                                <Select onValueChange={(branchId) => handleAssignBranch(lead.id, branchId)}>
                                    <SelectTrigger className="w-[180px]">
                                        <SelectValue placeholder="Select a branch" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {branches
                                            .filter(b => b.districtId === lead.districtId)
                                            .map(branch => (
                                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                            ))
                                        }
                                    </SelectContent>
                                </Select>
                            </TableCell>
                        </TableRow>
                    ))}
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
