import type { ReactNode } from "react";

type Column<T> = {
  header: string;
  cell: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  rows: T[];
  columns: Column<T>[];
  getKey: (row: T) => string;
};

export function DataTable<T>({ rows, columns, getKey }: DataTableProps<T>) {
  return (
    <div className="overflow-hidden rounded-onco border border-onco-line bg-white">
      <table className="w-full text-left text-sm">
        <thead className="bg-onco-cream text-[11px] uppercase tracking-[0.06em] text-onco-muted-light">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3 font-bold" key={column.header}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-onco-line">
          {rows.map((row) => (
            <tr className="hover:bg-onco-cream/60" key={getKey(row)}>
              {columns.map((column) => (
                <td className="px-4 py-3 align-middle" key={column.header}>
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

