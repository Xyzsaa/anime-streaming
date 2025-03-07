import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AnimeList } from "@/components/anime-list"
import { ImportDataButton } from "@/components/import-data-button"
import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { SupabaseConfigCheck } from "@/components/supabase-config-check"

export default function DashboardPage() {
  return (
    <DashboardShell>
      <SupabaseConfigCheck />

      <DashboardHeader heading="Dashboard" text="Manage your anime database">
        <ImportDataButton />
      </DashboardHeader>
      <Tabs defaultValue="anime" className="space-y-4">
        <TabsList>
          <TabsTrigger value="anime">Anime</TabsTrigger>
          <TabsTrigger value="manga">Manga</TabsTrigger>
          <TabsTrigger value="genres">Genres</TabsTrigger>
          <TabsTrigger value="characters">Characters</TabsTrigger>
        </TabsList>
        <TabsContent value="anime" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Anime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Episodes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ongoing Anime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completed Anime</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>
          </div>
          <AnimeList />
        </TabsContent>
        <TabsContent value="manga" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manga</CardTitle>
              <CardDescription>Manage your manga collection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Manga management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="genres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Genres</CardTitle>
              <CardDescription>Manage your genres</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Genre management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="characters" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Characters</CardTitle>
              <CardDescription>Manage your characters</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <p>Character management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
