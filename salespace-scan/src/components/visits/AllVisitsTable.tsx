import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminAPI, CheckIn } from '@/lib/api';
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { Loader2, MapPin, Calendar, User, Store, ArrowUpDown, FileText, Tag, Box } from 'lucide-react';

export const AllVisitsTable = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [selectedVisit, setSelectedVisit] = useState<CheckIn | null>(null);

  const { data: visits = [], isLoading } = useQuery({
    queryKey: ['all-visits'],
    queryFn: () => adminAPI.getAllVisits(),
  });

  const columns: ColumnDef<CheckIn>[] = [
    {
      accessorKey: 'agent.name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Agent
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const agent = row.original.agent;
        return <div>{agent?.name || agent?.phone || 'Unknown'}</div>;
      },
    },
    {
      accessorKey: 'timestamp',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Date
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        return <div>{formatDate(row.original.timestamp)}</div>;
      },
      sortingFn: 'datetime',
    },
    {
      accessorKey: 'visit_type',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const visit = row.original;
        // Determine if this is a shop visit based on having shop data or visit_type
        const isShopVisit = (visit.visit_response?.visit_type === 'customer') || 
                            (visit.shop_id && visit.shop);
                            
        return (
          <div className="flex items-center">
            {isShopVisit ? (
              <Store className="mr-2 h-4 w-4" />
            ) : (
              <User className="mr-2 h-4 w-4" />
            )}
            {isShopVisit ? 'Shop' : 'Individual'}
          </div>
        );
      },
    },
    {
      accessorKey: 'shop.name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Location
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const shop = row.original.shop;
        return <div>{shop?.name || 'N/A'}</div>;
      },
    },
    {
      accessorKey: 'brand.name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Brand
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const brand = row.original.brand;
        return <div>{brand?.name || 'N/A'}</div>;
      },
    },
    {
      accessorKey: 'status',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Status
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const status = row.original.status;
        const statusColorMap: Record<string, string> = {
          'APPROVED': 'text-green-500',
          'FLAGGED': 'text-red-500',
        };
        
        return (
          <div className={statusColorMap[status.toUpperCase()] || 'text-gray-500'}>
            {status}
          </div>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        return (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setSelectedVisit(row.original)}
          >
            View
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: visits,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
      globalFilter,
    },
  });

  const formatDate = (timestamp: string) => {
    try {
      return format(new Date(timestamp), 'PP');
    } catch (e) {
      return 'Invalid date';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <div className="flex items-center py-4 mb-4">
        <Input
          placeholder="Search all columns..."
          value={globalFilter ?? ''}
          onChange={(event) => setGlobalFilter(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div className="rounded-lg border bg-white overflow-x-auto">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="px-4 py-3 text-sm font-semibold bg-muted/50">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="hover:bg-muted/30"
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="px-4 py-3 align-middle">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center px-4 py-3">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>

      {/* Visit Details Dialog */}
      <Dialog open={!!selectedVisit} onOpenChange={(open) => !open && setSelectedVisit(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto p-6 md:p-8">
          {selectedVisit && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  {(selectedVisit.visit_response?.visit_type === 'customer' || (selectedVisit.shop_id && selectedVisit.shop)) ? (
                    <Store className="h-5 w-5" />
                  ) : (
                    <User className="h-5 w-5" />
                  )}
                  {(selectedVisit.visit_response?.visit_type === 'customer' || (selectedVisit.shop_id && selectedVisit.shop))
                    ? `Shop Visit: ${selectedVisit.shop?.name || 'Unknown Shop'}` 
                    : 'Individual Visit'}
                </DialogTitle>
                <DialogDescription>
                  {format(new Date(selectedVisit.timestamp), 'PPpp')}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3">Visit Details</h3>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(selectedVisit.timestamp), 'PPpp')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVisit.agent?.name || selectedVisit.agent?.phone || 'Unknown agent'}</span>
                      </div>
                      {selectedVisit.shop && (
                        <div className="flex items-center gap-2">
                          <Store className="h-4 w-4 text-muted-foreground" />
                          <span>{selectedVisit.shop.name}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>
                          {selectedVisit.shop?.address || 
                            `${selectedVisit.latitude.toFixed(5)}, ${selectedVisit.longitude.toFixed(5)}`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span>{selectedVisit.notes || 'No notes provided'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4">
                    <h3 className="text-sm font-medium mb-3">Brand Information</h3>
                    <div className="space-y-3">
                      {selectedVisit.brand ? (
                        <>
                          <div className="flex items-center gap-2">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <span>Brand: {selectedVisit.brand.name}</span>
                          </div>
                          {selectedVisit.category && (
                            <div className="flex items-center gap-2">
                              <Tag className="h-4 w-4 text-muted-foreground" />
                              <span>Category: {selectedVisit.category.name}</span>
                            </div>
                          )}
                          {selectedVisit.product && (
                            <div className="flex items-center gap-2">
                              <Box className="h-4 w-4 text-muted-foreground" />
                              <span>Product: {selectedVisit.product.name}</span>
                            </div>
                          )}
                        </>
                      ) : (
                        <span className="text-muted-foreground">No brand information available</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Visit Responses */}
                {selectedVisit.visit_response && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Visit Responses</h3>
                    <div className="border rounded-md p-4 bg-muted/50">
                      <pre className="text-xs whitespace-pre-wrap overflow-auto max-h-[400px]">
                        {JSON.stringify(selectedVisit.visit_response.responses, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
                {/* Photos */}
                {(selectedVisit.photo_base64 || selectedVisit.additional_photos_base64) && (
                  <div>
                    <h3 className="text-sm font-medium mb-3">Photos</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Main photo - only show base64 */}
                      {selectedVisit.photo_base64 && (
                        <img 
                          src={selectedVisit.photo_base64} 
                          alt="Visit photo" 
                          className="rounded-md object-cover h-[150px] w-full cursor-pointer border"
                          onClick={() => window.open(selectedVisit.photo_base64, '_blank')}
                        />
                      )}
                      {/* Additional photos - from base64 array */}
                      {selectedVisit.additional_photos_base64?.map((photo, index) => (
                        <img 
                          key={`base64-${index}`}
                          src={photo}
                          alt={`Additional photo ${index + 1}`}
                          className="rounded-md object-cover h-[150px] w-full cursor-pointer border"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ))}
                      {/* Legacy additional photos from URLs */}
                      {selectedVisit.additional_photos?.map((photo, index) => (
                        <img 
                          key={`url-${index}`}
                          src={photo}
                          alt={`Additional photo ${index + 1}`}
                          className="rounded-md object-cover h-[150px] w-full cursor-pointer border"
                          onClick={() => window.open(photo, '_blank')}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
