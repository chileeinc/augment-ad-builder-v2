import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface SessionCardProps {
  session: {
    id: string
    created_at: string
    ad_type: string
    platform_selection: string[]
    thumbnail_urls: string[] | null
  }
}

export default function SessionCard({ session }: SessionCardProps) {
  const date = new Date(session.created_at).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
  const time = new Date(session.created_at).toLocaleTimeString('en-AU', {
    hour: '2-digit', minute: '2-digit',
  })
  const thumb = session.thumbnail_urls?.[0]

  return (
    <Link href={`/history/${session.id}`} className="block group">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        {thumb ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumb} alt="Ad thumbnail" className="w-full aspect-square object-cover" />
        ) : (
          <div className="w-full aspect-square bg-muted flex items-center justify-center text-muted-foreground text-sm">
            No preview
          </div>
        )}
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium capitalize">{session.ad_type}</span>
            <span className="text-xs text-muted-foreground">{date} · {time}</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {session.platform_selection.map(p => (
              <Badge key={p} variant="secondary" className="text-xs capitalize">{p}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
