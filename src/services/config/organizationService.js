import { supabaseClient } from "../../utils/supabase";

export async function getOrganizationById(id) {
    if (!id) {
        throw new Error("No se ha proporcionado un ID de organización");
    }

    const { data, error } = await supabaseClient
        .from("tbl_organizations")
        .select("*")
        .eq("id", id)
        .maybeSingle();

    if (error) {
        console.error("Error: ", error);
        throw error;
    }

    return data;
}

export async function updateOrganization(id, data) {
    if (!id) return null;
    const { data: updatedData, error } = await supabaseClient
        .from("tbl_organizations")
        .update(data)
        .eq("id", id);

    if (error) {
        throw error;
    }
    return updatedData;
}