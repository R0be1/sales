
'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { BranchPlan, PlanEntry } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { branches, quarters, initialBranchPlans } from '@/lib/data';
import { Progress } from '@/components/ui/progress';

const planEntrySchema = z.object({
  type: z.enum(['collection', 'withdrawal']),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  description: z.string().min(5, "Description must be at least 5 characters."),
});

const rejectionSchema = z.object({
  rejectionReason: z.string().min(10, "A reason for rejection is required (min 10 characters)."),
});

export default function BranchPlansPage() {
  const [plans, setPlans] = useState<BranchPlan[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0].id);
  const [selectedQuarter, setSelectedQuarter] = useState(quarters[0]);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<PlanEntry | null>(null);

  const { toast } = useToast();
  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<z.infer<typeof planEntrySchema>>({
    resolver: zodResolver(planEntrySchema),
    defaultValues: { type: 'collection', amount: 0, description: '' }
  });
  const { register: registerReject, handleSubmit: handleSubmitReject, reset: resetReject, formState: { errors: rejectErrors } } = useForm<z.infer<typeof rejectionSchema>>({
    resolver: zodResolver(rejectionSchema),
  });

  useEffect(() => {
    const storedPlansJSON = localStorage.getItem('branchPlans');
    if (storedPlansJSON) {
      setPlans(JSON.parse(storedPlansJSON).map((p: any) => ({
        ...p,
        entries: p.entries.map((e: any) => ({ ...e, date: new Date(e.date) }))
      })));
    } else {
      localStorage.setItem('branchPlans', JSON.stringify(initialBranchPlans));
      setPlans(initialBranchPlans);
    }
  }, []);

  const savePlans = (updatedPlans: BranchPlan[]) => {
    setPlans(updatedPlans);
    localStorage.setItem('branchPlans', JSON.stringify(updatedPlans));
  };
  
  const currentPlan = useMemo(() => {
    return plans.find(p => p.branchId === selectedBranchId && p.quarter === selectedQuarter);
  }, [plans, selectedBranchId, selectedQuarter]);

  const planStats = useMemo(() => {
    if (!currentPlan) return { totalCollections: 0, totalWithdrawals: 0, netSavings: 0, achievement: 0 };
    const approvedEntries = currentPlan.entries.filter(e => e.status === 'Approved');
    const totalCollections = approvedEntries.filter(e => e.type === 'collection').reduce((acc, e) => acc + e.amount, 0);
    const totalWithdrawals = approvedEntries.filter(e => e.type === 'withdrawal').reduce((acc, e) => acc + e.amount, 0);
    const netSavings = totalCollections - totalWithdrawals;
    const achievement = currentPlan.savingsTarget > 0 ? Math.min(100, (netSavings / currentPlan.savingsTarget) * 100) : 0;
    return { totalCollections, totalWithdrawals, netSavings, achievement };
  }, [currentPlan]);

  const handleAddEntry = (data: z.infer<typeof planEntrySchema>) => {
    if (!currentPlan) return;
    const newEntry: PlanEntry = {
      id: `entry-${Date.now()}`,
      date: new Date(),
      status: 'Pending',
      submittedBy: 'Branch Manager',
      ...data
    };
    const updatedPlans = plans.map(p =>
      p.id === currentPlan.id ? { ...p, entries: [...p.entries, newEntry] } : p
    );
    savePlans(updatedPlans);
    toast({ title: "Entry Submitted", description: "Your new entry has been submitted for approval." });
    reset();
  };

  const handleReviewEntry = (entryId: string, status: 'Approved' | 'Rejected', reason?: string) => {
    if (!currentPlan) return;
    const updatedPlans = plans.map(p => {
        if (p.id === currentPlan.id) {
            return {
                ...p,
                entries: p.entries.map(e => e.id === entryId ? {
                    ...e,
                    status,
                    reviewedBy: 'District Director',
                    ...(reason && { rejectionReason: reason })
                } : e)
            };
        }
        return p;
    });
    savePlans(updatedPlans);
    toast({ title: `Entry ${status}`, description: `The entry has been ${status.toLowerCase()}.` });
    if(isRejectDialogOpen) setIsRejectDialogOpen(false);
  };
  
  const openRejectDialog = (entry: PlanEntry) => {
      setSelectedEntry(entry);
      resetReject();
      setIsRejectDialogOpen(true);
  }

  const onConfirmRejection = (data: z.infer<typeof rejectionSchema>) => {
      if(selectedEntry) {
          handleReviewEntry(selectedEntry.id, 'Rejected', data.rejectionReason);
      }
  }
  
  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const getStatusBadgeVariant = (status: PlanEntry['status']): "default" | "secondary" | "destructive" | "outline" => {
      switch (status) {
          case 'Approved': return 'default';
          case 'Pending': return 'outline';
          case 'Rejected': return 'destructive';
          default: return 'secondary';
      }
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
                    <Link href="/branch-plans"><SidebarMenuButton isActive><Icons.landmark className="mr-2" />Branch Plans</SidebarMenuButton></Link>
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
                    <Link href="/settings"><SidebarMenuButton><Icons.settings className="mr-2" />Settings</SidebarMenuButton></Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <div className="flex min-h-screen w-full flex-col bg-muted/40">
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
              <h1 className="text-lg font-semibold md:text-2xl">Branch Savings Plans</h1>
              <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-4">
                  <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                      <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Branch" /></SelectTrigger>
                      <SelectContent>
                          {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                      </SelectContent>
                  </Select>
                  <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
                      <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Select Quarter" /></SelectTrigger>
                      <SelectContent>
                          {quarters.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                      </SelectContent>
                  </Select>
              </div>
            </div>
            
            {!currentPlan ? (
                <Card className="flex flex-col items-center justify-center p-12">
                    <CardHeader>
                        <CardTitle>No Plan Found</CardTitle>
                        <CardDescription>There is no savings plan for the selected branch and quarter.</CardDescription>
                    </CardHeader>
                </Card>
            ) : (
                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Plan Summary: {currentPlan.quarter}</CardTitle>
                            <CardDescription>An overview of the savings plan for {branches.find(b=>b.id === currentPlan.branchId)?.name}.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                                <div><p className="font-medium">Savings Target</p><p className="text-2xl font-bold">{formatCurrency(currentPlan.savingsTarget)}</p></div>
                                <div><p className="font-medium">Approved Collections</p><p className="text-2xl font-bold text-green-600">{formatCurrency(planStats.totalCollections)}</p></div>
                                <div><p className="font-medium">Approved Withdrawals</p><p className="text-2xl font-bold text-red-600">{formatCurrency(planStats.totalWithdrawals)}</p></div>
                                <div><p className="font-medium">Net Savings</p><p className="text-2xl font-bold text-primary">{formatCurrency(planStats.netSavings)}</p></div>
                            </div>
                            <div>
                                <Label>Achievement Progress ({planStats.achievement.toFixed(1)}%)</Label>
                                <Progress value={planStats.achievement} className="h-3 mt-1" />
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-6 lg:grid-cols-5">
                        <div className="lg:col-span-3">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Plan Entries</CardTitle>
                                    <CardDescription>Review and manage all entries for this plan. As a District Director, you can approve or reject pending items.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead className="hidden md:table-cell">Description</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentPlan.entries.slice().reverse().map(entry => (
                                                <TableRow key={entry.id}>
                                                    <TableCell className="hidden md:table-cell">{format(entry.date, "PPP")}</TableCell>
                                                    <TableCell className="md:hidden">{format(entry.date, "P")}</TableCell>
                                                    <TableCell><Badge variant={entry.type === 'collection' ? 'outline' : 'secondary'}>{entry.type}</Badge></TableCell>
                                                    <TableCell className="font-medium">{formatCurrency(entry.amount)}</TableCell>
                                                    <TableCell className="hidden md:table-cell text-muted-foreground">{entry.description}</TableCell>
                                                    <TableCell><Badge variant={getStatusBadgeVariant(entry.status)}>{entry.status}</Badge></TableCell>
                                                    <TableCell className="text-right">
                                                        {entry.status === 'Pending' && (
                                                            <div className="flex gap-2 justify-end">
                                                                <Button size="sm" variant="outline" onClick={() => openRejectDialog(entry)}>Reject</Button>
                                                                <Button size="sm" onClick={() => handleReviewEntry(entry.id, 'Approved')}>Approve</Button>
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {currentPlan.entries.length === 0 && <div className="text-center p-8 text-muted-foreground">No entries submitted yet.</div>}
                                </CardContent>
                            </Card>
                        </div>
                        <div className="lg:col-span-2">
                             <Card>
                                <form onSubmit={handleSubmit(handleAddEntry)}>
                                    <CardHeader>
                                        <CardTitle>Add New Entry</CardTitle>
                                        <CardDescription>As a Branch Manager, you can submit collections or withdrawals for approval.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="type">Entry Type</Label>
                                                <Controller name="type" control={control} render={({ field }) => (
                                                    <Select onValueChange={field.onChange} value={field.value}>
                                                        <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="collection">Collection</SelectItem>
                                                            <SelectItem value="withdrawal">Withdrawal</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )} />
                                            </div>
                                            <div>
                                                <Label htmlFor="amount">Amount</Label>
                                                <Input id="amount" type="number" {...register("amount")} />
                                                {errors.amount && <p className="text-red-500 text-xs mt-1">{errors.amount.message}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea id="description" {...register("description")} />
                                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button type="submit">Submit for Approval</Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
          </main>
        </div>
      </SidebarInset>
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleSubmitReject(onConfirmRejection)}>
            <DialogHeader>
              <DialogTitle>Reject Entry</DialogTitle>
              <DialogDescription>
                  You must provide a clear reason for rejecting this entry. This will be visible to the Branch Manager.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-2 py-4">
                <Label htmlFor="rejectionReason">Reason for Rejection</Label>
                <Textarea id="rejectionReason" {...registerReject("rejectionReason")} />
                {rejectErrors.rejectionReason && <p className="text-red-500 text-xs mt-1">{rejectErrors.rejectionReason.message}</p>}
            </div>
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
              <Button type="submit">Confirm Rejection</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
