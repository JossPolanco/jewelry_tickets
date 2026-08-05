import { supabaseClient } from "../../utils/supabase";

export async function getOrganizationMember(userId = null) {
    let targetUserId = userId;

    if (!targetUserId) {
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!user) return null;
        targetUserId = user.id;
    }

    const { data, error } = await supabaseClient
        .from("tbl_organization_members")
        .select("id, organization_id, role")
        .eq("user_id", targetUserId)
        .maybeSingle();

    if (error) {
        console.error("Error al obtener la organización del usuario en Supabase:", error);
        throw error;
    }

    return data;
}

export async function getCurrentUser() {
    const { data: { user }, error: userError, } = await supabaseClient.auth.getUser();

    if (userError) {
        throw userError;
    }

    return user;
}

export async function getOrganizationInfo(organizationId) {
    const { data, error } = await supabaseClient
        .from("tbl_organizations")
        .select("name, phone, address")
        .eq("id", organizationId)
        .maybeSingle();

    if (error) {
        throw error;
    }

    return data;
}