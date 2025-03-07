import Link from "next/link"

export function MainNav() {
  return (
    <div className="flex gap-6 md:gap-10">
      <Link href="/" className="flex items-center space-x-2">
        <span className="hidden font-bold sm:inline-block">Anime Database Manager</span>
      </Link>
      <nav className="flex gap-6">
        <Link href="/" className="flex items-center text-sm font-medium text-muted-foreground">
          Dashboard
        </Link>
        <Link href="/anime" className="flex items-center text-sm font-medium text-muted-foreground">
          Anime
        </Link>
        <Link href="/manga" className="flex items-center text-sm font-medium text-muted-foreground">
          Manga
        </Link>
      </nav>
    </div>
  )
}
