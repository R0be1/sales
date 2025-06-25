
'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import type { BranchPlan, PlanEntry } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { branches, quarters, initialBranchPlans } from '@/lib/data';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const newPlanEntrySchema = z.object({
  branchId: z.string().min(1, "Please select a branch."),
  quarter: z.string().min(1, "Please select a quarter."),
  type: z.enum(['collection', 'withdrawal']),
  amount: z.coerce.number().positive("Amount must be a positive number."),
  description: z.string().min(5, "Description must be at least 5 characters."),
});

export default function NewPlanEntryPage() {
    const router = useRouter();
    const { toast } = useToast();
    const { register, handleSubmit, control, formState: { errors } } = useForm<z.infer<typeof newPlanEntrySchema>>({
        resolver: zodResolver(newPlanEntrySchema),
        defaultValues: { type: 'collection', amount: 0, description: '' }
    });
    
    const [plans, setPlans] = useState<BranchPlan[]>([]);

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

    const onSubmit = (data: z.infer<typeof newPlanEntrySchema>) => {
        const targetPlan = plans.find(p => p.branchId === data.branchId && p.quarter === data.quarter);

        if (!targetPlan) {
            toast({
                title: "Plan Not Found",
                description: "A plan for the selected branch and quarter does not exist. Please contact your District Director.",
                variant: "destructive"
            });
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
            p.id === targetPlan.id ? { ...p, entries: [...p.entries, newEntry] } : p
        );

        savePlans(updatedPlans);
        toast({ title: "Entry Submitted", description: "Your new entry has been submitted for approval." });
        router.push('/branch-plans');
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
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => router.back()}>
                            <Icons.arrowLeft className="h-4 w-4" />
                            <span className="sr-only">Back</span>
                        </Button>
                        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
                            New Plan Entry
                        </h1>
                    </div>
                    <Card className="max-w-2xl mx-auto w-full">
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <CardHeader>
                                <CardTitle>Submit a New Plan Entry</CardTitle>
                                <CardDescription>Submit a new collection or withdrawal. It will appear in the plan as 'Pending' until reviewed.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                     <div>
                                        <Label htmlFor="branchId">Branch</Label>
                                        <Controller name="branchId" control={control} render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Select branch..." /></SelectTrigger>
                                                <SelectContent>
                                                    {branches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )} />
                                        {errors.branchId && <p className="text-red-500 text-xs mt-1">{errors.branchId.message}</p>}
                                    </div>
                                    <div>
                                        <Label htmlFor="quarter">Quarter</Label>
                                        <Controller name="quarter" control={control} render={({ field }) => (
                                            <Select onValueChange={field.onChange} value={field.value}>
                                                <SelectTrigger><SelectValue placeholder="Select quarter..." /></SelectTrigger>
                                                <SelectContent>
                                                    {quarters.map(q => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        )} />
                                        {errors.quarter && <p className="text-red-500 text-xs mt-1">{errors.quarter.message}</p>}
                                    </div>
                                </div>
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
                                    <Textarea id="description" {...register("description")} placeholder="Provide details about this entry..." />
                                    {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="button" variant="outline" onClick={() => router.push('/branch-plans')}>Cancel</Button>
                                <Button type="submit" className="ml-auto">Submit for Approval</Button>
                            </CardFooter>
                        </form>
                    </Card>
                </main>
            </div>
        </SidebarInset>
      </SidebarProvider>
    );
}
