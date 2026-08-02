import { supabaseClient } from "../../utils/supabase";

export async function getTermsAndConditions(id) {
    if (!id) return null;

    const { data, error } = await supabaseClient
        .from('tbl_organizations')
        .select('terms_and_conditions')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw error;
    }
    return data;
}