'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import type { SalesLead } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { districts, branches, leadStatusOptions, initialLeads } from '@/lib/data';

const updateSchema = z.object({
    updateText: z.string().min(5, { message: "Update must be at least 5 characters." }),
    status: z.enum(['New', 'Assigned', 'In Progress', 'Pending Closure', 'Closed', 'Reopened'])
})

export default function OfficerDashboard() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [selectedLead, setSelectedLead] = useState<SalesLead | null>(null);
  const [isDetailsSheetOpen, setIsDetailsSheetOpen] = useState(false);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const { toast } = useToast();

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
  
  const { register: registerUpdate, handleSubmit: handleSubmitUpdate, control: controlUpdate, reset: resetUpdate, formState: { errors: updateErrors } } = useForm<z.infer<typeof updateSchema>>({
    resolver: zodResolver(updateSchema),
    defaultValues: {
        updateText: '',
    }
  });
  
  const handleViewDetails = (lead: SalesLead) => {
    setSelectedLead(lead);
    resetUpdate({ updateText: '', status: lead.status });
    setAttachmentFile(null);
    setIsDetailsSheetOpen(true);
  };
  
  const fileToDataUrl = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
      });
  }

  const onUpdateSubmit = async (data: z.infer<typeof updateSchema>) => {
    if (!selectedLead) return;
    
    const officer = branches.flatMap(b => b.officers).find(o => o.id === selectedLead.officerId);
    
    let attachmentData;
    if (attachmentFile) {
        try {
            const dataUrl = await fileToDataUrl(attachmentFile);
            attachmentData = {
                name: attachmentFile.name,
                dataUrl: dataUrl
            }
        } catch (error) {
            console.error("Error reading file:", error);
            toast({
                title: "File Error",
                description: "Could not read the attached file.",
                variant: "destructive",
            });
            return;
        }
    }

    const updatedLeads = leads.map(lead => {
        if (lead.id === selectedLead.id) {
            const newUpdate: SalesLead['updates'][0] = { 
                text: data.updateText, 
                timestamp: new Date(), 
                author: officer?.name || 'System',
                ...(attachmentData && { attachment: attachmentData })
            };
            return {
                ...lead,
                status: data.status,
                updates: [
                    ...lead.updates,
                    newUpdate
                ]
            }
        }
        return lead;
    });
    setLeads(updatedLeads);
    localStorage.setItem('salesLeads', JSON.stringify(updatedLeads));
    toast({
        title: "Lead Updated",
        description: `Lead "${selectedLead.title}" has been updated.`,
    });
    setIsDetailsSheetOpen(false);
  }

  const getStatusBadgeVariant = (status: SalesLead['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'New': return 'default';
      case 'Assigned': return 'secondary';
      case 'Reopened': return 'secondary';
      case 'In Progress': return 'outline';
      case 'Pending Closure': return 'destructive';
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
                    <Link href="/"><SidebarMenuButton isActive><Icons.clipboardList className="mr-2" />My Assignments</SidebarMenuButton></Link>
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
                        <TableHead>Assigned To</TableHead>
                        <TableHead>Savings Target</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Created At</TableHead>
                        <TableHead>Deadline</TableHead>
                        <TableHead><span className="sr-only">Actions</span></TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                    {filteredLeads.map((lead) => {
                        const { officer, branch, district } = getAssigneeInfo(lead);
                        return (
                            <TableRow key={lead.id}>
                                <TableCell className="font-medium">{lead.title}</TableCell>
                                <TableCell><Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge></TableCell>
                                <TableCell>{officer?.name || 'N/A'}, {branch?.name || 'N/A'}, {district?.name || 'N/A'}</TableCell>
                                <TableCell>{formatCurrency(lead.expectedSavings)}</TableCell>
                                <TableCell>
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${lead.location.lat},${lead.location.lng}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-1 text-primary hover:underline"
                                    >
                                        <Icons.mapPin className="h-4 w-4" /> View Map
                                    </a>
                                </TableCell>
                                <TableCell>{format(lead.createdAt, "PPP")}</TableCell>
                                <TableCell>{lead.deadline ? format(new Date(lead.deadline), "PPP") : 'N/A'}</TableCell>
                                <TableCell><Button variant="outline" size="sm" onClick={() => handleViewDetails(lead)}>Details</Button></TableCell>
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

      <Sheet open={isDetailsSheetOpen} onOpenChange={setIsDetailsSheetOpen}>
        <SheetContent className="sm:max-w-lg w-full">
            {selectedLead && (
                <>
                <SheetHeader>
                    <SheetTitle>{selectedLead.title}</SheetTitle>
                    <SheetDescription>{selectedLead.description}</SheetDescription>
                </SheetHeader>
                <div className="py-4 space-y-4">
                    <Separator />
                     <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="font-medium">Assignee</p>
                            <p className="text-muted-foreground">{getAssigneeInfo(selectedLead).officer?.name || 'Unassigned'}</p>
                        </div>
                        <div>
                            <p className="font-medium">Deadline</p>
                            <p className="text-muted-foreground">{selectedLead.deadline ? format(new Date(selectedLead.deadline), "PPP") : 'N/A'}</p>
                        </div>
                        <div>
                            <p className="font-medium">Savings Target</p>
                            <p className="text-muted-foreground">{formatCurrency(selectedLead.expectedSavings)}</p>
                        </div>
                        <div>
                            <p className="font-medium">Status</p>
                            <Badge variant={getStatusBadgeVariant(selectedLead.status)}>{selectedLead.status}</Badge>
                        </div>
                    </div>
                    <Separator />
                    <h4 className="text-sm font-semibold">Update History</h4>
                    <ScrollArea className="h-48 w-full rounded-md border p-4">
                       {selectedLead.updates.length > 0 ? (
                            <div className="space-y-4">
                                {selectedLead.updates.map((update, index) => (
                                    <div key={index} className="text-sm">
                                        <p className="font-medium">{update.author} <span className="text-muted-foreground text-xs">on {update.timestamp ? format(new Date(update.timestamp), "PPp") : ''}</span></p>
                                        <p className="text-muted-foreground">{update.text}</p>
                                        {update.attachment && (
                                            <a 
                                                href={update.attachment.dataUrl} 
                                                download={update.attachment.name}
                                                className="flex items-center gap-2 mt-2 text-sm text-primary hover:underline"
                                            >
                                                <Icons.file className="h-4 w-4" />
                                                <span>{update.attachment.name}</span>
                                            </a>
                                        )}
                                    </div>
                                ))}
                            </div>
                       ) : (
                           <p className="text-sm text-muted-foreground">No updates yet.</p>
                       )}
                    </ScrollArea>

                    <Separator />
                    <h4 className="text-sm font-semibold">Add New Update</h4>
                     <form onSubmit={handleSubmitUpdate(onUpdateSubmit)} className="space-y-4">
                         <div>
                            <Label htmlFor="updateText">Update Details</Label>
                            <Textarea id="updateText" {...registerUpdate("updateText")} />
                            {updateErrors.updateText && <p className="text-red-500 text-xs mt-1">{updateErrors.updateText.message}</p>}
                         </div>
                         <div>
                            <Label htmlFor="status">New Status</Label>
                             <Controller
                                control={controlUpdate}
                                name="status"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger><SelectValue placeholder="Select a status" /></SelectTrigger>
                                        <SelectContent>
                                            {leadStatusOptions.map(status => (<SelectItem key={status} value={status}>{status}</SelectItem>))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {updateErrors.status && <p className="text-red-500 text-xs mt-1">{updateErrors.status.message}</p>}
                         </div>
                         <div>
                            <Label htmlFor="attachment">Attachment (Optional)</Label>
                            <Input 
                                id="attachment" 
                                type="file" 
                                onChange={(e) => setAttachmentFile(e.target.files ? e.target.files[0] : null)} 
                            />
                        </div>
                         <SheetFooter>
                            <SheetClose asChild>
                                <Button type="button" variant="outline">Cancel</Button>
                            </SheetClose>
                            <Button type="submit">Submit Update</Button>
                         </SheetFooter>
                     </form>
                </div>
                </>
            )}
        </SheetContent>
      </Sheet>
    </SidebarProvider>
  );
}
