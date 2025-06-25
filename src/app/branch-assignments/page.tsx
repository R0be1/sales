
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
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import type { SalesLead } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { branches, initialLeads } from '@/lib/data';

export default function BranchAssignmentsPage() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [assignmentNote, setAssignmentNote] = useState('');
  const [selectedOfficerId, setSelectedOfficerId] = useState('');
  const [isReworkDialogOpen, setIsReworkDialogOpen] = useState(false);
  const [reworkNote, setReworkNote] = useState('');
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

  const openAssignDialog = (lead: SalesLead) => {
    setSelectedLead(lead);
    setSelectedOfficerId('');
    setAssignmentNote('');
    setIsAssignDialogOpen(true);
  };
  
  const handleConfirmAssignment = () => {
    if (!selectedLead || !selectedOfficerId) {
        toast({ title: "Assignment Error", description: "You must select an officer to assign the lead.", variant: "destructive" });
        return;
    }
    const updatedLeads = leads.map(lead => {
        if (lead.id === selectedLead.id) {
            const branch = branches.find(b => b.id === lead.branchId);
            const officer = branch?.officers.find(o => o.id === selectedOfficerId);
            const newUpdates = [
                ...lead.updates,
                { text: `Assigned to officer ${officer?.name || 'N/A'}.`, timestamp: new Date(), author: 'Branch Manager' }
            ];
            if (assignmentNote.trim()) {
                newUpdates.push({ text: `Note: ${assignmentNote}`, timestamp: new Date(), author: 'Branch Manager' });
            }

            return {
                ...lead,
                officerId: selectedOfficerId,
                status: 'In Progress',
                updates: newUpdates
            };
        }
        return lead;
    });
    setLeads(updatedLeads);
    localStorage.setItem('salesLeads', JSON.stringify(updatedLeads));
    toast({
        title: "Lead Assigned",
        description: "The lead has been successfully assigned to the officer.",
    });
    setIsAssignDialogOpen(false);
  };

  const updateLeadStatus = (leadId: string, status: SalesLead['status'], note?: string) => {
    const updatedLeads = leads.map(lead => {
      if (lead.id === leadId) {
        const newUpdate = {
          text: note || `Status changed to ${status} by Branch Manager.`,
          timestamp: new Date(),
          author: 'Branch Manager'
        };
        return { ...lead, status, updates: [...lead.updates, newUpdate] };
      }
      return lead;
    });
    setLeads(updatedLeads);
    localStorage.setItem('salesLeads', JSON.stringify(updatedLeads));
  };

  const handleApprove = (leadId: string) => {
    updateLeadStatus(leadId, 'Pending District Approval', 'Approved by Branch Manager. Forwarded for final approval.');
    toast({ title: "Lead Approved", description: "Lead has been forwarded for final approval." });
  };

  const openReworkDialog = (lead: SalesLead) => {
    setSelectedLead(lead);
    setReworkNote('');
    setIsReworkDialogOpen(true);
  };

  const handleConfirmRework = () => {
    if (selectedLead && reworkNote) {
      updateLeadStatus(selectedLead.id, 'Reopened', `Returned for rework: ${reworkNote}`);
      toast({ title: "Lead Returned", description: "The lead has been returned to the officer for rework." });
      setIsReworkDialogOpen(false);
    } else {
      toast({ title: "Note Required", description: "Please provide a reason for returning the lead.", variant: "destructive" });
    }
  };

  const unassignedLeads = useMemo(() => leads.filter(lead => lead.branchId && !lead.officerId && lead.status === 'Assigned'), [leads]);
  const pendingApprovalLeads = useMemo(() => leads.filter(lead => lead.officerId && lead.status === 'Pending Closure'), [leads]);
  
  const getAssigneeInfo = (lead: SalesLead) => {
    const branch = branches.find(b => b.id === lead.branchId);
    const officer = branch?.officers.find(o => o.id === lead.officerId);
    return {
      branchName: branch?.name || 'N/A',
      officers: branch?.officers || [],
      officerName: officer?.name || 'N/A'
    };
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
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
                    <Link href="/dashboard"><SidebarMenuButton><Icons.dashboard className="mr-2" />Dashboard</SidebarMenuButton></Link>
                </SidebarMenuItem>
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
                <h1 className="text-lg font-semibold md:text-2xl">Branch View</h1>
            </div>
            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Assign Leads to Officers</CardTitle>
                        <CardDescription>An overview of all unassigned leads in your branch(es).</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Lead Title</TableHead>
                            <TableHead className="hidden md:table-cell">Branch</TableHead>
                            <TableHead className="hidden lg:table-cell">Deadline</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {unassignedLeads.map((lead) => {
                            const { branchName } = getAssigneeInfo(lead);
                            return (
                                <TableRow key={lead.id}>
                                    <TableCell className="font-medium">{lead.title}</TableCell>
                                    <TableCell className="hidden md:table-cell">{branchName}</TableCell>
                                    <TableCell className="hidden lg:table-cell">{lead.deadline ? format(new Date(lead.deadline), "PPP") : 'N/A'}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="outline" size="sm" onClick={() => openAssignDialog(lead)}>Assign</Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
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
                        <CardTitle>Leads Pending Branch Approval</CardTitle>
                        <CardDescription>Review leads submitted for closure by officers.</CardDescription>
                    </CardHeader>
                    <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Lead Title</TableHead>
                                <TableHead>Officer</TableHead>
                                <TableHead className="hidden md:table-cell">Submitted On</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {pendingApprovalLeads.map((lead) => {
                            const { officerName } = getAssigneeInfo(lead);
                            const lastUpdate = lead.updates[lead.updates.length-1];
                            return (
                                <TableRow key={lead.id}>
                                    <TableCell className="font-medium">{lead.title}</TableCell>
                                    <TableCell>{officerName}</TableCell>
                                    <TableCell className="hidden md:table-cell">{lastUpdate ? format(lastUpdate.timestamp, "PPP") : 'N/A'}</TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button variant="outline" size="sm" onClick={() => openReworkDialog(lead)}>Return</Button>
                                        <Button size="sm" onClick={() => handleApprove(lead.id)}>Approve</Button>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                        </TableBody>
                    </Table>
                    {pendingApprovalLeads.length === 0 && (
                        <div className="text-center p-8 text-muted-foreground">
                            No leads are pending your approval.
                        </div>
                    )}
                    </CardContent>
                </Card>
            </div>
          </main>
        </div>
      </SidebarInset>
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assign Lead to Officer</DialogTitle>
            <DialogDescription>
                Review the lead details and assign it to a specific officer with optional instructions.
            </DialogDescription>
          </DialogHeader>
            {selectedLead && (
                <div className="space-y-4 py-2">
                    <div className="space-y-2 rounded-md border bg-muted/50 p-4">
                        <h4 className="font-semibold">{selectedLead.title}</h4>
                        <p className="text-sm text-muted-foreground">{selectedLead.description}</p>
                        <Separator/>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                                <p className="font-medium">Deadline</p>
                                <p className="text-muted-foreground">{selectedLead.deadline ? format(new Date(selectedLead.deadline), 'PPP') : 'N/A'}</p>
                            </div>
                            <div>
                                <p className="font-medium">Savings Target</p>
                                <p className="text-muted-foreground">{formatCurrency(selectedLead.expectedSavings)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="grid gap-2">
                        <Label htmlFor="officer">Assign to Officer</Label>
                        <Select onValueChange={setSelectedOfficerId} value={selectedOfficerId}>
                            <SelectTrigger id="officer" className="w-full">
                                <SelectValue placeholder="Select an officer" />
                            </SelectTrigger>
                            <SelectContent>
                                {getAssigneeInfo(selectedLead).officers.map(officer => (
                                    <SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="assignmentNote">Instructions / Note (Optional)</Label>
                        <Textarea 
                            id="assignmentNote" 
                            placeholder="Add a specific instruction for the officer..."
                            value={assignmentNote}
                            onChange={(e) => setAssignmentNote(e.target.value)}
                        />
                    </div>
                </div>
            )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button onClick={handleConfirmAssignment}>Confirm Assignment</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isReworkDialogOpen} onOpenChange={setIsReworkDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return Lead for Rework</DialogTitle>
            <DialogDescription>
                Provide a clear reason for returning this lead. This will be added to the lead's update history for the officer to see.
            </DialogDescription>
          </DialogHeader>
            <div className="grid gap-2 py-2">
                <Label htmlFor="reworkNote">Reason for Returning</Label>
                <Textarea 
                    id="reworkNote" 
                    placeholder="e.g., 'Client meeting notes are missing. Please upload.'"
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
