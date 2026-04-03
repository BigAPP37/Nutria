// Configuración del cliente de TanStack Query
import { QueryClient } from '@tanstack/react-query'

// Crear una instancia singleton del QueryClient
let queryClientInstance: QueryClient | undefined

export function getQueryClient(): QueryClient {
  if (typeof window === 'undefined') {
    // En el servidor, siempre crear un nuevo cliente
    return new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minuto
        },
      },
    })
  }

  // En el cliente, reutilizar la instancia existente
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: 60 * 1000, // 1 minuto
          gcTime: 5 * 60 * 1000, // 5 minutos en caché
          retry: 1,
          refetchOnWindowFocus: false,
        },
        mutations: {
          retry: 0,
        },
      },
    })
  }

  return queryClientInstance
}
