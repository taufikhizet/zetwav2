import { useState, useEffect, useRef } from 'react'
import { X, ChevronLeft, ChevronRight, Loader2, Info } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { format } from 'date-fns'
import { sessionApi } from '@/features/sessions/api/session.api'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

interface Status {
  id: string
  timestamp: number
  caption?: string
  type: string
  body?: string
  backgroundColor?: string
  _serialized?: string
}

interface StatusViewerProps {
  isOpen: boolean
  onClose: () => void
  statuses: Status[]
  initialIndex?: number
  contactName: string
  sessionId: string
  mode?: 'story' | 'gallery'
}

export function StatusViewerDialog({
  isOpen,
  onClose,
  statuses,
  initialIndex = 0,
  contactName,
  sessionId,
  mode = 'story'
}: StatusViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [progress, setProgress] = useState(0)
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [isLoadingMedia, setIsLoadingMedia] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const progressInterval = useRef<NodeJS.Timeout>()
  const DURATION = 5000 // 5 seconds per status

  // Reset state when dialog opens or statuses change
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setProgress(0)
      setMediaUrl(null)
      setError(null)
    }
  }, [isOpen, initialIndex, statuses])

  // Handle media loading and progress timer
  useEffect(() => {
    if (!isOpen || !statuses[currentIndex]) return

    const status = statuses[currentIndex]
    setProgress(0)
    setMediaUrl(null)
    setError(null)
    setIsLoadingMedia(false)

    // Clear existing timer
    if (progressInterval.current) clearInterval(progressInterval.current)

    const startTimer = () => {
      // Only start timer in 'story' mode
      if (mode !== 'story') return

      const step = 100 / (DURATION / 100) // update every 100ms
      progressInterval.current = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            handleNext()
            return 100
          }
          return prev + step
        })
      }, 100)
    }

    // Load media if needed
    if (status.type === 'image' || status.type === 'video' || status.type === 'audio') {
      setIsLoadingMedia(true)
      // Attempt to download media
      sessionApi.downloadMessageMedia(sessionId, status.id)
        .then((response: any) => {
            if (response.data) {
                const { mimetype, data } = response.data
                setMediaUrl(`data:${mimetype};base64,${data}`)
            } else {
                setError('Failed to load media')
            }
        })
        .catch(() => {
            setError('Failed to load media')
        })
        .finally(() => {
            setIsLoadingMedia(false)
            startTimer()
        })
    } else {
      // Text status, just start timer
      startTimer()
    }

    return () => {
      if (progressInterval.current) clearInterval(progressInterval.current)
    }
  }, [currentIndex, isOpen, sessionId, statuses, mode])

  const handleNext = () => {
    if (currentIndex < statuses.length - 1) {
      setCurrentIndex(prev => prev + 1)
    } else {
      if (mode === 'story') {
        onClose()
      }
    }
  }

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    } else {
        // Restart current or do nothing?
        if (mode === 'story') setProgress(0)
    }
  }

  const formatTime = (timestamp: number) => {
    try {
        let date: Date
        if (timestamp < 1000000000000) {
           date = new Date(timestamp * 1000)
        } else {
           date = new Date(timestamp)
        }
        return format(date, 'HH:mm')
    } catch {
        return ''
    }
  }

  const formatFullDate = (timestamp: number) => {
    try {
        let date: Date
        if (timestamp < 1000000000000) {
           date = new Date(timestamp * 1000)
        } else {
           date = new Date(timestamp)
        }
        return format(date, 'PPP pp')
    } catch {
        return ''
    }
  }

  if (!statuses[currentIndex]) return null

  const currentStatus = statuses[currentIndex]

  // Render content logic
  const renderContent = () => {
    if (currentStatus.type === 'text') {
      return (
        <div 
            className="w-full h-full flex items-center justify-center p-8 text-center"
            style={{ backgroundColor: currentStatus.backgroundColor || '#000000' }}
        >
            <p className="text-xl md:text-2xl font-medium leading-relaxed font-sans text-white">
                {currentStatus.body || currentStatus.caption}
            </p>
        </div>
      )
    }

    return (
        <div className="w-full h-full flex items-center justify-center relative bg-zinc-900">
            {isLoadingMedia && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-20">
                    <Loader2 className="h-10 w-10 animate-spin text-white" />
                </div>
            )}
            
            {mediaUrl ? (
                currentStatus.type === 'video' ? (
                    <div className="relative z-30 w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <video 
                            src={mediaUrl} 
                            controls={mode === 'gallery'} 
                            autoPlay={mode === 'story'} 
                            loop={mode === 'gallery'} 
                            className="max-h-full max-w-full object-contain" 
                        />
                    </div>
                ) : (
                    <img src={mediaUrl} alt="Status" className="max-h-full max-w-full object-contain" />
                )
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-white/50 gap-4">
                    {!isLoadingMedia && error ? (
                        <>
                            <p>{error}</p>
                            <Button variant="outline" size="sm" onClick={() => {
                                setIsLoadingMedia(true)
                                sessionApi.downloadMessageMedia(sessionId, currentStatus.id)
                                    .then((res: any) => {
                                        setMediaUrl(`data:${res.data.mimetype};base64,${res.data.data}`)
                                        setError(null)
                                    })
                                    .catch(() => setError('Retry failed'))
                                    .finally(() => setIsLoadingMedia(false))
                            }}>Retry</Button>
                        </>
                    ) : (
                        !isLoadingMedia && <p>No media content</p>
                    )}
                </div>
            )}
            
            {/* Caption for Media - Mobile Only */}
            {(currentStatus.type === 'image' || currentStatus.type === 'video') && currentStatus.caption && (
                <div className="absolute bottom-0 inset-x-0 p-4 bg-black/60 text-center pb-8 z-40 md:hidden">
                    <p className="text-white text-sm md:text-base">{currentStatus.caption}</p>
                </div>
            )}
        </div>
    )
  }

  // Determine max width - always use wider layout
  const dialogMaxWidth = 'max-w-5xl'

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`${dialogMaxWidth} p-0 overflow-hidden bg-black border-none h-[85vh] flex flex-col md:flex-row items-stretch focus:outline-none text-white gap-0 [&>button]:hidden`}>
        <VisuallyHidden>
            <DialogTitle>Status Viewer</DialogTitle>
            <DialogDescription>Viewing status of {contactName}</DialogDescription>
        </VisuallyHidden>

        {/* Left Panel: Media/Content */}
        <div className="flex-1 relative flex flex-col md:w-2/3 border-r border-white/10 w-full">
            
            {/* Header for Story Mode (Progress Bar) */}
            {mode === 'story' && (
                <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/50 to-transparent pointer-events-none">
                    <div className="flex gap-1 mb-2 pointer-events-auto">
                        {statuses.map((_, idx) => (
                        <div key={idx} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                            <div 
                            className="h-full bg-white transition-all duration-100 ease-linear"
                            style={{ 
                                width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%' 
                            }}
                            />
                        </div>
                        ))}
                    </div>
                    
                    <div className="flex items-center justify-between pointer-events-auto">
                        <div className="flex items-center gap-3">
                            <ChevronLeft className="w-6 h-6 text-white cursor-pointer md:hidden" onClick={onClose} />
                            <Avatar className="h-10 w-10 border-2 border-white/20">
                                <AvatarFallback className="bg-primary/20 text-white">{contactName[0]}</AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="font-semibold text-sm">{contactName}</span>
                                <span className="text-xs text-white/70">{formatTime(currentStatus.timestamp)}</span>
                            </div>
                        </div>
                        {/* Mobile close button */}
                        <div className="flex gap-2 md:hidden">
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-8 w-8" onClick={onClose}>
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Navigation Zones (Story Mode) or Arrows (Gallery Mode) */}
            <div className="absolute inset-y-0 left-0 w-1/4 z-10 flex items-center justify-start pl-4 group cursor-pointer" onClick={handlePrev}>
                 <Button variant="ghost" size="icon" className={`text-white/50 hover:text-white hover:bg-black/20 rounded-full h-10 w-10 transition-opacity ${mode === 'story' ? 'opacity-0 group-hover:opacity-100 hidden md:flex' : 'flex'}`}>
                    <ChevronLeft className="h-8 w-8" />
                </Button>
            </div>
            <div className="absolute inset-y-0 right-0 w-1/4 z-10 flex items-center justify-end pr-4 group cursor-pointer" onClick={handleNext}>
                 <Button variant="ghost" size="icon" className={`text-white/50 hover:text-white hover:bg-black/20 rounded-full h-10 w-10 transition-opacity ${mode === 'story' ? 'opacity-0 group-hover:opacity-100 hidden md:flex' : 'flex'}`}>
                    <ChevronRight className="h-8 w-8" />
                </Button>
            </div>

            {/* Main Content Render */}
            {renderContent()}
        </div>

        {/* Right Panel: Details (Desktop Only) */}
        <div className="hidden md:flex w-1/3 bg-background text-foreground flex-col h-full border-l">
            <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                        <AvatarFallback>{contactName[0]}</AvatarFallback>
                    </Avatar>
                    <div>
                        <h3 className="font-semibold text-sm">{contactName}</h3>
                        <p className="text-xs text-muted-foreground">
                            Status {currentIndex + 1} of {statuses.length}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" onClick={onClose}>
                    <X className="h-5 w-5" />
                </Button>
            </div>

            <ScrollArea className="flex-1 p-6">
                <div className="space-y-6">
                    {/* Caption Section */}
                        {currentStatus.caption && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Caption</h4>
                                <p className="text-base leading-relaxed whitespace-pre-wrap break-words">
                                    {currentStatus.caption}
                                </p>
                            </div>
                        )}

                        {/* Metadata Section */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Metadata</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Type</span>
                                    <div className="flex items-center gap-2">
                                        <Badge variant="outline" className="capitalize">{currentStatus.type}</Badge>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-xs text-muted-foreground">Time</span>
                                    <p className="text-sm font-medium">{formatTime(currentStatus.timestamp)}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <span className="text-xs text-muted-foreground">Full Date</span>
                                    <p className="text-sm font-medium">{formatFullDate(currentStatus.timestamp)}</p>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <span className="text-xs text-muted-foreground">Status ID</span>
                                    <p className="text-xs font-mono bg-muted p-2 rounded break-all select-all">
                                        {currentStatus.id}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* API Usage Section */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-primary">
                                <Info className="h-4 w-4" />
                                <h4 className="text-sm font-medium">API Usage</h4>
                            </div>
                            
                            <div className="space-y-3">
                                {(currentStatus.type === 'image' || currentStatus.type === 'video' || currentStatus.type === 'audio') && (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Download Media:</p>
                                        <div className="bg-muted rounded-md p-3">
                                            <code className="text-xs font-mono whitespace-pre-wrap break-all block">
                                                GET /api/sessions/{sessionId}/messages/{currentStatus.id}/download
                                            </code>
                                        </div>
                                    </div>
                                )}

                                {currentStatus.id.startsWith('true_') ? (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Delete Status:</p>
                                        <div className="bg-muted rounded-md p-3">
                                            <code className="text-xs font-mono whitespace-pre-wrap break-all block">
                                                DELETE /api/sessions/{sessionId}/status/{currentStatus.id}
                                            </code>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground font-medium">Mark as Seen:</p>
                                        <div className="bg-muted rounded-md p-3">
                                            <code className="text-xs font-mono whitespace-pre-wrap break-all block">
                                                POST /api/sessions/{sessionId}/status/{currentStatus.id}/seen
                                            </code>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                </div>
            </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  )
}
