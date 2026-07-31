import { supabaseClient } from "../../utils/supabase";

export async function createOrder({ organization_id, customer_id, status, total_estimated_cost, advance_payment, signature_data, notes_general, promised_date, items, }) {
    const { data, error } = await supabaseClient
        .from("tbl_service_orders")
        .insert({
            organization_id,
            customer_id,
            status,
            total_estimated_cost,
            advance_payment,
            signature_data,
            notes_general,
            promised_date,
        })
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    if (items && items.length > 0) {
        for (const item of items) {
            await createOrderItems({
                order_id: data.id,
                ...item,
            });
        }
    }

    return data;
}

async function createOrderItems({ order_id, item_type, description, initial_weight_grams, material_details, service_requested, unit_price, photo_ids }) {
    const { data, error } = await supabaseClient
        .from("tbl_order_items")
        .insert({
            service_order_id: order_id,
            item_type,
            description,
            initial_weight_grams,
            material_details,
            service_requested,
            unit_price,
            photo_ids,
        });

    if (error) {
        throw error;
    }
    return data;
}

export async function getOrderPreview({
    pageIndex = 0,
    pageSize = 10,
    organization_id = null,
    search = "",
    activeOnly = true,
    sortBy = "created_at",
    ascending = false,
} = {}) {
    const orgId = organization_id;
    const from = pageIndex * pageSize;
    const to = from + pageSize - 1;

    let query = supabaseClient
        .from("tbl_service_orders")
        .select("*", { count: "exact" });

    if (orgId) {
        query = query.eq("organization_id", orgId);
    }

    if (activeOnly) {
        query = query.eq("active", true);
    }

    if (search && search.trim() !== "") {
        const cleanSearch = search.trim().replace(/^#/, "");
        const term = `%${cleanSearch}%`;
        const num = Number(cleanSearch);

        if (!isNaN(num) && cleanSearch !== "") {
            query = query.or(`folio.eq.${num},status.ilike.${term}`);
        } else {
            query = query.or(`status.ilike.${term}`);
        }
    }

    query = query
        .order(sortBy, { ascending })
        .range(from, to);

    const { data, count, error } = await query;

    if (error) {
        throw error;
    }

    const pageCount = count ? Math.ceil(count / pageSize) : 0;

    return {
        data: data || [],
        count: count || 0,
        pageCount,
        pageIndex,
        pageSize,
    };
}

export async function recalculateOrderTotalCost(service_order_id) {
    if (!service_order_id) return 0;
    const items = await getOrderItems(service_order_id);
    const total = (items || []).reduce((sum, item) => sum + (parseFloat(item.unit_price) || 0), 0);

    const { error } = await supabaseClient
        .from("tbl_service_orders")
        .update({ total_estimated_cost: total })
        .eq("id", service_order_id);

    if (error) {
        console.error("Error recalculating order total cost:", error);
    }
    return total;
}

export async function getOrderDetail(id) {
    const { data, error } = await supabaseClient
        .from("tbl_service_orders")
        .select("*, tbl_customers(names, lastnames, phone, email)", { count: "exact" })
        .eq("id", id)
        .single();

    if (error) {
        throw error;
    }

    const order_items = await getOrderItems(id);

    // Sync total_estimated_cost if mismatch exists between order and sum of order items
    if (order_items && order_items.length > 0) {
        const calculatedTotal = order_items.reduce((sum, item) => sum + (parseFloat(item.unit_price) || 0), 0);
        if (parseFloat(data.total_estimated_cost) !== calculatedTotal) {
            await supabaseClient
                .from("tbl_service_orders")
                .update({ total_estimated_cost: calculatedTotal })
                .eq("id", id);
            data.total_estimated_cost = calculatedTotal;
        }
    }

    const finalData = {
        ...data,
        order_items
    }

    return finalData
}

export async function updateOrder(id, orderData) {
    const { data, error } = await supabaseClient
        .from("tbl_service_orders")
        .update(orderData)
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
        throw error;
    }
    return data;
}

export async function getOrderItems(id) {
    const { data, error } = await supabaseClient
        .from("tbl_order_items")
        .select("*", { count: "exact" })
        .eq("service_order_id", id);

    if (error) {
        throw error;
    }
    return data;
}

export async function createOrderItem(itemData) {
    const { data, error } = await supabaseClient
        .from("tbl_order_items")
        .insert(itemData)
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    if (itemData?.service_order_id) {
        await recalculateOrderTotalCost(itemData.service_order_id);
    }

    return data;
}

export async function updateOrderItem(id, itemData) {
    const { data, error } = await supabaseClient
        .from("tbl_order_items")
        .update(itemData)
        .eq("id", id)
        .select("*")
        .single();

    if (error) {
        throw error;
    }

    if (data?.service_order_id) {
        await recalculateOrderTotalCost(data.service_order_id);
    }

    return data;
}

export async function deleteOrderItem(id) {
    const { data: existingItem } = await supabaseClient
        .from("tbl_order_items")
        .select("service_order_id")
        .eq("id", id)
        .single();

    const { data, error } = await supabaseClient
        .from("tbl_order_items")
        .delete()
        .eq("id", id);

    if (error) {
        throw error;
    }

    if (existingItem?.service_order_id) {
        await recalculateOrderTotalCost(existingItem.service_order_id);
    }

    return data;
}

export async function quickSearchOrders({ organization_id, search = "" }) {
    if (!search || !search.trim()) return [];
    const term = search.trim();
    const cleanNum = term.replace(/^#/, "");
    const isNum = !isNaN(Number(cleanNum)) && cleanNum !== "";

    let query = supabaseClient
        .from("tbl_service_orders")
        .select("id, folio, status, promised_date, total_estimated_cost, advance_payment, created_at, tbl_customers(id, full_name, names, lastnames, phone)")
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(10);

    if (organization_id) {
        query = query.eq("organization_id", organization_id);
    }

    if (isNum) {
        query = query.or(`folio.eq.${cleanNum}`);
    } else {
        query = query.or(`status.ilike.%${term}%`);
    }

    const { data, error } = await query;
    if (error) {
        console.error("Error searching orders:", error);
    }

    let results = data || [];

    // Also search by customer name/phone if term is text or if no folio matches
    if (!isNum || results.length === 0) {
        try {
            const { searchClient } = await import("../clients/clientService");
            const matchingClients = await searchClient({ organization_id, search: term });
            if (matchingClients && matchingClients.length > 0) {
                const clientIds = matchingClients.map(c => c.id);
                let clientOrdersQuery = supabaseClient
                    .from("tbl_service_orders")
                    .select("id, folio, status, promised_date, total_estimated_cost, advance_payment, created_at, tbl_customers(id, full_name, names, lastnames, phone)")
                    .eq("active", true)
                    .in("customer_id", clientIds)
                    .order("created_at", { ascending: false })
                    .limit(10);

                if (organization_id) {
                    clientOrdersQuery = clientOrdersQuery.eq("organization_id", organization_id);
                }

                const { data: clientOrders } = await clientOrdersQuery;
                if (clientOrders && clientOrders.length > 0) {
                    const existingIds = new Set(results.map(r => r.id));
                    for (const co of clientOrders) {
                        if (!existingIds.has(co.id)) {
                            results.push(co);
                        }
                    }
                }
            }
        } catch (err) {
            console.error("Error fetching client orders for search:", err);
        }
    }

    return results;
}

export async function getHomeDashboardSummary({ organization_id }) {
    let query = supabaseClient
        .from("tbl_service_orders")
        .select("id, folio, status, promised_date, created_at, total_estimated_cost, advance_payment, tbl_customers(id, names, lastnames, full_name, phone)")
        .eq("active", true);

    if (organization_id) {
        query = query.eq("organization_id", organization_id);
    }

    const { data: orders, error } = await query;
    if (error) {
        throw error;
    }

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let inProgressCount = 0; // 🟡 En Reparación / Proceso
    let readyForPickupCount = 0; // 🟢 Listas para Entrega
    let deliveredThisMonthCount = 0; // 🔵 Entregadas este mes
    let overdueOrDueTodayCount = 0; // 🔴 Atrasadas / Por Vencer

    const upcomingDeliveries = [];

    for (const order of (orders || [])) {
        const statusLower = (order.status || '').toLowerCase().trim();
        const promisedDateStr = order.promised_date ? order.promised_date.split('T')[0] : null;

        // 🟢 Listas para entrega
        if (statusLower === 'listo') {
            readyForPickupCount++;
        }
        // 🔵 Entregadas
        else if (statusLower === 'entregado') {
            const dateToCheck = new Date(order.created_at || order.promised_date);
            if (dateToCheck.getMonth() === currentMonth && dateToCheck.getFullYear() === currentYear) {
                deliveredThisMonthCount++;
            }
        }
        // 🟡 En Reparación / Proceso
        else if (statusLower !== 'cancelado') {
            inProgressCount++;
        }

        // 🔴 Atrasadas / Por Vencer:
        if (promisedDateStr && statusLower !== 'listo' && statusLower !== 'entregado' && statusLower !== 'cancelado') {
            if (promisedDateStr <= todayStr) {
                overdueOrDueTodayCount++;
            }
        }

        // Priority Deliveries:
        if (promisedDateStr && statusLower !== 'entregado' && statusLower !== 'cancelado') {
            const pDate = new Date(promisedDateStr + 'T00:00:00');
            const tDate = new Date(todayStr + 'T00:00:00');
            const diffTime = pDate - tDate;
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays <= 7) {
                upcomingDeliveries.push({
                    ...order,
                    daysDiff: diffDays
                });
            }
        }
    }

    upcomingDeliveries.sort((a, b) => a.daysDiff - b.daysDiff);

    return {
        kpis: {
            inProgressCount,
            readyForPickupCount,
            deliveredThisMonthCount,
            overdueOrDueTodayCount,
        },
        upcomingDeliveries
    };
}