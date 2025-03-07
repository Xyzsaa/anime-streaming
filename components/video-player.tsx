"use client"

import { useState, useEffect } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"

interface VideoServer {
  id: number
  server_name: string
  url: string
  server_id: string
  is_default: boolean
  quality: {
    id: number
    name: string
  }
}

interface VideoPlayerProps {
  videoUrl: string | null
  title: string
  serversByQuality: Record<string, VideoServer[]>
}

export function VideoPlayer({ videoUrl, title, serversByQuality }: VideoPlayerProps) {
  const [currentUrl, setCurrentUrl] = useState(videoUrl)
  const [currentQuality, setCurrentQuality] = useState<string | null>(null)
  const [currentServer, setCurrentServer] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const qualities = Object.keys(serversByQuality)
    .sort((a, b) => {
      // Sort qualities in descending order (1080p, 720p, etc.)
      const aNum = Number.parseInt(a.replace(/[^0-9]/g, "")) || 0
      const bNum = Number.parseInt(b.replace(/[^0-9]/g, "")) || 0
      return bNum - aNum
    })
    .filter((q) => q !== "unknown" && serversByQuality[q].length > 0) // Filter out empty qualities

  // Set default quality if not set
  useEffect(() => {
    if (!currentQuality && qualities.length > 0) {
      setCurrentQuality(qualities[0])
    }
  }, [qualities, currentQuality])

  // Get servers for current quality
  const servers = currentQuality ? serversByQuality[currentQuality] || [] : []

  // Set default server if not set
  useEffect(() => {
    if (currentQuality && servers.length > 0 && !currentServer) {
      const defaultServer = servers.find((s) => s.is_default)
      setCurrentServer(defaultServer?.server_name || servers[0].server_name)
      if (!currentUrl) {
        setCurrentUrl(defaultServer?.url || servers[0].url)
      }
    }
  }, [currentQuality, servers, currentServer, currentUrl])

  const handleQualityChange = (quality: string) => {
    setCurrentQuality(quality)
    const servers = serversByQuality[quality] || []
    if (servers.length > 0) {
      const defaultServer = servers.find((s) => s.is_default)
      setCurrentServer(defaultServer?.server_name || servers[0].server_name)
      setIsLoading(true)
      setCurrentUrl(defaultServer?.url || servers[0].url)
    }
  }

  const handleServerChange = (serverName: string) => {
    setCurrentServer(serverName)
    if (currentQuality) {
      const server = serversByQuality[currentQuality]?.find((s) => s.server_name === serverName)
      if (server) {
        setIsLoading(true)
        setCurrentUrl(server.url)
      }
    }
  }

  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="aspect-video relative overflow-hidden rounded-md bg-black">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {currentUrl ? (
          <iframe
            src={currentUrl}
            className="absolute inset-0 w-full h-full"
            allowFullScreen
            title={title}
            onLoad={handleIframeLoad}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-white">No video available</p>
          </div>
        )}
      </div>

      {qualities.length > 0 && (
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Quality:</span>
            <Select value={currentQuality || undefined} onValueChange={handleQualityChange}>
              <SelectTrigger className="w-24">
                <SelectValue placeholder="Quality" />
              </SelectTrigger>
              <SelectContent>
                {qualities.map((quality) => (
                  <SelectItem key={quality} value={quality}>
                    {quality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {servers.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Server:</span>
              <Select value={currentServer || undefined} onValueChange={handleServerChange}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Server" />
                </SelectTrigger>
                <SelectContent>
                  {servers.map((server) => (
                    <SelectItem key={server.id} value={server.server_name}>
                      {server.server_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
