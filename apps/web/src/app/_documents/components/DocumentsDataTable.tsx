'use client';

import { useSuspenseInfiniteQuery } from '@tanstack/react-query';

import DataTable from '@/app/_ui/components/DataTable/DataTable';
import useTRPC from '@/lib/trpc/browser';

import { documentsTableColumns } from '../table-columns/DocumentsTableColumns';

const DocumentsDataTable = () => {
  const api = useTRPC();

  const { data: documentData } = useSuspenseInfiniteQuery(
    api.documents.getMany.infiniteQueryOptions(
      {
        cursor: 0,
        limit: 100
      },
      {
        getNextPageParam: (lastPage) => {
          return lastPage.meta.nextCursor;
        },
        getPreviousPageParam: (firstPage) => {
          return firstPage.meta.previousCursor;
        }
      }
    )
  );

  const documents = documentData.pages.flatMap((page) => page.data) ?? [];

  return <DataTable columns={documentsTableColumns} data={documents} />;
};

export default DocumentsDataTable;
