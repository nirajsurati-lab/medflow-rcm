import { Fragment, type ReactNode } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataTableColumn = {
  key: string;
  label: string;
  className?: string;
};

type DataTableProps<Row> = {
  columns: DataTableColumn[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  renderRow: (row: Row) => ReactNode;
  emptyMessage: string;
  className?: string;
  emptyClassName?: string;
};

export function DataTable<Row>({
  columns,
  rows,
  getRowKey,
  renderRow,
  emptyMessage,
  className,
  emptyClassName,
}: DataTableProps<Row>) {
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          {columns.map((column) => (
            <TableHead key={column.key} className={column.className}>
              {column.label}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length > 0 ? (
          rows.map((row) => (
            <Fragment key={getRowKey(row)}>{renderRow(row)}</Fragment>
          ))
        ) : (
          <TableRow>
            <TableCell
              colSpan={columns.length}
              className={cn("py-8 text-center text-slate-500", emptyClassName)}
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
