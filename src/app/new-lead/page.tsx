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
  CardFooter,
} from '@/components/ui/card';
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
import { Icons } from '@/components/icons';
import type { SalesLead } from '@/lib/types';
import { useToast } from "@/hooks/use-toast";
import { SidebarProvider, Sidebar, SidebarInset, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from '@/components/ui/sidebar';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { Skeleton } from '@/components/ui/skeleton';
import { districts, branches } from '@/lib/data';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const leadSchema = z.object({
  title: z.string().min(3, { message: 'Title must be at least 3 characters long.' }),
  description: z.string().min(10, { message: 'Description must be at least 10 characters long.' }),
  districtId: z.string().min(1, { message: 'Please select a district.' }),
  branchId: z.string().min(1, { message: 'Please select a branch.' }),
  officerId: z.string().min(1, { message: 'Please select an officer.' }),
  expectedSavings: z.coerce.number().min(0, "Expected savings must be a positive number."),
  lat: z.coerce.number().min(-90, "Invalid latitude").max(90, "Invalid latitude"),
  lng: z.coerce.number().min(-180, "Invalid longitude").max(180, "Invalid longitude"),
  deadline: z.date({ required_error: 'A deadline date is required.' }),
});


export default function NewLeadPage() {
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [searchAddress, setSearchAddress] = useState('');
  const { toast } = useToast();
  const router = useRouter();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
  });

  const { register, handleSubmit, control, watch, reset, setValue, formState: { errors } } = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
        title: '',
        description: '',
        districtId: '',
        branchId: '',
        officerId: '',
        expectedSavings: 0,
        lat: 40.7128,
        lng: -74.0060,
        deadline: new Date(new Date().setDate(new Date().getDate() + 7)),
    }
  });

  const selectedDistrictId = watch('districtId');
  const selectedBranchId = watch('branchId');
  const lat = watch('lat');
  const lng = watch('lng');

  const availableBranches = useMemo(() => {
    if (!selectedDistrictId) return [];
    return branches.filter(b => b.districtId === selectedDistrictId);
  }, [selectedDistrictId]);

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
      districtId: data.districtId,
      branchId: data.branchId,
      officerId: data.officerId,
      location: { lat: data.lat, lng: data.lng },
      expectedSavings: data.expectedSavings,
      updates: [],
      createdAt: new Date(),
      deadline: data.deadline,
    };
    
    const existingLeadsJSON = localStorage.getItem('salesLeads');
    const existingLeads = existingLeadsJSON ? JSON.parse(existingLeadsJSON) : [];
    
    const updatedLeads = [newLead, ...existingLeads];
    localStorage.setItem('salesLeads', JSON.stringify(updatedLeads));

    toast({
        title: "Lead Created",
        description: `New lead "${data.title}" has been successfully created.`,
    });
    router.push('/');
  };

  const handleMapClick = (event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const newLat = event.latLng.lat();
      const newLng = event.latLng.lng();
      setValue('lat', newLat, { shouldValidate: true });
      setValue('lng', newLng, { shouldValidate: true });
    }
  };

  const handleAddressSearch = () => {
    if (!isLoaded) return;
    if (!searchAddress) {
      toast({
        title: "Address missing",
        description: "Please enter an address to search for.",
        variant: "destructive",
      });
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchAddress }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const newLat = location.lat();
        const newLng = location.lng();
        setValue('lat', newLat, { shouldValidate: true });
        setValue('lng', newLng, { shouldValidate: true });
        toast({
            title: "Location found",
            description: `Map updated to ${results[0].formatted_address}`,
        })
      } else {
        toast({
          title: "Location not found",
          description: `Could not find a location for "${searchAddress}". Status: ${status}`,
          variant: "destructive",
        });
      }
    });
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
                    <Link href="/">
                        <SidebarMenuButton><Icons.clipboardList className="mr-2" />Assignments</SidebarMenuButton>
                    </Link>
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
                <h1 className="text-lg font-semibold md:text-2xl">Create New Sales Lead</h1>
            </div>
            <Card>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardHeader>
                        <CardTitle>Lead Details</CardTitle>
                        <CardDescription>
                            Fill in the details to create a new task for an officer.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Title</Label>
                            <Input id="title" {...register('title')} />
                            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
                        </div>
                        
                        <div className="grid gap-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea id="description" {...register('description')} />
                            {errors.description && <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>}
                        </div>

                        <div className="grid md:grid-cols-3 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="districtId">District</Label>
                                <Controller
                                    control={control}
                                    name="districtId"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <SelectTrigger><SelectValue placeholder="Select a district" /></SelectTrigger>
                                            <SelectContent>
                                                {districts.map(d => (<SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.districtId && <p className="text-red-500 text-xs mt-1">{errors.districtId.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="branchId">Branch</Label>
                                <Controller
                                    control={control}
                                    name="branchId"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedDistrictId}>
                                            <SelectTrigger><SelectValue placeholder="Select a branch" /></SelectTrigger>
                                            <SelectContent>
                                                {availableBranches.map(branch => (<SelectItem key={branch.id} value={branch.id}>{branch.name}</SelectItem>))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                />
                                {errors.branchId && <p className="text-red-500 text-xs mt-1">{errors.branchId.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="officerId">Officer</Label>
                                <Controller
                                    control={control}
                                    name="officerId"
                                    render={({ field }) => (
                                        <Select onValueChange={field.onChange} value={field.value} disabled={!selectedBranchId}>
                                        <SelectTrigger><SelectValue placeholder="Select an officer" /></SelectTrigger>
                                        <SelectContent>
                                            {availableOfficers.map(officer => (<SelectItem key={officer.id} value={officer.id}>{officer.name}</SelectItem>))}
                                        </SelectContent>
                                        </Select>
                                    )}
                                    />
                                {errors.officerId && <p className="text-red-500 text-xs mt-1">{errors.officerId.message}</p>}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="expectedSavings">Savings Target</Label>
                                <Input id="expectedSavings" type="number" {...register('expectedSavings')} />
                                {errors.expectedSavings && <p className="text-red-500 text-xs mt-1">{errors.expectedSavings.message}</p>}
                            </div>
                            <div className="grid gap-2">
                                <Label>Deadline</Label>
                                <Controller
                                    control={control}
                                    name="deadline"
                                    render={({ field }) => (
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button
                                                    variant={"outline"}
                                                    className={cn(
                                                        "w-full justify-start text-left font-normal",
                                                        !field.value && "text-muted-foreground"
                                                    )}
                                                >
                                                    <Icons.calendar className="mr-2 h-4 w-4" />
                                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0">
                                                <Calendar
                                                    mode="single"
                                                    selected={field.value}
                                                    onSelect={field.onChange}
                                                    disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() - 1))}
                                                    initialFocus
                                                />
                                            </PopoverContent>
                                        </Popover>
                                    )}
                                />
                                {errors.deadline && <p className="text-red-500 text-xs mt-1">{errors.deadline.message}</p>}
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label>Location</Label>
                            <div className="flex items-center gap-2">
                                <Input
                                    id="address-search"
                                    placeholder="Type an address and click search"
                                    value={searchAddress}
                                    onChange={(e) => setSearchAddress(e.target.value)}
                                     onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            handleAddressSearch();
                                        }
                                    }}
                                />
                                <Button type="button" onClick={handleAddressSearch}>Search</Button>
                            </div>
                            <div className="h-64 w-full rounded-md border mt-2">
                                {isLoaded ? (
                                    <GoogleMap
                                        mapContainerStyle={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
                                        center={{ lat, lng }}
                                        zoom={12}
                                        onClick={handleMapClick}
                                    >
                                        <Marker position={{ lat, lng }} />
                                    </GoogleMap>
                                ) : (
                                    <Skeleton className="h-full w-full" />
                                )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                                Search for an address or click on the map to set a location.
                                <br/>
                                Current: {lat.toFixed(4)}, {lng.toFixed(4)}
                            </div>
                            {errors.lat && <p className="text-red-500 text-xs mt-1">{errors.lat.message}</p>}
                            {errors.lng && <p className="text-red-500 text-xs mt-1">{errors.lng.message}</p>}
                        </div>
                    </CardContent>
                    <CardFooter className="border-t px-6 py-4">
                        <Button type="submit">Create Lead</Button>
                    </CardFooter>
                </form>
            </Card>
          </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
