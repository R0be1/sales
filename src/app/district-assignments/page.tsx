
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
  CardFooter
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import type { SalesLead } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { districts, branches, initialLeads } from '@/lib/data';

export default function DistrictAssignmentsPage() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const { toast } = useToast();
  const [isReworkDialogOpen, setIsReworkDialogOpen] = useState(false);
  const [reworkNote, setReworkNote] = useState('');
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [pendingAssignments, setPendingAssignments] = useState<Record<string, string>>({});

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

  const updateLeadStatus = (leadId: string, status: SalesLead['status'], note?: string) => {
    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        const branchId = status === 'Assigned' ? (pendingAssignments[leadId] || lead.branchId) : lead.branchId;
        const newUpdate = {
          text: note ? `Returned for rework: ${note}` : `Status changed to ${status}`,
          timestamp: new Date(),
          author: 'District Manager'
        };
        return {
          ...lead,
          status: status,
          branchId: branchId,
          updates: [...lead.updates, newUpdate]
        };
      }
      return lead;
    });
    setLeads(updatedLeads);
    localStorage.setItem('salesLeads', JSON.stringify(updatedLeads));
  };
  
  const handleBranchSelection = (leadId: string, branchId: string) => {
    setPendingAssignments(prev => ({
      ...prev,
      [leadId]: branchId,
    }));
  };

  const handleAssignBranch = (leadId: string, branchId: string) => {
    const branch = branches.find(b => b.id === branchId);
    updateLeadStatus(leadId, 'Assigned', `Assigned to ${branch?.name || 'branch'}.`);
    
    setPendingAssignments(prev => {
      const newState = { ...prev };
      delete newState[leadId];
      return newState;
    });

    toast({
        title: "Lead Assigned",
        description: "The lead has been assigned to the branch.",
    });
  };

  const handleApproveAndClose = (leadId: string) => {
    updateLeadStatus(leadId, 'Closed', 'Lead approved and closed by District Manager.');
    toast({ title: "Lead Closed", description: "The lead has been successfully closed." });
  };

  const openReworkDialog = (lead: SalesLead) => {
    setSelectedLead(lead);
    setReworkNote('');
    setIsReworkDialogOpen(true);
  };

  const handleConfirmRework = () => {
    if (selectedLead && reworkNote) {
      updateLeadStatus(selectedLead.id, 'Reopened', reworkNote);
      toast({ title: "Lead Returned", description: "The lead has been returned for rework." });
      setIsReworkDialogOpen(false);
    } else {
        toast({ title: "Note Required", description: "Please provide a reason for returning the lead.", variant: "destructive" });
    }
  };

  const unassignedLeads = useMemo(() => leads.filter(lead => lead.districtId && !lead.branchId), [leads]);
  const pendingApprovalLeads = useMemo(() => leads.filter(lead => lead.status === 'Pending District Approval'), [leads]);

  const getDistrictName = (districtId: string) => districts.find(d => d.id === districtId)?.name || 'N/A';
  const getLeadAssigneeInfo = (lead: SalesLead) => {
    const branch = branches.find(b => b.id === lead.branchId);
    const officer = branch?.officers.find(o => o.id === lead.officerId);
    return { branchName: branch?.name || 'N/A', officerName: officer?.name || 'N/A' };
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
                    <Link href="/dashboard"><SidebarMenuButton><Icons.dashboard className="mr-2" />Dashboard</SidebarMenuButton></Link>
                </SidebarMenuItem>
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
                    <Link href="/offsite-reports"><SidebarMenuButton><Icons.alertTriangle className="mr-2" />Off-site Reports</SidebarMenuButton></Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/settings"><SidebarMenuButton><Icons.settings className="mr-2" />Settings</SidebarMenuButton></Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center">
                <h1 className="text-lg font-semibold md:text-2xl">District View</h1>
            </div>
            
            <div className="grid gap-6">
                <Card>
                    <CardHeader className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
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
                            <TableHead className="hidden md:table-cell">District</TableHead>
                            <TableHead className="hidden md:table-cell">Created At</TableHead>
                            <TableHead className="hidden lg:table-cell">Deadline</TableHead>
                            <TableHead>Assign to Branch</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {unassignedLeads.map((lead) => (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.title}</TableCell>
                                <TableCell className="hidden md:table-cell">{getDistrictName(lead.districtId)}</TableCell>
                                <TableCell className="hidden md:table-cell">{format(lead.createdAt, "PPP")}</TableCell>
                                <TableCell className="hidden lg:table-cell">{lead.deadline ? format(new Date(lead.deadline), "PPP") : 'N/A'}</TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <Select
                                            value={pendingAssignments[lead.id] || ''}
                                            onValueChange={(branchId) => handleBranchSelection(lead.id, branchId)}
                                        >
                                            <SelectTrigger className="w-full sm:w-[180px]">
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
                                        {pendingAssignments[lead.id] && (
                                            <Button size="sm" onClick={() => handleAssignBranch(lead.id, pendingAssignments[lead.id])}>Confirm</Button>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                    {unassignedLeads.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            No new leads to assign.
                        </div>
                    )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Leads Pending Final Approval</CardTitle>
                        <CardDescription>Review leads that have been approved by branches and are ready for final closure.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Lead Title</TableHead>
                                    <TableHead className="hidden md:table-cell">Branch</TableHead>
                                    <TableHead className="hidden md:table-cell">Officer</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pendingApprovalLeads.map(lead => {
                                    const { branchName, officerName } = getLeadAssigneeInfo(lead);
                                    return (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium">{lead.title}</TableCell>
                                            <TableCell className="hidden md:table-cell">{branchName}</TableCell>
                                            <TableCell className="hidden md:table-cell">{officerName}</TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <Button variant="outline" size="sm" onClick={() => openReworkDialog(lead)}>Return</Button>
                                                <Button size="sm" onClick={() => handleApproveAndClose(lead.id)}>Approve & Close</Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                        {pendingApprovalLeads.length === 0 && (
                           <div className="text-center p-8 text-muted-foreground">
                                No leads pending final approval.
                           </div>
                        )}
                    </CardContent>
                </Card>
            </div>
          </main>
        </div>
      </SidebarInset>
       <Dialog open={isReworkDialogOpen} onOpenChange={setIsReworkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return Lead for Rework</DialogTitle>
            <DialogDescription>
                Provide a clear reason for returning this lead. This will be added to the lead's update history.
            </DialogDescription>
          </DialogHeader>
            <div className="grid gap-2 py-2">
                <Label htmlFor="reworkNote">Reason for Returning</Label>
                <Textarea 
                    id="reworkNote" 
                    placeholder="e.g., 'Please collect additional documentation from the client.'"
                    value={reworkNote}
                    onChange={(e) => setReworkNote(e.target.value)}
                />
            </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleConfirmRework}>Confirm Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
