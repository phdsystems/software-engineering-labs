import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Sidebar } from '@/components/layout/sidebar'
import { getNavigation } from '@/lib/api/content'

export default async function LearnLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navigation = await getNavigation()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1 flex">
        <Sidebar navigation={navigation} />
        <main className="flex-1">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
