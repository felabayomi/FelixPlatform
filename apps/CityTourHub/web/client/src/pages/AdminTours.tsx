import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { Tour } from "@shared/schema";

export default function AdminTours() {
  const { toast } = useToast();
  const { data: tours, isLoading } = useQuery<Tour[]>({
    queryKey: ["/api/tours"],
  });

  const deleteMutation = useMutation({
    mutationFn: async (tourId: string) => {
      await apiRequest("DELETE", `/api/tours/${tourId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tours"] });
      toast({
        title: "Tour deleted",
        description: "The tour has been successfully deleted.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete tour. Please try again.",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading tours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold mb-2">Tour Management</h1>
          <p className="text-muted-foreground">
            Manage all tours, edit details, and create new tours
          </p>
        </div>
        <Link href="/admin/tours/new">
          <Button data-testid="button-create-tour">
            <Plus className="w-4 h-4 mr-2" />
            Create New Tour
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Tours ({tours?.length || 0})</CardTitle>
          <CardDescription>
            View, edit, and manage all available tours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">City</TableHead>
                  <TableHead className="w-[150px]">State</TableHead>
                  <TableHead className="w-[120px]">Start Date</TableHead>
                  <TableHead className="w-[120px]">End Date</TableHead>
                  <TableHead className="w-[80px] text-center">Capacity</TableHead>
                  <TableHead className="w-[100px] text-center">Registered</TableHead>
                  <TableHead className="w-[200px] text-right sticky right-0 bg-card">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tours?.map((tour) => (
                  <TableRow key={tour.id} data-testid={`row-tour-${tour.id}`}>
                    <TableCell className="font-medium w-[200px]">{tour.city}</TableCell>
                    <TableCell className="w-[150px]">{tour.state}</TableCell>
                    <TableCell className="w-[120px]">{tour.startDate}</TableCell>
                    <TableCell className="w-[120px]">{tour.endDate}</TableCell>
                    <TableCell className="w-[80px] text-center">{tour.maxParticipants}</TableCell>
                    <TableCell className="w-[100px] text-center">{tour.currentParticipants}</TableCell>
                    <TableCell className="w-[200px] text-right sticky right-0 bg-card">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/tours/${tour.id}/edit`}>
                          <Button
                            size="sm"
                            variant="outline"
                            data-testid={`button-edit-${tour.id}`}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              size="sm"
                              variant="outline"
                              data-testid={`button-delete-${tour.id}`}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Tour?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete the tour to {tour.city}, {tour.state}? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel data-testid="button-cancel-delete">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteMutation.mutate(tour.id)}
                                data-testid="button-confirm-delete"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="mt-6">
        <Link href="/">
          <Button variant="outline" data-testid="button-back-home">
            Return to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
