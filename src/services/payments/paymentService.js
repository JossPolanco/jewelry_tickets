import { supabaseClient } from "../../utils/supabase";

/**
 * Inserta un nuevo pago en tbl_payments y actualiza advance_payment en la orden.
 */
export async function createPayment({
    service_order_id,
    amount,
    payment_method = "efectivo",
    notes = null,
    created_by = null,
}) {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
        throw new Error("El monto del pago debe ser un número mayor a 0");
    }

    // 1. Insertar el registro de pago en tbl_payments
    const { data: payment, error: paymentError } = await supabaseClient
        .from("tbl_payments")
        .insert({
            service_order_id,
            amount: numericAmount,
            payment_method,
            notes: notes ? notes.trim() : null,
            created_by,
        })
        .select("*")
        .single();

    if (paymentError) {
        throw paymentError;
    }

    // 2. Obtener el anticipo/pagos acumulados actuales de la orden
    const { data: orderData, error: orderFetchError } = await supabaseClient
        .from("tbl_service_orders")
        .select("advance_payment")
        .eq("id", service_order_id)
        .single();

    if (orderFetchError) {
        console.error("Error al obtener la orden para actualizar anticipo:", orderFetchError);
    } else {
        const currentAdvance = parseFloat(orderData?.advance_payment) || 0;
        const newAdvance = currentAdvance + numericAmount;

        // 3. Actualizar advance_payment en tbl_service_orders
        const { error: updateOrderError } = await supabaseClient
            .from("tbl_service_orders")
            .update({ advance_payment: newAdvance })
            .eq("id", service_order_id);

        if (updateOrderError) {
            console.error("Error al actualizar advance_payment en la orden:", updateOrderError);
        }
    }

    return payment;
}

/**
 * Obtener todos los pagos activos asociados a una orden de servicio.
 */
export async function getPaymentsByOrderId(service_order_id) {
    if (!service_order_id) return [];

    const { data, error } = await supabaseClient
        .from("tbl_payments")
        .select("*")
        .eq("service_order_id", service_order_id)
        .eq("active", true)
        .order("created_at", { ascending: false });

    if (error) {
        throw error;
    }

    return data || [];
}

/**
 * Desactiva un pago registrado y reajusta el anticipo en la orden.
 */
export async function deletePayment(payment_id, service_order_id) {
    if (!payment_id || !service_order_id) return;

    // 1. Obtener el monto del pago que se eliminará
    const { data: payment, error: fetchErr } = await supabaseClient
        .from("tbl_payments")
        .select("amount")
        .eq("id", payment_id)
        .single();

    if (fetchErr) throw fetchErr;

    // 2. Desactivar el pago (soft-delete)
    const { error: deleteErr } = await supabaseClient
        .from("tbl_payments")
        .update({ active: false })
        .eq("id", payment_id);

    if (deleteErr) throw deleteErr;

    // 3. Restar del advance_payment de la orden
    const amountToSubtract = parseFloat(payment.amount) || 0;
    const { data: orderData } = await supabaseClient
        .from("tbl_service_orders")
        .select("advance_payment")
        .eq("id", service_order_id)
        .single();

    if (orderData) {
        const currentAdvance = parseFloat(orderData.advance_payment) || 0;
        const newAdvance = Math.max(0, currentAdvance - amountToSubtract);
        await supabaseClient
            .from("tbl_service_orders")
            .update({ advance_payment: newAdvance })
            .eq("id", service_order_id);
    }
}
