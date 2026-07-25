import React, { useState, useEffect } from 'react'
import { useQueryClient, useQuery } from '@tanstack/react-query'
import { getClients } from '@/services/clients'
import { useReactTable, getCoreRowModel, getPaginationRowModel, getFilteredRowModel, flexRender, getSortedRowModel } from '@tanstack/react-table';
import { SearchIcon, ChevronUpIcon, ChevronDownIcon } from 'lucide-react'

const columns = [
    {
        accessorKey: 'id',
        header: 'ID',
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: 'full_name',
        header: 'Nombre Completo',
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: 'phone',
        header: 'Teléfono',
        cell: (info) => info.getValue(),
    },
    {
        accessorKey: 'email',
        header: 'Correo Electrónico',
        cell: (info) => info.getValue(),
    },
]

export default function ClientsTable({ onPageChange, filterValue, setFilterValue, sorting, setSorting }) {
    const queryClient = useQueryClient()
    const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' })

    const [{ pageIndex, pageSize }, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const { data, isLoading, error } = useQuery({
        queryKey: ['clients', pageIndex, pageSize],
        queryFn: () => getClients({ pageIndex, pageSize, organization_id: currentOrgId }),
        keepPreviousData: true,
    });

    const handleSort = (key) => {
        let direction = 'ascending'
        if (sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending'
        }
        setSortConfig({ key, direction })
    }

    const renderSortIndicator = (key) => {
        if (sortConfig.key !== key) return null
        return sortConfig.direction === 'ascending' ? '▲' : '▼'
    }

    const handlePrevPage = () => {
        if (pageIndex > 0) onPageChange(pageIndex - 1)
    }

    const handleNextPage = () => {
        if (data?.pageCount && pageIndex < data.pageCount - 1) {
            onPageChange(pageIndex + 1)
        }
    }

    const table = useReactTable({
        data: data,
        columns: columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        state: {
            globalFilter: filterValue,
            sorting: sorting
        },
        onGlobalFilterChange: setFilterValue,
        onSortingChange: setSorting,
    });

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-8">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        )
    }

    if (error) {
        return <div className="alert alert-error">Error cargando clientes</div>
    }

    return (
        <div className="overflow-x-auto rounded-box border border-base-200 bg-base-100">
            <table className="table">
                {/* head */}
                <thead className='bg-base-100'>
                    <tr>
                        <th>
                            <label>
                                <input type="checkbox" className="checkbox" />
                            </label>
                        </th>

                        {table.getHeaderGroups().map(headerGroup => (
                            headerGroup.headers.map(header => (
                                <th key={headerGroup.id + header.id} onClick={header.column.getToggleSortingHandler()}>
                                    <span className="inline-flex items-center gap-1">
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                        {
                                            { asc: <ChevronUpIcon />, desc: <ChevronDownIcon /> }[header.column.getIsSorted()] ?? null
                                        }
                                    </span>
                                </th>
                            ))
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {
                        table.getRowModel().rows.map(row => (
                            <tr key={row.id} className='hover:bg-base-100'>
                                <th>
                                    <label>
                                        <input type="checkbox" className="checkbox" />
                                    </label>
                                </th>
                                {row.getVisibleCells().map(cell => (
                                    <td key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </td>
                                ))}
                            </tr>
                        ))
                    }
                </tbody>
                <tfoot className='shadow-md'>
                    <tr>
                        <th></th>
                        {table.getFooterGroups().map(footerGroup => (
                            footerGroup.headers.map(footer => (
                                <th key={footerGroup.id + footer.id}>
                                    {flexRender(footer.column.columnDef.footer, footer.getContext())}
                                </th>
                            ))
                        ))}
                    </tr>
                </tfoot>
            </table>
        </div>
    )
}
