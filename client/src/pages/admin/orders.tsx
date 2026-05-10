import { useState, useMemo, ChangeEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { navigateBackToDashboard } from "@/lib/navigation-utils";
import { format, formatDistanceToNow, subDays, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { 
  Trash2, 
  RefreshCw
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  ArrowLeft,
  Download,
  Eye,
  Filter,
  Package,
  Search,
  Truck,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/utils";

export default function OrdersManagement() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("orders");
  const [timeRange, setTimeRange] = useState("30");
  const itemsPerPage = 10;

  // Fetch all orders
  const { data: orders, isLoading } = useQuery({
    queryKey: ["/api/admin/orders"],
  });

  // Filter orders based on search term and filters
  const filteredOrders = useMemo(() => {
    if (!orders) return [];
    
    return orders.filter((order: any) => {
      const matchesSearch = searchTerm === "" || 
        order.id.toString().includes(searchTerm) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerEmail.toLowerCase().includes(searchTerm.toLowerCase());
        
      const matchesStatus = statusFilter === "" || order.status === statusFilter;
      const matchesType = typeFilter === "" || order.orderType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [orders, searchTerm, statusFilter, typeFilter]);

  // Paginate orders
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredOrders.slice(startIndex, endIndex);
  }, [filteredOrders, currentPage]);

  // Calculate total pages
  const totalPages = useMemo(() => {
    return Math.ceil(filteredOrders.length / itemsPerPage);
  }, [filteredOrders]);

  // Function to handle search
  const handleSearch = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Function to handle status filter
  const handleStatusFilter = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Function to handle type filter
  const handleTypeFilter = (value: string) => {
    setTypeFilter(value);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Get status badge variant based on order status
  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case "processing":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Processing</Badge>;
      case "shipped":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Shipped</Badge>;
      case "delivered":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Delivered</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">Completed</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Cancelled</Badge>;
      case "refunded":
        return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Refunded</Badge>;
      case "sent_to_printful":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sent to Printful</Badge>;
      case "sent_to_gooten":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">Sent to Gooten</Badge>;
      case "in_production":
        return <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">In Production</Badge>;
      case "on_hold":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">On Hold</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Function to format date as relative time
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (error) {
      return dateString;
    }
  };

  // Order type icon
  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case "digital":
        return <Download className="h-4 w-4 text-purple-500" />;
      case "print-on-demand":
        return <Truck className="h-4 w-4 text-orange-500" />;
      default:
        return <Package className="h-4 w-4 text-blue-500" />;
    }
  };

  // Pagination controls
  const renderPaginationItems = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    // Always show first page
    if (currentPage > 3) {
      pages.push(
        <PaginationItem key="first">
          <PaginationLink onClick={() => setCurrentPage(1)}>1</PaginationLink>
        </PaginationItem>
      );
      
      if (currentPage > 4) {
        pages.push(
          <PaginationItem key="ellipsis-start">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }
    }
    
    // Calculate start and end page
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    
    // Adjust if we're near the end
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Add middle pages
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <PaginationItem key={i}>
          <PaginationLink 
            onClick={() => setCurrentPage(i)} 
            isActive={currentPage === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    // Always show last page
    if (currentPage < totalPages - 2) {
      if (currentPage < totalPages - 3) {
        pages.push(
          <PaginationItem key="ellipsis-end">
            <span className="px-4">...</span>
          </PaginationItem>
        );
      }
      
      pages.push(
        <PaginationItem key="last">
          <PaginationLink onClick={() => setCurrentPage(totalPages)}>
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }
    
    return pages;
  };

  // Calculate order statistics
  const orderStats = useMemo(() => {
    if (!orders || !orders.length) {
      return {
        total: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        completed: 0,
        cancelled: 0,
        revenue: 0
      };
    }

    const totalRevenue = orders.reduce((acc: number, order: any) => {
      // Exclude cancelled orders from revenue calculation
      if (order.status === "cancelled") {
        return acc;
      }
      return acc + (order.totalAmount || 0);
    }, 0);

    return {
      total: orders.length,
      pending: orders.filter((o: any) => o.status === "pending").length,
      processing: orders.filter((o: any) => o.status === "processing").length,
      shipped: orders.filter((o: any) => o.status === "shipped").length,
      completed: orders.filter((o: any) => o.status === "completed").length,
      cancelled: orders.filter((o: any) => o.status === "cancelled").length,
      revenue: totalRevenue
    };
  }, [orders]);
  
  // Generate sales chart data
  const salesChartData = useMemo(() => {
    if (!orders || !orders.length) {
      return [];
    }
    
    // Determine date range based on selected time range
    const days = parseInt(timeRange);
    const today = new Date();
    const startDate = subDays(today, days);
    
    // Create a map of dates to revenue
    const dateRevenueMap: Record<string, number> = {};
    
    // Initialize all dates in the range with 0 revenue
    for (let i = 0; i <= days; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      dateRevenueMap[dateStr] = 0;
    }
    
    // Aggregate order revenues by date (excluding cancelled orders)
    orders.forEach((order: any) => {
      if (!order.createdAt || order.status === "cancelled") return;
      
      try {
        const orderDate = parseISO(order.createdAt);
        if (orderDate >= startDate) {
          const dateStr = format(orderDate, 'yyyy-MM-dd');
          dateRevenueMap[dateStr] = (dateRevenueMap[dateStr] || 0) + (order.totalAmount || 0);
        }
      } catch (error) {
        console.error('Error parsing date:', error);
      }
    });
    
    // Convert map to array for recharts
    return Object.entries(dateRevenueMap)
      .map(([date, amount]) => ({
        date,
        revenue: amount / 100, // Convert cents to dollars
        displayDate: format(parseISO(date), 'MMM d')
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [orders, timeRange]);
  
  // Expenses state - starts empty for real business use
  const [expenses, setExpenses] = useState([]);
  
  // New expense form state
  const [newExpense, setNewExpense] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    category: '',
    description: '',
    amount: '',
    recurring: false,
    frequency: 'monthly'
  });
  
  // Handle form input changes
  const handleExpenseInputChange = (field: string, value: string | boolean) => {
    setNewExpense({
      ...newExpense,
      [field]: value
    });
  };
  
  // Add new expense
  const addExpense = () => {
    const amount = parseFloat(newExpense.amount);
    if (!newExpense.date || !newExpense.category || !newExpense.description || isNaN(amount) || amount <= 0) {
      return; // Form validation - in a real app, show an error message
    }
    
    const newId = Math.max(0, ...expenses.map(e => e.id)) + 1;
    
    setExpenses([
      ...expenses,
      {
        id: newId,
        date: newExpense.date,
        category: newExpense.category,
        description: newExpense.description,
        amount: amount,
        recurring: newExpense.recurring,
        frequency: newExpense.recurring ? newExpense.frequency : undefined
      }
    ]);
    
    // Reset form
    setNewExpense({
      date: format(new Date(), 'yyyy-MM-dd'),
      category: '',
      description: '',
      amount: '',
      recurring: false,
      frequency: 'monthly'
    });
  };
  
  // Delete expense function
  const deleteExpense = (id: number) => {
    setExpenses(expenses.filter(expense => expense.id !== id));
  };
  
  // Get recurring expenses summary
  const recurringExpensesSummary = useMemo(() => {
    const recurring = expenses.filter(expense => expense.recurring);
    
    const byFrequency = {
      weekly: recurring.filter(e => e.frequency === 'weekly').reduce((sum, e) => sum + e.amount, 0),
      monthly: recurring.filter(e => e.frequency === 'monthly').reduce((sum, e) => sum + e.amount, 0),
      quarterly: recurring.filter(e => e.frequency === 'quarterly').reduce((sum, e) => sum + e.amount, 0),
      yearly: recurring.filter(e => e.frequency === 'yearly').reduce((sum, e) => sum + e.amount, 0)
    };
    
    return {
      total: recurring.reduce((sum, e) => sum + e.amount, 0),
      byFrequency
    };
  }, [expenses]);
  
  // Calculate profit data based on orders and expenses
  const profitData = useMemo(() => {
    if (!orders || !orders.length) {
      return {
        totalRevenue: 0,
        totalExpenses: expenses.reduce((sum, expense) => sum + expense.amount, 0),
        profit: -expenses.reduce((sum, expense) => sum + expense.amount, 0),
        profitMargin: 0
      };
    }
    
    const totalRevenue = orders.reduce((acc: number, order: any) => {
      // Exclude cancelled orders from revenue calculation
      if (order.status === "cancelled") {
        return acc;
      }
      return acc + (order.totalAmount || 0);
    }, 0) / 100; // Convert cents to dollars
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const profit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
    
    return {
      totalRevenue,
      totalExpenses,
      profit,
      profitMargin
    };
  }, [orders, expenses]);

  // Custom search input with icon
  const SearchInput = ({ value, onChange, placeholder }: { 
    value: string; 
    onChange: (e: ChangeEvent<HTMLInputElement>) => void; 
    placeholder: string;
  }) => (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
      <Input
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="pl-10"
      />
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigateBackToDashboard(navigate)}
              className="text-muted-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-3xl font-serif">Orders Management</h1>
          <p className="text-muted-foreground">
            View and manage all customer orders, track sales, and analyze business performance
          </p>
        </div>
      </div>

      {/* Tab Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="sales">Sales Analytics</TabsTrigger>
          <TabsTrigger value="expenses">Expenses & Profit</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Orders Tab Content */}
      {activeTab === "orders" && (
        <>
          {/* Order Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Total Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : orderStats.total}
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  All time orders
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Pending Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : orderStats.pending}
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  Awaiting processing
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Shipped Orders</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : orderStats.shipped}
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  In transit to customers
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-xl">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(orderStats.revenue / 100)
                  )}
                </div>
                <p className="text-muted-foreground text-sm mt-1">
                  From all orders
                </p>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      
      {/* Sales Analytics Tab Content */}
      {activeTab === "sales" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
            <Card className="lg:col-span-3">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Sales Over Time</CardTitle>
                  <Select 
                    value={timeRange} 
                    onValueChange={setTimeRange}
                  >
                    <SelectTrigger className="w-36">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Last 7 days</SelectItem>
                      <SelectItem value="30">Last 30 days</SelectItem>
                      <SelectItem value="90">Last 90 days</SelectItem>
                      <SelectItem value="365">Last year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <CardDescription>
                  Track your sales trends over time
                </CardDescription>
              </CardHeader>
              <CardContent className="h-80">
                {salesChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={salesChartData}
                      margin={{
                        top: 5,
                        right: 10,
                        left: 10,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="displayDate" 
                        tickMargin={10}
                        tickFormatter={(value) => value}
                      />
                      <YAxis 
                        tickFormatter={(value) => `$${value}`}
                        tickMargin={10}
                      />
                      <Tooltip 
                        formatter={(value: any) => [`$${value.toFixed(2)}`, 'Revenue']}
                        labelFormatter={(label) => `Date: ${label}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="#8884d8"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                        name="Revenue"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No sales data available for this period</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sales Summary</CardTitle>
                <CardDescription>Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium">Total Sales</p>
                    <p className="text-2xl font-bold">{formatCurrency(profitData.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Average Order Value</p>
                    <p className="text-2xl font-bold">
                      {orderStats.total > 0 
                        ? formatCurrency(profitData.totalRevenue / orderStats.total) 
                        : '$0.00'
                      }
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Most Profitable Day</p>
                    <p className="text-lg font-medium">
                      {salesChartData.length > 0 
                        ? salesChartData.reduce((max, day) => day.revenue > max.revenue ? day : max, salesChartData[0]).displayDate
                        : 'N/A'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Manual Sales Entry</CardTitle>
              <CardDescription>
                Record sales that occurred outside of the website (e.g., in-person sales, exhibitions)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Date</label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amount</label>
                  <Input type="number" placeholder="0.00" min="0" step="0.01" />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Source</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exhibition">Exhibition</SelectItem>
                      <SelectItem value="gallery">Gallery</SelectItem>
                      <SelectItem value="personal">Personal Contact</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:self-end">
                  <Button className="w-full">Add Sale</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
      
      {/* Expenses & Profit Tab Content */}
      {activeTab === "expenses" && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Profit Analysis</CardTitle>
                <CardDescription>
                  Overview of revenue, expenses, and profit margin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-500">Revenue</p>
                    <p className="text-3xl font-bold text-blue-600">{formatCurrency(profitData.totalRevenue)}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-500">Expenses</p>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(profitData.totalExpenses)}</p>
                  </div>
                  <div className="space-y-2 p-4 bg-gray-50 rounded-md">
                    <p className="text-sm font-medium text-gray-500">Profit</p>
                    <p className={`text-3xl font-bold ${profitData.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(profitData.profit)}
                    </p>
                  </div>
                </div>
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm font-medium">Profit Margin</span>
                    <span className="text-sm font-medium">{profitData.profitMargin.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className={`h-2.5 rounded-full ${profitData.profitMargin >= 30 ? 'bg-green-600' : profitData.profitMargin >= 15 ? 'bg-yellow-500' : 'bg-red-600'}`}
                      style={{ width: `${Math.max(0, Math.min(100, profitData.profitMargin))}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {profitData.profitMargin >= 30 
                      ? 'Excellent profit margin! Your business is performing well.'
                      : profitData.profitMargin >= 15
                      ? 'Good profit margin, but there might be room for improvement.'
                      : 'Low profit margin. Consider reducing expenses or increasing prices.'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Add Expense</CardTitle>
                <CardDescription>
                  Record business expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <Input 
                      type="date" 
                      value={newExpense.date}
                      onChange={(e) => handleExpenseInputChange('date', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Category</label>
                    <Select
                      value={newExpense.category}
                      onValueChange={(value) => handleExpenseInputChange('category', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Materials">Materials</SelectItem>
                        <SelectItem value="Shipping">Shipping</SelectItem>
                        <SelectItem value="Marketing">Marketing</SelectItem>
                        <SelectItem value="Studio">Studio</SelectItem>
                        <SelectItem value="Utilities">Utilities</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <Input 
                      placeholder="Brief description" 
                      value={newExpense.description}
                      onChange={(e) => handleExpenseInputChange('description', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount</label>
                    <Input 
                      type="number" 
                      placeholder="0.00" 
                      min="0" 
                      step="0.01"
                      value={newExpense.amount}
                      onChange={(e) => handleExpenseInputChange('amount', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="recurring" 
                      checked={newExpense.recurring}
                      onCheckedChange={(checked) => handleExpenseInputChange('recurring', !!checked)}
                    />
                    <label
                      htmlFor="recurring"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      This is a recurring expense
                    </label>
                  </div>
                  {newExpense.recurring && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Frequency</label>
                      <Select
                        value={newExpense.frequency}
                        onValueChange={(value) => handleExpenseInputChange('frequency', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground mt-1">
                        Recurring expenses will be automatically tracked in your records at the specified frequency.
                      </p>
                    </div>
                  )}
                  <Button 
                    className="w-full"
                    onClick={addExpense}
                  >
                    Add Expense
                  </Button>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Recurring Expenses</CardTitle>
                <CardDescription>
                  Summary of your regular business expenses
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Monthly Recurring</span>
                      <span className="text-lg font-bold">{formatCurrency(recurringExpensesSummary.byFrequency.monthly)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Weekly Recurring</span>
                      <span className="text-lg font-bold">{formatCurrency(recurringExpensesSummary.byFrequency.weekly)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Quarterly Recurring</span>
                      <span className="text-lg font-bold">{formatCurrency(recurringExpensesSummary.byFrequency.quarterly)}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Total Yearly Recurring</span>
                      <span className="text-lg font-bold">{formatCurrency(recurringExpensesSummary.byFrequency.yearly)}</span>
                    </div>
                    <div className="h-px w-full bg-gray-200 my-4"></div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Estimated Annual Recurring Expenses</span>
                      <span className="text-xl font-bold text-red-600">
                        {formatCurrency(
                          recurringExpensesSummary.byFrequency.weekly * 52 +
                          recurringExpensesSummary.byFrequency.monthly * 12 +
                          recurringExpensesSummary.byFrequency.quarterly * 4 +
                          recurringExpensesSummary.byFrequency.yearly
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Expense History</CardTitle>
              <CardDescription>
                Record of all business expenses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="w-[80px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>{format(parseISO(expense.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{expense.category}</Badge>
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>
                        {expense.recurring ? (
                          <div className="flex items-center">
                            <Badge variant="secondary" className="flex gap-1 items-center">
                              <RefreshCw className="h-3 w-3" />
                              <span className="capitalize">{expense.frequency}</span>
                            </Badge>
                          </div>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground">One-time</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(expense.amount)}</TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteExpense(expense.id)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Order Filters</CardTitle>
          <CardDescription>
            Search and filter orders by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <SearchInput
                value={searchTerm}
                onChange={handleSearch}
                placeholder="Search by order ID, name or email"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={handleStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={typeFilter} onValueChange={handleTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="print-on-demand">Print on Demand</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Orders</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading orders..."
              : filteredOrders.length === 0
              ? "No orders found"
              : `Showing ${paginatedOrders.length} of ${filteredOrders.length} orders`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton className="h-12 w-12 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="text-right space-y-2">
                    <Skeleton className="h-4 w-16 ml-auto" />
                    <Skeleton className="h-4 w-24 ml-auto" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No orders match your search criteria.</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedOrders.map((order: any) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">#{order.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order.customerName}</p>
                          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(order.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(order.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getOrderTypeIcon(order.orderType)}
                          <span className="capitalize text-sm">
                            {order.orderType?.replace("-", " ") || "Physical"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.totalAmount / 100)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => navigate(`/admin/orders/${order.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {totalPages > 1 && (
                <div className="mt-6">
                  <div className="h-px w-full bg-gray-200 mb-4"></div>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                          isActive={currentPage !== 1}
                        />
                      </PaginationItem>
                      
                      {renderPaginationItems()}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                          isActive={currentPage !== totalPages}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}