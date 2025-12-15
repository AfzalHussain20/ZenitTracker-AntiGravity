
"use client"

import type { ManagedTestCase, ManagedTestCasePriority, ManagedTestCaseStatus } from "@/types";
import { ColumnDef } from "@tanstack/react-table";
import { format } from 'date-fns';
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, ArrowUp, ArrowDown, ArrowRight, XCircle, CheckCircle, Clock, ShieldQuestion, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DataTableColumnHeader } from "./data-table-column-header";

interface ColumnsProps {
  onEdit: (testCase: ManagedTestCase) => void;
  // onDelete: (testCaseId: string) => void; // Placeholder for future delete functionality
}

export const columns = ({ onEdit }: ColumnsProps): ColumnDef<ManagedTestCase>[] => [
  {
    accessorKey: "title",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Title" />,
    cell: ({ row }) => <div className="font-medium">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "module",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Module" />,
    cell: ({ row }) => <Badge variant="outline">{row.getValue("module")}</Badge>,
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Priority" />,
    cell: ({ row }) => {
      const priority: ManagedTestCasePriority = row.getValue("priority");
      const priorityMap: Record<ManagedTestCasePriority, { icon: React.ReactNode; color: string; label: string }> = {
        High: { icon: <ArrowUp className="h-4 w-4" />, color: 'text-red-500', label: 'High' },
        Medium: { icon: <ArrowRight className="h-4 w-4" />, color: 'text-yellow-500', label: 'Medium' },
        Low: { icon: <ArrowDown className="h-4 w-4" />, color: 'text-green-500', label: 'Low' },
      };
      const priorityInfo = priorityMap[priority];
      return <div className={`flex items-center gap-2 ${priorityInfo?.color}`}>
        {priorityInfo?.icon}
        <span>{priorityInfo?.label}</span>
      </div>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const status: ManagedTestCaseStatus = row.getValue("status");
      const statusMap: Record<ManagedTestCaseStatus, { icon: React.ReactNode; color: string; label: string }> = {
        'Pass': { icon: <CheckCircle className="h-4 w-4" />, color: 'text-green-500', label: 'Pass' },
        'Fail': { icon: <XCircle className="h-4 w-4" />, color: 'text-red-500', label: 'Fail' },
        'Blocked': { icon: <ShieldQuestion className="h-4 w-4" />, color: 'text-orange-500', label: 'Blocked' },
        'Not Run': { icon: <Clock className="h-4 w-4" />, color: 'text-muted-foreground', label: 'Not Run' },
      };
      const statusInfo = statusMap[status];
      return <div className={`flex items-center gap-2 ${statusInfo?.color}`}>
        {statusInfo?.icon}
        <span>{statusInfo?.label}</span>
      </div>;
    },
     filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "lastUpdatedBy",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated By" />,
  },
  {
    accessorKey: "updatedAt",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Updated" />,
    cell: ({ row }) => {
      const date = row.getValue("updatedAt") as Date;
      return <div className="text-muted-foreground">{format(date, "dd MMM yyyy")}</div>
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const testCase = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onEdit(testCase)}>
              Edit Test Case
            </DropdownMenuItem>
            <DropdownMenuItem disabled>Execute</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled className="text-destructive">
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
