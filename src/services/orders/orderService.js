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