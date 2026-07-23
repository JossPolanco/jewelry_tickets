import { supabaseClient } from "../../utils/supabase";
import { optimizeImage } from "../images/imageOptimizer";
import { uploadImage, deleteImage } from "../images/imageUploader";
import { saveImageMetadata, deleteImageMetadata } from "../images/imageMetadata";
import { getSignedUrl } from "../images/imageUrl";

export async function updateInfo({ name, nickname }) {
    const { data: { user }, error: userError, } = await supabaseClient.auth.getUser();

    if (userError) {
        throw userError;
    }

    // ACTUALIZAR SOLO LOS CAMPOS QUE SE HAYAN PROPORCIONADO
    const updates = {};

    if (name !== undefined) {
        updates.display_name = name;
    }

    if (nickname !== undefined) {
        updates.nickname = nickname;
    }

    const result = await supabaseClient
        .from("tbl_profiles")
        .update(updates)
        .eq("id", user.id)
        .select("*");

    return result;
}

export async function getUserProfile() {
    const { data: { user }, error: userError, } = await supabaseClient.auth.getUser();

    if (userError) {
        throw userError;
    }

    const result = await supabaseClient
        .from("tbl_profiles")
        .select("id, display_name, nickname, avatar, gender, image_metadata:avatar(id, storage_path, bucket)")
        .eq("id", user.id)
        .single();    

    if (result.error) {
        throw result.error;
    }

    const profile = result.data;
    if (profile && profile.image_metadata) {
        try {
            const urlResult = await getSignedUrl(profile.image_metadata.storage_path, profile.image_metadata.bucket);
            if (urlResult.success) {
                profile.avatar_url = urlResult.data.signedUrl;
            }
        } catch (e) {
            console.error("Error resolving avatar url:", e);
        }
    }

    return profile;
}

export async function getPartnerProfile() {
    const { data: { user }, error: userError, } = await supabaseClient.auth.getUser();

    if (userError) {
        throw userError;
    }

    const result = await supabaseClient
        .from("tbl_profiles")
        .select("id, display_name, nickname, avatar, image_metadata:avatar(id, storage_path, bucket)")
        .neq("id", user.id)
        .single();

    if (result.error) {
        throw result.error;
    }

    const profile = result.data;
    if (profile && profile.image_metadata) {
        try {
            const urlResult = await getSignedUrl(profile.image_metadata.storage_path, profile.image_metadata.bucket);
            if (urlResult.success) {
                profile.avatar_url = urlResult.data.signedUrl;
            }
        } catch (e) {
            console.error("Error resolving partner avatar url:", e);
        }
    }

    return profile;
}

export async function getUserId() {
    const { data: { user }, error: userError, } = await supabaseClient.auth.getUser();

    if (userError) {
        throw userError;
    }

    return user.id;
}

export async function getCurrentUser() {
    const { data: { user }, error: userError, } = await supabaseClient.auth.getUser();

    if (userError) {
        throw userError;
    }

    return user;
}

export async function uploadAvatar(file) {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        throw new Error("No se pudo obtener el usuario. Verifica tu sesión.");
    }

    const userId = user.id;

    // OBTENER EL PERFIL ACTUAL PARA VER SI YA TIENE FOTO DE PERFIL
    const { data: profile, error: profileError } = await supabaseClient
        .from("tbl_profiles")
        .select("avatar, image_metadata:avatar(id, storage_path, bucket)")
        .eq("id", userId)
        .single();

    if (profileError) {
        throw new Error(`Error al obtener el perfil: ${profileError.message}`);
    }

    // OPTIMIZAR LA IMAGEN (max 400x400)
    const optimizationResult = await optimizeImage(file, "avatar");
    if (!optimizationResult.success) {
        throw new Error("No se pudo optimizar la imagen.");
    }
    const optimizedFile = optimizationResult.data.file;

    // SUBIR LA IMAGEN AL BUCKET
    const uploadResult = await uploadImage(optimizedFile, "avatars", userId);
    if (!uploadResult.success) {
        throw new Error("Error al subir la imagen.");
    }

    const { storagePath, bucket } = uploadResult.data;

    // GUARDAR LA METADATA EN LA BASE DE DATOS
    const metadataResult = await saveImageMetadata({
        uploadedBy: userId,
        bucket,
        gallery: "avatar",
        storagePath,
        originalName: file.name,
        fileSize: optimizedFile.size,
        width: optimizationResult.data.width,
        height: optimizationResult.data.height,
        mimeType: "image/webp",
    });

    if (!metadataResult.success) {
        // LIMPIEZA SI FALLA
        try {
            await deleteImage(storagePath, bucket);
        } catch (cleanErr) {
            console.error("Error al limpiar imagen después de fallo en metadata:", cleanErr);
        }
        throw new Error("Error al guardar la metadata de la imagen.");
    }

    const newImageId = metadataResult.data.image.id;

    // ACTUALIZAR LA REFERENCIA DEL AVATAR EN TBL_PROFILES
    const { error: updateError } = await supabaseClient
        .from("tbl_profiles")
        .update({ avatar: newImageId })
        .eq("id", userId);

    if (updateError) {
        // LIMPIEZA SI FALLA
        try {
            await deleteImageMetadata(newImageId);
            await deleteImage(storagePath, bucket);
        } catch (cleanErr) {
            console.error("Error al limpiar tras fallo de actualización del perfil:", cleanErr);
        }
        throw new Error(`Error al actualizar el perfil: ${updateError.message}`);
    }

    // SI EXISTIA UN AVATAR VIEJO, ELIMINAR EL ARCHIVO Y SU METADATA
    const oldAvatar = profile?.image_metadata;
    if (oldAvatar && oldAvatar.id) {
        try {
            await deleteImageMetadata(oldAvatar.id);
            await deleteImage(oldAvatar.storage_path, oldAvatar.bucket || "avatars");
        } catch (deleteErr) {
            console.warn("No se pudo eliminar el avatar anterior por completo:", deleteErr);
        }
    }

    return { success: true, avatarId: newImageId };
}

export async function deleteAvatar() {
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
        throw new Error("No se pudo obtener el usuario. Verifica tu sesión.");
    }

    const userId = user.id;

    // 1. Obtener el perfil actual para comprobar si tiene un avatar
    const { data: profile, error: profileError } = await supabaseClient
        .from("tbl_profiles")
        .select("avatar, image_metadata:avatar(id, storage_path, bucket)")
        .eq("id", userId)
        .single();

    if (profileError) {
        throw new Error(`Error al obtener el perfil: ${profileError.message}`);
    }

    const oldAvatar = profile?.image_metadata;
    if (!oldAvatar || !oldAvatar.id) {
        // No tiene avatar configurado
        return { success: true };
    }

    // 2. Establecer el campo avatar en null en tbl_profiles
    const { error: updateError } = await supabaseClient
        .from("tbl_profiles")
        .update({ avatar: null })
        .eq("id", userId);

    if (updateError) {
        throw new Error(`Error al remover el avatar del perfil: ${updateError.message}`);
    }

    // 3. Eliminar la metadata y el archivo del bucket
    try {
        await deleteImageMetadata(oldAvatar.id);
        await deleteImage(oldAvatar.storage_path, oldAvatar.bucket || "avatars");
    } catch (deleteErr) {
        console.warn("No se pudo eliminar el avatar anterior por completo:", deleteErr);
    }

    return { success: true };
}
