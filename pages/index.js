export function getServerSideProps() {
  return {
    redirect: {
      destination: '/dashboard.html',
      permanent: false,
    },
  }
}

export default function Home() {
  return null
}
