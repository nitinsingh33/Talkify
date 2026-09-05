import { useState, useEffect, useRef, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { Search, Loader2, X, Check } from "lucide-react"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"

import { userApi, conversationApi } from "@/lib/api"
import { useConversations } from "@/hooks/use-conversations"
import type { User } from "@/hooks/use-auth"

interface AllUsersResponse {
  users: User[]
  hasMore: boolean
  total: number
  page: number
}

const LIMIT = 20

function initials(name: string) {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

interface NewGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function NewGroupDialog({
  open,
  onOpenChange,
}: NewGroupDialogProps) {
  const navigate = useNavigate()
  const { fetchConversations } = useConversations()

  const [step, setStep] = useState<"members" | "name">("members")
  const [query, setQuery] = useState("")
  const [users, setUsers] = useState<User[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selected, setSelected] = useState<Map<string, User>>(new Map())
  const [groupName, setGroupName] = useState("")
  const [creating, setCreating] = useState(false)

  const debouncedQuery = useDebounce(query, 350)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const fetchPage = useCallback(
    async (pg: number, q: string, append: boolean) => {
      if (pg === 1) setLoading(true)
      else setLoadingMore(true)
      try {
        const data = (await userApi.getAllUsers({
          search: q || undefined,
          page: pg,
          limit: LIMIT,
        })) as AllUsersResponse
        setUsers((prev) => (append ? [...prev, ...data.users] : data.users))
        setHasMore(data.hasMore)
        setPage(pg)
      } catch {
        toast.error("Failed to load users")
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!open) return
    fetchPage(1, debouncedQuery, false)
  }, [open, debouncedQuery, fetchPage])

  useEffect(() => {
    if (!open) {
      setStep("members")
      setQuery("")
      setUsers([])
      setSelected(new Map())
      setGroupName("")
      setPage(1)
      setHasMore(false)
    }
  }, [open])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchPage(page + 1, debouncedQuery, true)
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, page, debouncedQuery, fetchPage])

  const toggleSelect = (user: User) => {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(user._id)) next.delete(user._id)
      else next.set(user._id, user)
      return next
    })
  }

  const handleCreate = async () => {
    if (!groupName.trim() || selected.size < 2) return
    setCreating(true)
    try {
      const conv = (await conversationApi.createGroup({
        name: groupName.trim(),
        members: Array.from(selected.keys()),
      })) as { _id: string }
      await fetchConversations()
      onOpenChange(false)
      navigate(`/user/conversations/${conv._id}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create group")
    } finally {
      setCreating(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="shrink-0 px-4 pt-7 pb-3">
          <DialogTitle>
            {step === "members" ? "New Group" : "Name your group"}
          </DialogTitle>
        </DialogHeader>

        {step === "members" ? (
          <>
            <div className="shrink-0 space-y-2 border-b px-4 pb-3">
              <div className="relative">
                <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground" />
                <Input
                  autoFocus
                  placeholder="Search by name or email…"
                  className="h-9 pl-8"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              {selected.size > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(selected.values()).map((u) => (
                    <button
                      key={u._id}
                      onClick={() => toggleSelect(u)}
                      className="flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pr-2 pl-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      <Avatar className="size-4">
                        <AvatarImage src={u.profilePic} alt={u.name} />
                        <AvatarFallback className="text-[8px]">
                          {initials(u.name)}
                        </AvatarFallback>
                      </Avatar>
                      {u.name}
                      <X className="size-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex-1 space-y-0.5 overflow-y-auto p-2">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                    <Skeleton className="size-10 shrink-0 rounded-full" />
                    <Skeleton className="h-3.5 w-1/3" />
                  </div>
                ))
              ) : (
                <>
                  {users.map((u) => {
                    const isSelected = selected.has(u._id)
                    return (
                      <button
                        key={u._id}
                        onClick={() => toggleSelect(u)}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-accent/60"
                      >
                        <Avatar className="size-10 shrink-0">
                          <AvatarImage src={u.profilePic} alt={u.name} />
                          <AvatarFallback className="bg-primary/15 text-xs font-semibold">
                            {initials(u.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 flex-1 truncate text-sm font-medium">
                          {u.name}
                        </span>
                        <div
                          className={`flex size-5 shrink-0 items-center justify-center rounded-full border ${
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-muted-foreground/40"
                          }`}
                        >
                          {isSelected && (
                            <Check className="size-3.5 text-white" />
                          )}
                        </div>
                      </button>
                    )
                  })}
                  {users.length === 0 && (
                    <div className="flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground">
                      <Search className="size-8 opacity-30" />
                      <p className="text-sm">No users found</p>
                    </div>
                  )}
                  <div ref={sentinelRef} className="h-1" />
                  {loadingMore && (
                    <div className="flex justify-center py-3">
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </>
              )}
            </div>

            <DialogFooter className="shrink-0 border-t px-4 py-3">
              <Button
                className="w-full bg-primary text-white hover:bg-primary/90"
                disabled={selected.size < 2}
                onClick={() => setStep("name")}
              >
                Next {selected.size > 0 && `(${selected.size})`}
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <div className="space-y-3 px-4 pb-4">
              <p className="text-xs text-muted-foreground">
                {selected.size} member{selected.size !== 1 ? "s" : ""} selected
              </p>
              <Input
                autoFocus
                placeholder="Group name"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && groupName.trim() && !creating)
                    handleCreate()
                }}
              />
            </div>
            <DialogFooter className="shrink-0 flex-row gap-2 border-t px-4 py-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setStep("members")}
                disabled={creating}
              >
                Back
              </Button>
              <Button
                className="flex-1 bg-primary text-white hover:bg-primary/90"
                disabled={!groupName.trim() || creating}
                onClick={handleCreate}
              >
                {creating ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  "Create Group"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
