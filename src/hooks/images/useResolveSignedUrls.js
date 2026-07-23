import { resolveSignedUrlsForItems } from "@/services/images/imageUrl"
import { useQuery } from "@tanstack/react-query"

export const useResolveSignedUrls = (queryKey, fetchFn, options = {}) => {
    return useQuery({
        queryKey,
        queryFn: async () => {
            const items = await fetchFn()
            return resolveSignedUrlsForItems(items)
        },
        // Configuración de caché óptima para firmas de storage (5 min stale, 30 min gc)
        staleTime: 5 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
        refetchOnWindowFocus: false,
        retry: 1,
        ...options
    })
}
