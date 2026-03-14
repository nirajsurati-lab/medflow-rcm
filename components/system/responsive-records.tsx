import type { ReactNode } from "react";

import { DataTable, type DataTableColumn } from "@/components/system/data-table";
import { EmptyState } from "@/components/workspace/shared/empty-state";
import { cn } from "@/lib/utils";

type ResponsiveRecordsProps<Row> = {
  columns: DataTableColumn[];
  rows: Row[];
  getRowKey: (row: Row) => string;
  renderTableRow: (row: Row) => ReactNode;
  renderMobileCard: (row: Row) => ReactNode;
  emptyMessage: string;
  emptyDetail?: string;
  emptyAction?: ReactNode;
  className?: string;
  tableClassName?: string;
  mobileClassName?: string;
};

export function ResponsiveRecords<Row>({
  columns,
  rows,
  getRowKey,
  renderTableRow,
  renderMobileCard,
  emptyMessage,
  emptyDetail,
  emptyAction,
  className,
  tableClassName,
  mobileClassName,
}: ResponsiveRecordsProps<Row>) {
  if (rows.length === 0) {
    return (
      <EmptyState
        className={className}
        message={emptyMessage}
        detail={emptyDetail}
        action={emptyAction}
      />
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="hidden md:block">
        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={getRowKey}
          renderRow={renderTableRow}
          emptyMessage={emptyMessage}
          className={tableClassName}
        />
      </div>
      <div className={cn("grid gap-3 md:hidden", mobileClassName)}>
        {rows.map((row) => (
          <div key={getRowKey(row)}>{renderMobileCard(row)}</div>
        ))}
      </div>
    </div>
  );
}
