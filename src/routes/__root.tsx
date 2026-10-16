import { createRootRoute, HeadContent, Outlet, Scripts } from '@tanstack/react-router'
import { Toaster } from 'sonner'
import stylesheet from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Scolaris | Gestion scolaire' },
      { name: 'theme-color', content: '#1f5e55' },
      { name: 'description', content: 'Gestion claire des frais de scolarité.' },
    ],
    links: [
      { rel: 'stylesheet', href: stylesheet },
      { rel: 'manifest', href: '/manifest.webmanifest' },
      { rel: 'icon', href: '/scolaris.svg', type: 'image/svg+xml' },
    ],
  }),
  component: RootDocument,
})

function RootDocument() {
  return <html lang="fr"><head><HeadContent /></head><body><Outlet /><Toaster position="top-right" richColors /><Scripts /></body></html>
}