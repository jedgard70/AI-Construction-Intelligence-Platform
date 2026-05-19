export function getServerSideProps() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  // Without Supabase configured, skip login and go straight to the dashboard
  if (!supabaseUrl) {
    return { redirect: { destination: '/dashboard.html', permanent: false } }
  }
  return { redirect: { destination: '/login', permanent: false } }
}

export default function Home() { return null }
