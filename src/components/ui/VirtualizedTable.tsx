import React from 'react';

interface VirtualizedTableProps {
  items: any[];
  columns: Array<{
    key: string;
    label: string;
    render?: (item: any) => React.ReactNode;
  }>;
  height?: number;
}

const VirtualizedTable: React.FC<VirtualizedTableProps> = ({ 
  items, 
  columns, 
  height = 400 
}) => {
  return (
    <div className="overflow-auto" style={{ height }}>
      <table className="min-w-full divide-y divide-border">
        <thead className="bg-muted sticky top-0">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {items.map((item, index) => (
            <tr key={index} className="hover:bg-muted/50">
              {columns.map((column) => (
                <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm">
                  {column.render ? column.render(item) : item[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default VirtualizedTable;