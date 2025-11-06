import { getAllContent } from '@/lib/api/content'
import { SearchDialog } from './search-dialog'

export async function SearchProvider() {
  const content = await getAllContent()

  return <SearchDialog content={content} />
}
