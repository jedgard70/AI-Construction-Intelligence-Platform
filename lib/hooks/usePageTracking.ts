import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { trackPageView } from '../tracking'

export function usePageTracking(): void {
  const router = useRouter()

  useEffect(() => {
    const handleRouteChange = (url: string): void => {
      // Extract path without query params
      const path = url.split('?')[0]
      trackPageView(path)
    }

    router.events.on('routeChangeComplete', handleRouteChange)
    return () => {
      router.events.off('routeChangeComplete', handleRouteChange)
    }
  }, [router])
}
