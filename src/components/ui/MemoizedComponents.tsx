import React from 'react';

export const MemoizedCard = React.memo(({ children, ...props }: any) => {
  return <div {...props}>{children}</div>;
});

export const MemoizedTable = React.memo(({ children, ...props }: any) => {
  return <table {...props}>{children}</table>;
});

export const MemoizedTableRow = React.memo(({ children, ...props }: any) => {
  return <tr {...props}>{children}</tr>;
});

MemoizedCard.displayName = 'MemoizedCard';
MemoizedTable.displayName = 'MemoizedTable';
MemoizedTableRow.displayName = 'MemoizedTableRow';