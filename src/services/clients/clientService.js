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

export async function updateUser({ id, organization_id, names, lastnames, phone, client_phone, email, client_email }) {
    const phoneVal = phone !== undefined ? phone : client_phone;
    const emailVal = email !== undefined ? email : client_email;
    
    const { data, error } = await supabaseClient
        .from("tbl_customers")
        .update({
            organization_id,
            names,
            lastnames,
            phone: phoneVal,
            email: emailVal,
        })
        .eq("id", id)

    if (error) {
        throw error;
    }
    return data;
}

export async function deleteUser(id) {
    const { data, error } = await supabaseClient
        .from("tbl_customers")
        .update({
            active: false
        })
        .eq("id", id)

    if (error) {
        throw error;
    }
    return data;
}


