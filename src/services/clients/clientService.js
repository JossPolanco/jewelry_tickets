import { supabaseClient } from "../../utils/supabase";

export async function getClients({
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
        .from("tbl_customers")
        .select("*", { count: "exact" });

    if (orgId) {
        query = query.eq("organization_id", orgId);
    }

    if (activeOnly) {
        query = query.eq("active", true);
    }

    if (search && search.trim() !== "") {
        const term = `%${search.trim()}%`;
        query = query.or(`full_name.ilike.${term},phone.ilike.${term},email.ilike.${term}`);
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

export async function searchClient({ organization_id, search }) {
    if (!search || !search.trim()) return [];
    const orgId = organization_id;
    const term = `%${search.trim()}%`;

    const { data, error } = await supabaseClient
        .from("tbl_customers")
        .select("full_name, names, lastnames, phone, email, id")
        .eq("organization_id", orgId)
        .eq("active", true)
        .or(`full_name.ilike.${term},phone.ilike.${term},email.ilike.${term}`)
        .limit(10);

    if (error) {
        throw error;
    }
    return data || [];
}

export async function createClient({ organization_id, names, lastnames, phone, client_phone, email, client_email }) {
    const phoneVal = phone !== undefined ? phone : client_phone;
    const emailVal = email !== undefined ? email : client_email;

    const { data, error } = await supabaseClient
        .from("tbl_customers")
        .insert({
            organization_id,
            names,
            lastnames,
            phone: phoneVal,
            email: emailVal,
        })

    if (error) {
        console.log("error: ", error)
        throw error;
    }
    return data;
}

export async function updateClient({ id, organization_id, names, lastnames, phone, client_phone, email, client_email }) {
    const phoneVal = phone !== undefined ? phone : client_phone;
    const emailVal = email !== undefined ? email : client_email;
    
    const updatePayload = {
        names,
        lastnames,
        phone: phoneVal,
        email: emailVal,
    };

    if (organization_id) {
        updatePayload.organization_id = organization_id;
    }

    const { data, error } = await supabaseClient
        .from("tbl_customers")
        .update(updatePayload)
        .eq("id", id)
        .select();

    if (error) {
        console.error("Error updating client:", error);
        throw error;
    }
    return data;
}

export const updateUser = updateClient;

export async function deleteClient(id) {
    const targetId = typeof id === 'object' ? id?.id : id;

    const { data, error } = await supabaseClient
        .from("tbl_customers")
        .update({
            active: false
        })
        .eq("id", targetId)
        .select();

    if (error) {
        console.error("Error deleting client:", error);
        throw error;
    }
    return data;
}

export const deleteUser = deleteClient;



