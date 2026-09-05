import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
import { Crown, MoreVertical, Pencil, Check, X, UserPlus, LogOut, Search, Loader2 } from "lucide-react"

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

import { conversationApi, userApi } from "@/lib/api"
import type { Conversation } from "@/hooks/use-conversations"
import type { User } from "@/hooks/use-auth"

function initials(name: string) {
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
}

/* ─── add-members mini dialog ───────────────────────────────────────────── */

interface AddMembersDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    existingMemberIds: string[]
    onAdd: (userIds: string[]) => Promise<void>
}

function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value)
    useEffect(() => {
        const id = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(id)
    }, [value, delay])
    return debounced
}

function AddMembersDialog({ open, onOpenChange, existingMemberIds, onAdd }: AddMembersDialogProps) {
    const [query, setQuery] = useState("")
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(false)
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const [adding, setAdding] = useState(false)
    const debouncedQuery = useDebounce(query, 350)

    useEffect(() => {
        if (!open) {
            setQuery("")
            setUsers([])
            setSelected(new Set())
            return
        }
        setLoading(true)
        userApi.getAllUsers({ search: debouncedQuery || undefined, limit: 30 })
            .then((data) => {
                const res = data as { users: User[] }
                setUsers(res.users.filter((u) => !existingMemberIds.includes(u._id)))
            })
            .catch(() => toast.error("Failed to load users"))
            .finally(() => setLoading(false))
    }, [open, debouncedQuery]) // eslint-disable-line react-hooks/exhaustive-deps

    const toggle = (id: string) => {
        setSelected((prev) => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const handleAdd = async () => {
        if (selected.size === 0) return
        setAdding(true)
        try {
            await onAdd(Array.from(selected))
            onOpenChange(false)
        } finally {
            setAdding(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden flex flex-col max-h-[75vh]">
                <DialogHeader className="px-4 pt-6 pb-3 shrink-0">
                    <DialogTitle>Add members</DialogTitle>
                </DialogHeader>
                <div className="px-4 pb-3 shrink-0 border-b">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            autoFocus
                            placeholder="Search…"
                            className="pl-8 h-9"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {loading ? (
                        <div className="flex justify-center py-6">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : users.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No users found</p>
                    ) : (
                        users.map((u) => {
                            const isSelected = selected.has(u._id)
                            return (
                                <button
                                    key={u._id}
                                    onClick={() => toggle(u._id)}
                                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left hover:bg-accent/60 transition-colors"
                                >
                                    <Avatar className="size-9 shrink-0">
                                        <AvatarImage src={u.profilePic} alt={u.name} />
                                        <AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback>
                                    </Avatar>
                                    <span className="flex-1 min-w-0 truncate text-sm font-medium">{u.name}</span>
                                    <div className={`shrink-0 size-5 rounded-full border flex items-center justify-center ${isSelected ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                                        {isSelected && <Check className="size-3.5 text-white" />}
                                    </div>
                                </button>
                            )
                        })
                    )}
                </div>
                <DialogFooter className="px-4 py-3 border-t shrink-0">
                    <Button
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                        disabled={selected.size === 0 || adding}
                        onClick={handleAdd}
                    >
                        {adding ? <Loader2 className="size-4 animate-spin" /> : `Add ${selected.size > 0 ? `(${selected.size})` : ""}`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

/* ─── main group info dialog ────────────────────────────────────────────── */

interface GroupInfoDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    group: Conversation
    myId: string
    onGroupUpdated: (conv: Conversation) => void
    onLeft: () => void
}

export default function GroupInfoDialog({ open, onOpenChange, group, myId, onGroupUpdated, onLeft }: GroupInfoDialogProps) {
    const [renaming, setRenaming] = useState(false)
    const [nameDraft, setNameDraft] = useState(group.groupName ?? "")
    const [addMembersOpen, setAddMembersOpen] = useState(false)
    const [leaveOpen, setLeaveOpen] = useState(false)
    const [busyId, setBusyId] = useState<string | null>(null)
    const renameInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        setNameDraft(group.groupName ?? "")
    }, [group.groupName])

    const isAdmin = (group.groupAdmins ?? []).includes(myId)
    const isCreator = (id: string) => group.createdBy === id

    const handleRename = async () => {
        const trimmed = nameDraft.trim()
        if (!trimmed || trimmed === group.groupName) { setRenaming(false); return }
        try {
            await conversationApi.updateGroup(group._id, { name: trimmed })
            onGroupUpdated({ ...group, groupName: trimmed })
            setRenaming(false)
        } catch {
            toast.error("Failed to rename group")
        }
    }

    const handlePromote = async (userId: string) => {
        setBusyId(userId)
        try {
            const { groupAdmins } = await conversationApi.promoteAdmin(group._id, userId)
            onGroupUpdated({ ...group, groupAdmins })
        } catch {
            toast.error("Failed to make admin")
        } finally {
            setBusyId(null)
        }
    }

    const handleDemote = async (userId: string) => {
        setBusyId(userId)
        try {
            const { groupAdmins } = await conversationApi.demoteAdmin(group._id, userId)
            onGroupUpdated({ ...group, groupAdmins })
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to remove admin")
        } finally {
            setBusyId(null)
        }
    }

    const handleRemoveMember = async (userId: string, name: string) => {
        setBusyId(userId)
        try {
            await conversationApi.removeMember(group._id, userId)
            onGroupUpdated({
                ...group,
                members: group.members.filter((m) => m._id !== userId),
                groupAdmins: (group.groupAdmins ?? []).filter((a) => a !== userId),
            })
            toast.success(`${name} removed from group`)
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to remove member")
        } finally {
            setBusyId(null)
        }
    }

    const handleAddMembers = async (userIds: string[]) => {
        try {
            const updated = await conversationApi.addMembers<Conversation>(group._id, userIds)
            onGroupUpdated(updated)
            toast.success("Members added")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to add members")
        }
    }

    const handleLeave = async () => {
        try {
            await conversationApi.leaveGroup(group._id)
            onLeft()
        } catch {
            toast.error("Failed to leave group")
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-sm p-0 gap-0 overflow-hidden flex flex-col max-h-[85vh]">
                    <DialogHeader className="px-4 pt-6 pb-2 shrink-0">
                        <DialogTitle>Group info</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col items-center gap-2 px-4 pb-3">
                        <Avatar className="size-20">
                            <AvatarImage src={group.groupPic} alt={group.groupName} />
                            <AvatarFallback className="text-xl font-semibold bg-primary/15">
                                {initials(group.groupName ?? "Group")}
                            </AvatarFallback>
                        </Avatar>

                        {renaming ? (
                            <div className="flex items-center gap-1.5 w-full max-w-64">
                                <Input
                                    ref={renameInputRef}
                                    autoFocus
                                    value={nameDraft}
                                    onChange={(e) => setNameDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") handleRename()
                                        if (e.key === "Escape") { setRenaming(false); setNameDraft(group.groupName ?? "") }
                                    }}
                                    className="h-8 text-sm text-center"
                                />
                                <Button size="icon" className="size-8 shrink-0" onClick={handleRename}>
                                    <Check className="size-4" />
                                </Button>
                                <Button size="icon" variant="ghost" className="size-8 shrink-0" onClick={() => { setRenaming(false); setNameDraft(group.groupName ?? "") }}>
                                    <X className="size-4" />
                                </Button>
                            </div>
                        ) : (
                            <button
                                onClick={() => isAdmin && setRenaming(true)}
                                disabled={!isAdmin}
                                className="flex items-center gap-1.5 text-lg font-bold disabled:cursor-default"
                            >
                                {group.groupName}
                                {isAdmin && <Pencil className="size-3.5 text-muted-foreground" />}
                            </button>
                        )}
                        <p className="text-xs text-muted-foreground">
                            {group.members.length} member{group.members.length !== 1 ? "s" : ""}
                        </p>
                    </div>

                    <Separator />

                    <div className="flex-1 overflow-y-auto py-1">
                        {isAdmin && (
                            <button
                                onClick={() => setAddMembersOpen(true)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-accent/60 transition-colors text-primary"
                            >
                                <div className="size-9 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                    <UserPlus className="size-4" />
                                </div>
                                <span className="text-sm font-medium">Add members</span>
                            </button>
                        )}

                        {group.members.map((m) => {
                            const memberIsAdmin = (group.groupAdmins ?? []).includes(m._id)
                            const memberIsCreator = isCreator(m._id)
                            const isSelf = m._id === myId
                            const canManage = isAdmin && !isSelf && !memberIsCreator

                            return (
                                <div key={m._id} className="flex items-center gap-3 px-4 py-2.5">
                                    <Avatar className="size-9 shrink-0">
                                        <AvatarImage src={m.profilePic} alt={m.name} />
                                        <AvatarFallback className="text-xs">{initials(m.name)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <span className="truncate text-sm font-medium">
                                                {isSelf ? "You" : m.name}
                                            </span>
                                            {(memberIsAdmin || memberIsCreator) && (
                                                <Crown className="size-3 text-amber-500 shrink-0" />
                                            )}
                                        </div>
                                        {(memberIsCreator || memberIsAdmin) && (
                                            <p className="text-[11px] text-muted-foreground">
                                                {memberIsCreator ? "Creator" : "Admin"}
                                            </p>
                                        )}
                                    </div>
                                    {canManage && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button size="icon" variant="ghost" className="size-7 shrink-0" disabled={busyId === m._id}>
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                {memberIsAdmin ? (
                                                    <DropdownMenuItem onClick={() => handleDemote(m._id)}>
                                                        Remove as admin
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem onClick={() => handlePromote(m._id)}>
                                                        Make admin
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    onClick={() => handleRemoveMember(m._id, m.name)}
                                                >
                                                    Remove from group
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <Separator />

                    <div className="p-2 shrink-0">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-2 text-destructive hover:text-destructive"
                            onClick={() => setLeaveOpen(true)}
                        >
                            <LogOut className="size-4" />
                            Leave group
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            <AddMembersDialog
                open={addMembersOpen}
                onOpenChange={setAddMembersOpen}
                existingMemberIds={group.members.map((m) => m._id)}
                onAdd={handleAddMembers}
            />

            <AlertDialog open={leaveOpen} onOpenChange={setLeaveOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Leave "{group.groupName}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                            You will no longer receive messages from this group.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => { setLeaveOpen(false); handleLeave() }}
                        >
                            Leave
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
