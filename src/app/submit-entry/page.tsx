
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { BranchPlan, PlanEntry } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { branches, quarters, initialBranchPlans } from '@/lib/data';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';

const newPlanEntrySchema = z.object({
  type: z.enum(['collection', 'withdrawal']),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  description: z.string().min(5, "Description must be at least 5 characters."),
});

export default function SubmitPlanEntryPage() {
  const [plans, setPlans] = useState<BranchPlan[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState(branches[0].id);
  const [selectedQuarter, setSelectedQuarter] = useState(quarters[0]);

  const { toast } = useToast();
  
  const { register: registerEntry, handleSubmit: handleSubmitEntry, control: controlEntry, reset: resetEntry, formState: { errors: entryErrors } } = useForm<z.infer<typeof newPlanEntrySchema>>({
    resolver: zodResolver(newPlanEntrySchema),
    defaultValues: { type: 'collection', amount: 0, description: '' }
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

  const onNewEntrySubmit = (data: z.infer<typeof newPlanEntrySchema>) => {
    if (!currentPlan) {
        toast({ title: "Plan Not Found", description: "A plan for the selected branch and quarter does not exist.", variant: "destructive" });
        return;
    }
    
    const newEntry: PlanEntry = {
        id: `entry-${Date.now()}`,
        date: new Date(),
        status: 'Pending',
        submittedBy: 'Branch Manager',
        type: data.type,
        amount: data.amount,
        description: data.description,
    };

    const updatedPlans = plans.map(p =>
        p.id === currentPlan.id ? { ...p, entries: [...p.entries, newEntry] } : p
    );

    savePlans(updatedPlans);
    toast({ title: "Entry Submitted", description: "Your new entry has been submitted for approval." });
    resetEntry({ type: 'collection', amount: 0, description: '' });
  };
  
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
                    <Link href="/branch-plans"><SidebarMenuButton><Icons.landmark className="mr-2" />Branch Plans</SidebarMenuButton></Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/submit-entry"><SidebarMenuButton isActive><Icons.plusCircle className="mr-2" />Submit Entry</SidebarMenuButton></Link>
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
              <h1 className="text-lg font-semibold md:text-2xl">Submit Plan Entry</h1>
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
                                    <CardTitle>Submit New Entry</CardTitle>
                                    <CardDescription>Submit a new collection or withdrawal for the selected branch and quarter. It will appear as 'Pending' until reviewed.</CardDescription>
                                </CardHeader>
                                <form onSubmit={handleSubmitEntry(onNewEntrySubmit)}>
                                    <CardContent className="space-y-6">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <Label htmlFor="type">Entry Type</Label>
                                                <Controller name="type" control={controlEntry} render={({ field }) => (
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
                                                <Input id="amount" type="number" {...registerEntry("amount")} />
                                                {entryErrors.amount && <p className="text-red-500 text-xs mt-1">{entryErrors.amount.message}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <Label htmlFor="description">Description</Label>
                                            <Textarea id="description" {...registerEntry("description")} placeholder="Provide details about this entry..." />
                                            {entryErrors.description && <p className="text-red-500 text-xs mt-1">{entryErrors.description.message}</p>}
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button type="submit" className="w-full">Submit for Approval</Button>
                                    </CardFooter>
                                </form>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Recent Submissions</CardTitle>
                                    <CardDescription>Status of entries for the selected plan.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Type</TableHead>
                                                <TableHead>Amount</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {currentPlan && currentPlan.entries.slice().reverse().map(entry => (
                                                <TableRow key={entry.id}>
                                                    <TableCell className="hidden md:table-cell">{format(entry.date, "P")}</TableCell>
                                                    <TableCell className="md:hidden">{format(entry.date, "P")}</TableCell>
                                                    <TableCell><Badge variant={entry.type === 'collection' ? 'outline' : 'secondary'}>{entry.type}</Badge></TableCell>
                                                    <TableCell className="font-medium">{formatCurrency(entry.amount)}</TableCell>
                                                    <TableCell><Badge variant={getStatusBadgeVariant(entry.status)}>{entry.status}</Badge></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                    {(!currentPlan || currentPlan.entries.length === 0) && <div className="text-center p-8 text-muted-foreground">No entries submitted yet.</div>}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            )}
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
