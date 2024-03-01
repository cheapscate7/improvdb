"use client";

import {
  ResourcePublicationStatus,
} from "@prisma/client";
import { ExclamationTriangleIcon } from "@radix-ui/react-icons";
import {
  type ColumnDef,
  createColumnHelper,
  type Row,
} from "@tanstack/react-table";
import type { UseTRPCQueryResult } from "@trpc/react-query/shared";
import Link from "next/link";

import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { TitleCellContent } from "@/components/data-table/data-table-title-cell-content";
import {
  ResourceConfigurationLabels,
  ResourceTypeLabels,
} from "@/components/resource";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { type RouterOutputs } from "@/utils/api";

type CategoriesInResource =
  RouterOutputs["resource"]["getAll"][0]["categories"];

type SingleResourceType = RouterOutputs["resource"]["getAll"][0];

const columnHelper = createColumnHelper<SingleResourceType>();

function getColumns({
  showPublishedStatus,
  showEditProposals,
  showSelection,
  useFilters,
}: {
  showPublishedStatus: boolean;
  showEditProposals: boolean;
  showSelection: boolean;
  useFilters: boolean;
}) {
  const columns = [
    columnHelper.accessor("type", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={column.id} />
      ),
      cell: (props) => ResourceTypeLabels[props.getValue()],
      filterFn: "arrIncludesSome",
    }),
    columnHelper.accessor("configuration", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={column.id} />
      ),
      cell: (props) => ResourceConfigurationLabels[props.getValue()],
      filterFn: "arrIncludesSome",
    }),
    columnHelper.accessor("categories", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={column.id} />
      ),
      cell: (props) => (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {(props.getValue() ?? [])
            .sort(({ name: a }, { name: b }) => a.localeCompare(b))
            .map(({ id, name }) => {
              return <Badge key={id}>{name}</Badge>;
            })}
        </div>
      ),
      filterFn: (row, columnId, value: string[]) => {
        const categories = row.getValue<CategoriesInResource>("categories");

        return value.some((v) => categories.find(({ id }) => v === id));
      },
      getUniqueValues: (row) => {
        return row.categories.map(({ id }) => id);
      },
    }),
    columnHelper.accessor("alternativeNames", {
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title={"Alternative Names"} />
      ),
      cell: (props) => {
        const names = props.getValue();
        if (!names) return null;

        return (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {names.split(";").map((name) => (
              <Badge variant="outline" key={name}>
                {name}
              </Badge>
            ))}
          </div>
        );
      },
    }),
  ] as Array<ColumnDef<SingleResourceType, unknown>>;

  if (showPublishedStatus) {
    columns.push(
      columnHelper.accessor("publicationStatus", {
        header: ({ column }) => (
          <DataTableColumnHeader column={column} title={"Publication Status"} />
        ),
        cell: (props) => {
          const publicationStatus = props.getValue();
          const text = publicationStatus === ResourcePublicationStatus.PUBLISHED ? "Published" : 
          publicationStatus === ResourcePublicationStatus.READY_FOR_REVIEW ? "Pending" : "Draft";
          // const text = "hi"
          return (
            <Badge
              className={cn(
                "self-start text-white",
                publicationStatus === ResourcePublicationStatus.PUBLISHED && "bg-green-700",
                publicationStatus === ResourcePublicationStatus.READY_FOR_REVIEW && "bg-orange-600",
                publicationStatus === ResourcePublicationStatus.DRAFT && "bg-blue-600",
              )}
            >
              {text}
            </Badge>
          );
        },
      }) ,
    );
  }

  if (showEditProposals) {
    columns.push(
      columnHelper.accessor("editProposalOriginalResourceId", {
        header: () => null,
        cell: (props) => {
          const originalResourceId = props.getValue();
          return originalResourceId && <Badge>Proposal</Badge>;
        },
      }) as ColumnDef<SingleResourceType, unknown>,
    );
  }

  if (showSelection) {
    columns.unshift(
      columnHelper.accessor("title", {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={column.id}
            className="ml-2"
          />
        ),
        cell: ({ getValue, column: { getFilterValue } }) => (
          <TitleCellContent
            title={getValue()}
            filter={getFilterValue() as string}
          />
        ),
      }) as ColumnDef<SingleResourceType, unknown>,
    );

    columns.unshift(
      columnHelper.display({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      }),
    );
  } else {
    columns.unshift(
      columnHelper.accessor("title", {
        header: ({ column }) => (
          <DataTableColumnHeader
            column={column}
            title={column.id}
            className="ml-2"
          />
        ),
        cell: ({ getValue, row, column: { getFilterValue } }) => (
          <Link
            href={`/resource/${row.original.id}`}
            className="hover:underline"
          >
            <TitleCellContent
              title={getValue()}
              filter={getFilterValue() as string}
            />
          </Link>
        ),
      }) as ColumnDef<SingleResourceType, unknown>,
    );
  }

  return useFilters
    ? columns
    : columns.map((column) => ({
        ...column,
        enableSorting: false,
        enableHiding: false,
      }));
}

export const ResourceList = ({
  useFilters = false,
  usePagination = false,
  queryResult,
  showPublishedStatus = false,
  showEditProposals = false,
  onSelectionChange,
}: {
  useFilters?: boolean;
  usePagination?: boolean;
  queryResult: UseTRPCQueryResult<RouterOutputs["resource"]["getAll"], unknown>;
  showPublishedStatus?: boolean;
  showEditProposals?: boolean;
  onSelectionChange?: (
    selectedRows: Row<RouterOutputs["resource"]["getAll"][0]>[],
  ) => void;
}) => {
  const { data, isLoading } = queryResult;

  if (!isLoading && !data) {
    return (
      <Alert variant="destructive">
        <ExclamationTriangleIcon className="h-4 w-4" />
        <AlertTitle>Oh no!</AlertTitle>
        <AlertDescription>
          Something went wrong. Please try reloading the page.
        </AlertDescription>
      </Alert>
    );
  }

  const columns = getColumns({
    showPublishedStatus,
    showEditProposals,
    showSelection: !!onSelectionChange,
    useFilters,
  });

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      filters={
        useFilters
          ? ["title", "type", "configuration", "categories"]
          : undefined
      }
      usePagination={usePagination}
      hiddenColumnsByDefault={["alternativeNames"]}
      hiddenColumnsOnMobile={["categories", "configuration"]}
      onSelectionChange={onSelectionChange}
    />
  );
};
