import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import ThemeToggle from "@/components/ThemeToggle";
import { Calendar, Clock, User, Phone, Mail, Package, ArrowLeft, Droplet, Edit, Trash2, Search, Plus } from "lucide-react";
import { Link } from "wouter";
import type { Appointment } from "@shared/schema";
import logoImage from "@assets/image_1759927814809.png";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Appointments() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [deletingAppointment, setDeletingAppointment] = useState<Appointment | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createFormData, setCreateFormData] = useState({
    soapType: "",
    hasHeavyItems: false,
    heavyItemsCount: 0
  });
  const { toast } = useToast();

  const { data: appointments, isLoading } = useQuery<Appointment[]>({
    queryKey: ["/api/appointments"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, { status });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      toast({
        title: "Status Updated",
        description: "Appointment status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update appointment status.",
        variant: "destructive",
      });
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/appointments/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setEditingAppointment(null);
      toast({
        title: "Appointment Updated",
        description: "Appointment details have been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update appointment.",
        variant: "destructive",
      });
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest("DELETE", `/api/appointments/${id}`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setDeletingAppointment(null);
      toast({
        title: "Appointment Deleted",
        description: "Appointment has been deleted successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete appointment.",
        variant: "destructive",
      });
    },
  });

  const createAppointmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/appointments", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/appointments"] });
      setShowCreateDialog(false);
      toast({
        title: "Appointment Created",
        description: "New appointment has been created successfully. Email notification sent.",
      });
    },
    onError: () => {
      toast({
        title: "Creation Failed",
        description: "Failed to create appointment.",
        variant: "destructive",
      });
    },
  });

  const filteredAppointments = appointments?.filter((apt) => {
    const matchesSearch = 
      apt.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      apt.customerPhone.includes(searchQuery);
    
    const matchesStatus = statusFilter === "all" || apt.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    return new Date(a.dropoffDate).getTime() - new Date(b.dropoffDate).getTime();
  });

  const handleEditSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAppointment) return;
    
    const formData = new FormData(e.currentTarget);
    const data = {
      customerName: formData.get("customerName") as string,
      customerPhone: formData.get("customerPhone") as string,
      customerEmail: formData.get("customerEmail") as string,
      dropoffDate: formData.get("dropoffDate") as string,
      dropoffTime: formData.get("dropoffTime") as string,
      pickupDate: formData.get("pickupDate") as string || null,
      pickupTime: formData.get("pickupTime") as string || null,
      specialInstructions: formData.get("specialInstructions") as string || null,
    };
    
    updateAppointmentMutation.mutate({ id: editingAppointment.id, data });
  };

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const formData = new FormData(e.currentTarget);
    const data = {
      customerName: formData.get("customerName") as string,
      customerPhone: formData.get("customerPhone") as string,
      customerEmail: formData.get("customerEmail") as string,
      dropoffDate: formData.get("dropoffDate") as string,
      dropoffTime: formData.get("dropoffTime") as string,
      pickupDate: formData.get("pickupDate") as string || undefined,
      pickupTime: formData.get("pickupTime") as string || undefined,
      soapType: createFormData.soapType,
      hasHeavyItems: createFormData.hasHeavyItems,
      heavyItemsCount: createFormData.hasHeavyItems ? createFormData.heavyItemsCount : undefined,
      specialInstructions: formData.get("specialInstructions") as string || undefined,
    };
    
    createAppointmentMutation.mutate(data);
  };

  const handleCreateDialogClose = (open: boolean) => {
    setShowCreateDialog(open);
    if (!open) {
      setCreateFormData({
        soapType: "",
        hasHeavyItems: false,
        heavyItemsCount: 0
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "bg-blue-500/10 text-blue-500";
      case "in-progress":
        return "bg-yellow-500/10 text-yellow-500";
      case "completed":
        return "bg-green-500/10 text-green-500";
      case "cancelled":
        return "bg-red-500/10 text-red-500";
      default:
        return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <img 
                  src={logoImage} 
                  alt="A & F Laundry Service" 
                  className="h-20 w-auto mix-blend-darken dark:mix-blend-lighten cursor-pointer"
                />
              </Link>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="outline" size="icon" data-testid="button-back-home">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Appointments Dashboard</h1>
            <p className="text-muted-foreground">Manage your scheduled drop-offs and pickups</p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="button-create-appointment">
            <Plus className="w-4 h-4 mr-2" />
            Create Appointment
          </Button>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-appointments"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-48" data-testid="select-status-filter">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="in-progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading appointments...</p>
          </div>
        ) : !filteredAppointments || filteredAppointments.length === 0 ? (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">No appointments found</h2>
            <p className="text-muted-foreground mb-6">
              {searchQuery || statusFilter !== "all" 
                ? "Try adjusting your search or filter criteria"
                : "Your upcoming bookings will appear here"
              }
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Link href="/">
                <Button>Schedule an Appointment</Button>
              </Link>
            )}
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAppointments.map((appointment) => (
              <Card key={appointment.id} className="p-6" data-testid={`card-appointment-${appointment.id}`}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Select 
                            value={appointment.status} 
                            onValueChange={(status) => updateStatusMutation.mutate({ id: appointment.id, status })}
                          >
                            <SelectTrigger 
                              className={`w-40 h-7 text-xs ${getStatusColor(appointment.status)}`}
                              data-testid={`select-status-${appointment.id}`}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="in-progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground font-mono">
                            {appointment.id.substring(0, 8).toUpperCase()}
                          </span>
                        </div>
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          {appointment.customerName}
                        </h3>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Drop-off</p>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-primary" />
                            <span>{appointment.dropoffDate}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Clock className="w-4 h-4 text-primary" />
                            <span>{appointment.dropoffTime}</span>
                          </div>
                        </div>

                        {appointment.pickupDate && appointment.pickupTime && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Pickup</p>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-chart-2" />
                              <span>{appointment.pickupDate}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock className="w-4 h-4 text-chart-2" />
                              <span>{appointment.pickupTime}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {appointment.customerPhone}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {appointment.customerEmail}
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Droplet className="w-4 h-4" />
                          {appointment.soapType}
                        </div>
                      </div>

                      {appointment.hasHeavyItems && appointment.heavyItemsCount && (
                        <div className="flex items-center gap-2 text-sm">
                          <Package className="w-4 h-4 text-chart-3" />
                          <span>{appointment.heavyItemsCount} heavy item{appointment.heavyItemsCount > 1 ? 's' : ''}</span>
                          <span className="text-muted-foreground">(${appointment.heavyItemsCount * 20} surcharge)</span>
                        </div>
                      )}

                      {appointment.specialInstructions && (
                        <div className="pt-2 border-t border-border">
                          <p className="text-sm text-muted-foreground mb-1">Special Instructions</p>
                          <p className="text-sm">{appointment.specialInstructions}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex sm:flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setEditingAppointment(appointment)}
                        data-testid={`button-edit-${appointment.id}`}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => setDeletingAppointment(appointment)}
                        data-testid={`button-delete-${appointment.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Edit Dialog */}
      <Dialog open={!!editingAppointment} onOpenChange={() => setEditingAppointment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-appointment">
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update appointment details for {editingAppointment?.customerName}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-customerName">Customer Name</Label>
                  <Input
                    id="edit-customerName"
                    name="customerName"
                    defaultValue={editingAppointment?.customerName}
                    required
                    data-testid="input-edit-customer-name"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-customerPhone">Phone</Label>
                  <Input
                    id="edit-customerPhone"
                    name="customerPhone"
                    type="tel"
                    defaultValue={editingAppointment?.customerPhone}
                    required
                    data-testid="input-edit-customer-phone"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-customerEmail">Email</Label>
                <Input
                  id="edit-customerEmail"
                  name="customerEmail"
                  type="email"
                  defaultValue={editingAppointment?.customerEmail}
                  required
                  data-testid="input-edit-customer-email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-dropoffDate">Drop-off Date</Label>
                  <Input
                    id="edit-dropoffDate"
                    name="dropoffDate"
                    type="date"
                    defaultValue={editingAppointment?.dropoffDate}
                    required
                    data-testid="input-edit-dropoff-date"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-dropoffTime">Drop-off Time</Label>
                  <Input
                    id="edit-dropoffTime"
                    name="dropoffTime"
                    type="time"
                    defaultValue={editingAppointment?.dropoffTime}
                    required
                    data-testid="input-edit-dropoff-time"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-pickupDate">Pickup Date</Label>
                  <Input
                    id="edit-pickupDate"
                    name="pickupDate"
                    type="date"
                    defaultValue={editingAppointment?.pickupDate || ""}
                    data-testid="input-edit-pickup-date"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-pickupTime">Pickup Time</Label>
                  <Input
                    id="edit-pickupTime"
                    name="pickupTime"
                    type="time"
                    defaultValue={editingAppointment?.pickupTime || ""}
                    data-testid="input-edit-pickup-time"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="edit-specialInstructions">Special Instructions</Label>
                <Input
                  id="edit-specialInstructions"
                  name="specialInstructions"
                  defaultValue={editingAppointment?.specialInstructions || ""}
                  data-testid="input-edit-special-instructions"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditingAppointment(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateAppointmentMutation.isPending} data-testid="button-save-edit">
                {updateAppointmentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingAppointment} onOpenChange={() => setDeletingAppointment(null)}>
        <AlertDialogContent data-testid="dialog-delete-confirmation">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the appointment for {deletingAppointment?.customerName}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deletingAppointment && deleteAppointmentMutation.mutate(deletingAppointment.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-testid="button-confirm-delete"
            >
              {deleteAppointmentMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Appointment Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={handleCreateDialogClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-create-appointment">
          <DialogHeader>
            <DialogTitle>Create New Appointment</DialogTitle>
            <DialogDescription>
              Book an appointment for walk-in or phone orders. Email notification will be sent automatically.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-customerName">Customer Name *</Label>
                  <Input
                    id="create-customerName"
                    name="customerName"
                    required
                    data-testid="input-create-customer-name"
                  />
                </div>
                <div>
                  <Label htmlFor="create-customerPhone">Phone *</Label>
                  <Input
                    id="create-customerPhone"
                    name="customerPhone"
                    type="tel"
                    placeholder="240-664-2270"
                    required
                    data-testid="input-create-customer-phone"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="create-customerEmail">Email *</Label>
                <Input
                  id="create-customerEmail"
                  name="customerEmail"
                  type="email"
                  required
                  data-testid="input-create-customer-email"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-dropoffDate">Drop-off Date *</Label>
                  <Input
                    id="create-dropoffDate"
                    name="dropoffDate"
                    type="date"
                    required
                    data-testid="input-create-dropoff-date"
                  />
                </div>
                <div>
                  <Label htmlFor="create-dropoffTime">Drop-off Time *</Label>
                  <Input
                    id="create-dropoffTime"
                    name="dropoffTime"
                    type="time"
                    required
                    data-testid="input-create-dropoff-time"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="create-pickupDate">Pickup Date (Optional)</Label>
                  <Input
                    id="create-pickupDate"
                    name="pickupDate"
                    type="date"
                    data-testid="input-create-pickup-date"
                  />
                </div>
                <div>
                  <Label htmlFor="create-pickupTime">Pickup Time (Optional)</Label>
                  <Input
                    id="create-pickupTime"
                    name="pickupTime"
                    type="time"
                    data-testid="input-create-pickup-time"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="create-soapType">Soap Type *</Label>
                <Select 
                  value={createFormData.soapType} 
                  onValueChange={(value) => setCreateFormData({...createFormData, soapType: value})}
                  required
                >
                  <SelectTrigger id="create-soapType" data-testid="select-create-soap-type">
                    <SelectValue placeholder="Select soap type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tide Regular">Tide Regular</SelectItem>
                    <SelectItem value="Tide Hypoallergenic">Tide Hypoallergenic</SelectItem>
                    <SelectItem value="I provide my own">I provide my own</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="create-hasHeavyItems"
                    checked={createFormData.hasHeavyItems}
                    onCheckedChange={(checked) => setCreateFormData({
                      ...createFormData, 
                      hasHeavyItems: checked === true,
                      heavyItemsCount: checked === true ? createFormData.heavyItemsCount : 0
                    })}
                    data-testid="checkbox-create-heavy-items"
                  />
                  <Label htmlFor="create-hasHeavyItems" className="font-normal">
                    Heavy items (duvets, rugs, etc.) - $20 surcharge per item
                  </Label>
                </div>
                {createFormData.hasHeavyItems && (
                  <div className="ml-6">
                    <Label htmlFor="create-heavyItemsCount">Number of Heavy Items</Label>
                    <Input
                      id="create-heavyItemsCount"
                      type="number"
                      min="1"
                      value={createFormData.heavyItemsCount || ""}
                      onChange={(e) => setCreateFormData({...createFormData, heavyItemsCount: parseInt(e.target.value) || 0})}
                      placeholder="Enter number of items"
                      data-testid="input-create-heavy-items-count"
                    />
                  </div>
                )}
              </div>
              <div>
                <Label htmlFor="create-specialInstructions">Special Instructions (Optional)</Label>
                <Textarea
                  id="create-specialInstructions"
                  name="specialInstructions"
                  placeholder="Any special requests or notes..."
                  data-testid="textarea-create-special-instructions"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleCreateDialogClose(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createAppointmentMutation.isPending || !createFormData.soapType} data-testid="button-save-create">
                {createAppointmentMutation.isPending ? "Creating..." : "Create Appointment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
