import { useState, useEffect } from 'react';
import React from 'react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
// Inline Select component to avoid import issues
const InlineSelect = ({ value, onValueChange, children, placeholder }: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, width: 0 });
  const triggerRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node) && 
          dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
    setIsOpen(!isOpen);
  };
  
  return (
    <>
      <div className="relative w-full" ref={triggerRef}>
        <div 
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-gray-900 dark:text-gray-100 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 cursor-pointer"
          onClick={handleToggle}
        >
          <span className="flex-1 text-gray-900 dark:text-gray-100">{value || placeholder}</span>
          <svg className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-48 overflow-y-auto" 
          style={{ 
            top: `${dropdownPosition.top}px`, 
            left: `${dropdownPosition.left}px`, 
            width: `${Math.min(dropdownPosition.width, 200)}px`,
            zIndex: 99999 
          }}
        >
          <div className="py-1">
            {React.Children.map(children, (child) => {
              if (React.isValidElement(child)) {
                const childProps = child.props as any;
                if (childProps['data-value']) {
                  return (
                    <div
                      className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                      onClick={() => {
                        onValueChange?.(childProps['data-value']);
                        setIsOpen(false);
                      }}
                    >
                      {childProps.children}
                    </div>
                  );
                }
              }
              return child;
            })}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Filter, RefreshCw, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { fetchSupportComplaints, updateSupportComplaint, type SupportComplaint } from '@/api/ecgApi';

interface SupportComplaintsProps {
  className?: string;
}

export default function SupportComplaints({ className }: SupportComplaintsProps) {
  const [complaints, setComplaints] = useState<SupportComplaint[]>([]);
  const [filteredComplaints, setFilteredComplaints] = useState<SupportComplaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedComplaint, setSelectedComplaint] = useState<SupportComplaint | null>(null);
  const [notes, setNotes] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch complaints on component mount
  useEffect(() => {
    fetchComplaints();
  }, []);

  // Filter complaints based on search and filters
  useEffect(() => {
    let filtered = complaints;

    if (searchTerm) {
    //   
    const safe = (val: any) => String(val || "").toLowerCase();

      filtered = filtered.filter(c =>
      safe(c.id).includes(searchTerm.toLowerCase()) ||
      safe(c.name).includes(searchTerm.toLowerCase()) ||
      safe(c.machine_id).includes(searchTerm.toLowerCase()) ||
      safe(c.complaint).includes(searchTerm.toLowerCase()) ||
      safe(c.source).includes(searchTerm.toLowerCase())
);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(complaint => complaint.priority === priorityFilter);
    }

    setFilteredComplaints(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [complaints, searchTerm, statusFilter, priorityFilter]);

  // Pagination logic
  const totalPages = Math.ceil(filteredComplaints.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedComplaints = filteredComplaints.slice(startIndex, endIndex);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const data = await fetchSupportComplaints();
      
      if (data.success) {
        setComplaints(data.complaints || []);
      } else {
        console.error('Failed to fetch complaints');
      }
    } catch (error) {
      console.error('Error fetching complaints:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateComplaintStatus = async (id: string, status: string) => {
    try {
      setUpdatingId(id);
      const data = await updateSupportComplaint(id, { 
        status,
        notes: notes || undefined
      });
      
      if (data.success) {
        // Update local state
        setComplaints(prev => 
          prev.map(complaint => 
            complaint.id === id 
              ? { 
                  ...complaint, 
                  status: status as SupportComplaint['status'],
                  notes: notes || complaint.notes,
                  updated_at: new Date().toISOString(),
                  resolved_at: status === 'resolved'  ? new Date().toISOString() : complaint.resolved_at
                }
              : complaint
          )
        );
        
        if (selectedComplaint?.id === id) {
          setSelectedComplaint(prev => prev ? {
            ...prev,
            status: status as SupportComplaint['status'],
            notes: notes || prev.notes,
            updated_at: new Date().toISOString(),
            resolved_at: status === 'resolved' ? new Date().toISOString() : prev.resolved_at
          } : null);
        }
        
        setNotes(''); // Clear notes after update
      } else {
        console.error('Failed to update complaint');
      }
    } catch (error) {
      console.error('Error updating complaint:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      // case 'closed':
      //   return <XCircle className="w-4 h-4 text-gray-500" />;
      // case 'in_progress':
      //   return <Clock className="w-4 h-4 text-blue-500" />;
      case 'open':
        return <AlertCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
  switch (status) {
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
    case 'open':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
    default:
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
  }
};

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Support Complaints</h2>
          <p className="text-gray-900 dark:text-white">Manage and track customer support complaints</p>
        </div>
        <Button onClick={fetchComplaints} variant="outline" className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-visible">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-visible relative">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search complaints..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <InlineSelect value={statusFilter} onValueChange={setStatusFilter} placeholder="Status">
              <div data-value="all">All Status</div>
              <div data-value="pending">Pending</div>
              <div data-value="open">Open</div>
              <div data-value="in_progress">In Progress</div>
              <div data-value="resolved">Resolved</div>
              <div data-value="closed">Closed</div>
            </InlineSelect>
            <InlineSelect value={priorityFilter} onValueChange={setPriorityFilter} placeholder="Priority">
              <div data-value="all">All Priority</div>
              <div data-value="low">Low</div>
              <div data-value="medium">Medium</div>
              <div data-value="high">High</div>
              <div data-value="critical">Critical</div>
            </InlineSelect>
            <Button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setPriorityFilter('all');
                setCurrentPage(1);
              }}
              variant="outline"
              className="gap-1 text-xs px-4 py-3 h-9 w-14"
            >
              Reset
            </Button>
            <div className="text-sm text-gray-900 dark:text-white flex items-center">
              {filteredComplaints.length} of {complaints.length} complaints
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complaints Table */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-visible">
        <CardHeader>
          <CardTitle className="text-gray-900 dark:text-white">Complaints ({filteredComplaints.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-gray-700 dark:text-gray-300">ID</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Name</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Machine ID</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Complaint</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Source</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Priority</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Created</TableHead>
                  <TableHead className="text-gray-700 dark:text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedComplaints.map((complaint) => (
                  <TableRow key={complaint.id}>
                    <TableCell className="font-medium text-gray-900 dark:text-white">{complaint.id}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{complaint.name}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{complaint.machine_id}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">
                      <div className="max-w-xs truncate" title={complaint.complaint}>
                        {complaint.complaint}
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{complaint.source}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(complaint.status)}>
                        <span className="flex items-center gap-1">
                          {getStatusIcon(complaint.status)}
                          {complaint.status}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(complaint.priority || 'medium')}>
                        {complaint.priority || 'medium'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{formatDate(complaint.created_at)}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        onClick={() => setSelectedComplaint(complaint)}
                      >
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            {filteredComplaints.length === 0 ? (
              <div className="text-center py-8 text-gray-900 dark:text-white">
                No complaints found matching the current filters.
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredComplaints.length)} of {filteredComplaints.length} complaints
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    className="px-3 py-1 h-8"
                  >
                    Previous
                  </Button>
                  <span className="flex items-center px-3 text-sm text-gray-900 dark:text-white">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    className="px-3 py-1 h-8"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedComplaint && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedComplaint(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-xl font-bold">Complaint Details</h3>
              <Button
                variant="ghost"
                onClick={() => setSelectedComplaint(null)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">ID</label>
                  <p className="font-mono text-gray-900 dark:text-white">{selectedComplaint.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Name</label>
                  <p className="text-gray-900 dark:text-white">{selectedComplaint.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Machine ID</label>
                  <p className="font-mono text-gray-900 dark:text-white">{selectedComplaint.machine_id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Source</label>
                  <p className="text-gray-900 dark:text-white">{selectedComplaint.source}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Status</label>
                  <div className="mt-1">
                    <Badge className={getStatusColor(selectedComplaint.status)}>
                      <span className="flex items-center gap-1">
                        {getStatusIcon(selectedComplaint.status)}
                        {selectedComplaint.status}
                      </span>
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Priority</label>
                  <div className="mt-1">
                    <Badge className={getPriorityColor(selectedComplaint.priority || 'medium')}>
                      {selectedComplaint.priority || 'medium'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Created</label>
                  <p className="text-gray-900 dark:text-white">{formatDate(selectedComplaint.created_at)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Updated</label>
                  <p className="text-gray-900 dark:text-white">{formatDate(selectedComplaint.updated_at)}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Complaint</label>
                <p className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                  {selectedComplaint.complaint}
                </p>
              </div>

              {selectedComplaint.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-900 dark:text-white">Notes</label>
                  <p className="mt-1 p-3 bg-gray-50 dark:bg-gray-700 rounded-md text-gray-900 dark:text-white">
                    {selectedComplaint.notes}
                  </p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-900 dark:text-white">Add Notes</label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes about this complaint..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-4">

  {selectedComplaint.status === 'open' && (
    <Button
      onClick={() => updateComplaintStatus(selectedComplaint.id, 'resolved')}
      disabled={updatingId === selectedComplaint.id}
      className="bg-green-500 hover:bg-green-600"
    >
      {updatingId === selectedComplaint.id ? 'Updating...' : 'Mark Resolved'}
    </Button>
  )}

  <Button
    variant="outline"
    onClick={() => setSelectedComplaint(null)}
  >
    Cancel
  </Button>

</div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
