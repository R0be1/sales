'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import type { SalesLead, Branch, Officer } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const branches: Branch[] = [
  { id: 'branch-1', name: 'North Branch', officers: [{ id: 'officer-1', name: 'John Doe' }, { id: 'officer-2', name: 'Jane Smith' }] },
  { id: 'branch-2', name: 'South Branch', officers: [{ id: 'officer-3', name: 'Peter Jones' }, { id: 'officer-4', name: 'Mary Williams' }] },
];

const initialLeads: SalesLead[] = [
  {
    id: 'lead-1',
    title: 'New Client Inquiry - TechCorp',
    description: 'TechCorp is interested in our new software suite. Follow up required.',
    status: 'Assigned',
    branchId: 'branch-1',
    officerId: 'officer-1',
    location: { lat: 34.0522, lng: -118.2437 },
    updates: [],
    createdAt: new Date(),
  },
  {
    id: 'lead-2',
    title: 'Partnership Opportunity - Innovate LLC',
    description: 'Potential partnership to integrate our platforms.',
    status: 'In Progress',
    branchId: 'branch-2',
    officerId: 'officer-3',
    location: { lat: 40.7128, lng: -74.0060 },
    updates: [{ text: 'Initial contact made.', timestamp: new Date(), author: 'Peter Jones' }],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
  },
    {
    id: 'lead-3',
    title: 'Renewal - Global Solutions',
    description: 'Contract renewal due next month. Need to discuss new terms.',
    status: 'Pending Closure',
    branchId: 'branch-1',
    officerId: 'officer-2',
    location: { lat: 51.5074, lng: -0.1278 },
    updates: [
        { text: 'Initial contact made.', timestamp: new Date(), author: 'Jane Smith' },
        { text: 'Proposal sent.', timestamp: new Date(), author: 'Jane Smith' },
        { text: 'Client agreed verbally. Waiting for signature.', timestamp: new Date(), author: 'Jane Smith' },
    ],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
  },
];


const leadSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
  branchId: z.string().min(1, { message: 'Please select a branch.' }),
  officerId: z.string().min(1, { message: 'Please select an officer.' }),
  lat: z.coerce.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  lng: z.coerce.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
});

export default function SalesDashboard() {
  const [leads, setLeads] = useState<SalesLead[]>(initialLeads);
  const [isNewLeadDialogOpen, setIsNewLeadDialogOpen] = useState(false);
  const { toast } = useToast();

  const { register, handleSubmit, control, watch, reset, formState: { errors } } = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
        title: '',
        description: '',
        branchId: '',
        officerId: '',
        lat: 0,
        lng: 0,
    }
  });

  const selectedBranchId = watch('branchId');
  const availableOfficers = useMemo(() => {
    if (!selectedBranchId) return [];
    const branch = branches.find(b => b.id === selectedBranchId);
    return branch ? branch.officers : [];
  }, [selectedBranchId]);

  const onSubmit = (data: z.infer<typeof leadSchema>) => {
    const newLead: SalesLead = {
      id: `lead-${Date.now()}`,
      title: data.title,
      description: data.description,
      status: 'New',
      branchId: data.branchId,
      officerId: data.officerId,
      location: { lat: data.lat, lng: data.lng },
      updates: [],
      createdAt: new Date(),
    };
    setLeads(prevLeads => [newLead, ...prevLeads]);
    toast({
        title: "Lead Created",
        description: `New lead "${data.title}" has been successfully created.`,
    });
    reset();
    setIsNewLeadDialogOpen(false);
  };
  
  const getStatusBadgeVariant = (status: SalesLead['status']): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'New':
        return 'default';
      case 'Assigned':
      case 'Reopened':
        return 'secondary';
      case 'In Progress':
        return 'outline';
      case 'Pending Closure':
        return 'destructive';
      case 'Closed':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-muted/40">
      <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <div className="flex items-center">
            <h1 className="text-lg font-semibold md:text-2xl">Sales Leads</h1>
        </div>
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Manage Leads</CardTitle>
                <CardDescription>
                An overview of all active and pending sales leads.
                </CardDescription>
            </div>
            <Dialog open={isNewLeadDialogOpen} onOpenChange={setIsNewLeadDialogOpen}>
                <DialogTrigger asChild>
                <Button><Icons.plusCircle className="mr-2 h-4 w-4" /> Create New Lead</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[500px]">
                <form onSubmit={handleSubmit(onSubmit)}>
                    <DialogHeader>
                    <DialogTitle>Create New Sales Lead</DialogTitle>
                    <DialogDescription>
                        Fill in the details to create a new task for an officer.
                    </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="title" className="text-right">Title</Label>
                            <div className="col-span-3">
                                <Input id="title" {...register('title')} />
                                {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="description" className="text-right">Description</Label>
                             <div className="col-span-3">
                                <Textarea id="description" {...register('description')} />
                                {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="branchId" className="text-right">Branch</Label>
                            <div className="col-span-3">
                            <Controller
                                control={control}
                                name="branchId"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select a branch" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {branches.map(branch => (
                                                <SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                )}
                            />
                            {errors.branchId && <p className="text-red-500 text-xs mt-1">{errors.branchId.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="officerId" className="text-right">Officer</Label>
                            <div className="col-span-3">
                                <Controller
                                control={control}
                                name="officerId"
                                render={({ field }) => (
                                    <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBranchId}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select an officer" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {availableOfficers.map(officer => (
                                            <SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                    </Select>
                                )}
                                />
                                {errors.officerId && <p className="text-red-500 text-xs mt-1">{errors.officerId.message}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right col-span-4 mb-2">Target Location</Label>
                            <div className="grid grid-cols-2 col-span-4 gap-2 pl-4">
                                <div>
                                    <Label htmlFor="lat">Latitude</Label>
                                    <Input id="lat" type="number" step="any" {...register('lat')} />
                                    {errors.lat && <p className="text-red-500 text-xs mt-1">{errors.lat.message}</p>}
                                </div>
                                <div>
                                    <Label htmlFor="lng">Longitude</Label>
                                    <Input id="lng" type="number" step="any" {...register('lng')} />
                                    {errors.lng && <p className="text-red-500 text-xs mt-1">{errors.lng.message}</p>}
                                </div>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                    <Button type="submit">Create Lead</Button>
                    </DialogFooter>
                </form>
                </DialogContent>
            </Dialog>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Lead Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead>
                    <span className="sr-only">Actions</span>
                    </TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {leads.map((lead) => {
                    const branch = branches.find(b => b.id === lead.branchId);
                    const officer = branch?.officers.find(o => o.id === lead.officerId);
                    return (
                        <TableRow key={lead.id}>
                            <TableCell className="font-medium">{lead.title}</TableCell>
                            <TableCell>
                                <Badge variant={getStatusBadgeVariant(lead.status)}>{lead.status}</Badge>
                            </TableCell>
                            <TableCell>{officer?.name || 'N/A'}, {branch?.name || 'N/A'}</TableCell>
                            <TableCell>
                                <a 
                                    href={`https://www.google.com/maps/search/?api=1&query=${lead.location.lat},${lead.location.lng}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 text-primary hover:underline"
                                >
                                    <Icons.mapPin className="h-4 w-4" />
                                    View Map
                                </a>
                            </TableCell>
                            <TableCell>{format(lead.createdAt, "PPP")}</TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm">Details</Button>
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
  );
}
