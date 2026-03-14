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

export type DataTableColumn = {
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
    <div className="overflow-hidden rounded-[26px] border border-border/70 bg-white/65 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
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
                className={cn("py-12 text-center text-muted-foreground", emptyClassName)}
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
