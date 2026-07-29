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

export async function getOrderDetail(id) {
    const { data, error } = await supabaseClient
        .from("tbl_service_orders")
        .select("*, tbl_customers(names, lastnames, phone, email)", { count: "exact" })
        .eq("id", id)
        .single();

    const order_items = await getOrderItems(id);

    if (error) {
        throw error;
    }

    const finalData = {
        ...data,
        order_items
    }

    return finalData
}

async function getOrderItems(id) {
    const { data, error } = await supabaseClient
        .from("tbl_order_items")
        .select("*", { count: "exact" })
        .eq("service_order_id", id);

    if (error) {
        throw error;
    }
    return data;
}