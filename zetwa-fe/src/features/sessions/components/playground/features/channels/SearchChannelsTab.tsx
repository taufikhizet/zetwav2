import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { sessionApi } from '@/features/sessions/api/session.api'
import { ApiExample } from '../../ApiExample'
import { ResponseDisplay } from '../../ResponseDisplay'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface SearchChannelsTabProps {
  sessionId: string
}

export function SearchChannelsTab({ sessionId }: SearchChannelsTabProps) {
  const [activeTab, setActiveTab] = useState('view')
  
  // Search by View State
  const [view, setView] = useState('RECOMMENDED')
  const [country, setCountry] = useState('US')
  
  // Search by Text State
  const [searchText, setSearchText] = useState('')

  // Metadata Queries
  const { data: views } = useQuery({
    queryKey: ['channel-views', sessionId],
    queryFn: () => sessionApi.getChannelSearchViews(sessionId)
  })

  const { data: countries } = useQuery({
    queryKey: ['channel-countries', sessionId],
    queryFn: () => sessionApi.getChannelSearchCountries(sessionId)
  })

  // Mutations
  const searchByViewMutation = useMutation({
    mutationFn: (data: any) => sessionApi.searchChannelsByView(sessionId, data)
  })

  const searchByTextMutation = useMutation({
    mutationFn: (data: any) => sessionApi.searchChannelsByText(sessionId, data)
  })

  const handleSearchByView = (e: React.FormEvent) => {
    e.preventDefault()
    searchByViewMutation.mutate({ view, countries: [country] })
  }

  const handleSearchByText = (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchText) return
    searchByTextMutation.mutate({ text: searchText })
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="view">By View (Recommended/Trending)</TabsTrigger>
                <TabsTrigger value="text">By Text</TabsTrigger>
            </TabsList>

            <TabsContent value="view">
                <form onSubmit={handleSearchByView} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="view">View</Label>
                            <Select value={view} onValueChange={setView}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select view" />
                                </SelectTrigger>
                                <SelectContent>
                                    {views?.map((v: any) => (
                                        <SelectItem key={v.value} value={v.value}>{v.name}</SelectItem>
                                    )) || <SelectItem value="RECOMMENDED">Recommended</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="country">Country</Label>
                            <Select value={country} onValueChange={setCountry}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select country" />
                                </SelectTrigger>
                                <SelectContent>
                                    {countries?.map((c: any) => (
                                        <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                    )) || <SelectItem value="US">United States</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <Button type="submit" disabled={searchByViewMutation.isPending}>
                        {searchByViewMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </form>
                {searchByViewMutation.data && <div className="mt-4"><ResponseDisplay data={searchByViewMutation.data} /></div>}
            </TabsContent>

            <TabsContent value="text">
                <form onSubmit={handleSearchByText} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="text">Search Text</Label>
                        <Input 
                            id="text" 
                            placeholder="Donald Trump" 
                            value={searchText} 
                            onChange={(e) => setSearchText(e.target.value)} 
                            required
                        />
                    </div>
                    <Button type="submit" disabled={searchByTextMutation.isPending || !searchText}>
                        {searchByTextMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </form>
                {searchByTextMutation.data && <div className="mt-4"><ResponseDisplay data={searchByTextMutation.data} /></div>}
            </TabsContent>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <ApiExample
            method="POST"
            url={`/api/sessions/${sessionId}/channels/search/by-view`}
            body={{ view: "RECOMMENDED", countries: ["US"] }}
            description="Search channels by view."
        />
        <ApiExample
            method="POST"
            url={`/api/sessions/${sessionId}/channels/search/by-text`}
            body={{ text: "Donald Trump" }}
            description="Search channels by text."
        />
      </div>
    </div>
  )
}
