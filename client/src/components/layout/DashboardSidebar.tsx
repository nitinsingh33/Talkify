import { Link, useLocation, useNavigate } from "react-router-dom"
import { Bot, LogOut, MessagesSquare, Settings, Star } from "lucide-react"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuBadge,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/use-auth"
import { useConversations } from "@/hooks/use-conversations"
import { cn } from "@/lib/utils"
import { Separator } from "../ui/separator"

const NAV_ITEMS = [
    {
        label: "Conversations",
        href: "/user/conversations",
        icon: MessagesSquare,
        tooltip: "Conversations",
    },
    {
        label: "Starred Messages",
        href: "/user/starred",
        icon: Star,
        tooltip: "Starred Messages",
    },
]

export default function DashboardSidebar() {
    const { user, logout } = useAuth()
    const { conversationsList, aiChatbotConversationId } = useConversations()
    const { state, isMobile } = useSidebar()
    const location = useLocation()
    const navigate = useNavigate()

    // number of conversations that have at least 1 unread message for the current user
    const unreadChatsCount = conversationsList.filter((c) =>
        c.unreadCounts.some((u) => u.userId === user?._id && u.count > 0)
    ).length

    const handleLogout = () => {
        logout()
        navigate("/", { replace: true })
    }

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "?"

    return (
        <Sidebar collapsible="icon">
            {/* ── Nav ─────────────────────────────────────────── */}
            <SidebarContent>
                <SidebarGroup >
                    <SidebarGroupContent>
                        <SidebarMenu className={"mt-1 w-full" + (!isMobile && state === "collapsed" ? " items-center" : "")}>
                            {NAV_ITEMS.map(({ label, href, icon: Icon, tooltip }) => {
                                const isActive =
                                    href === "/user/conversations"
                                        ? location.pathname.startsWith("/user/conversations")
                                        : location.pathname === href
                                const isConversations = href === "/user/conversations"
                                const showBadge = isConversations && unreadChatsCount > 0
                                return (
                                    <SidebarMenuItem key={label} className="min-w-10 min-h-10">
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            title={tooltip}
                                            className={`min-w-10 min-h-10 p-4 rounded-lg transition-all duration-200 ${isActive ? "bg-linear-to-r from-primary/20 to-primary/10 border border-primary/30 text-primary font-semibold" : "hover:bg-primary/5 text-muted-foreground hover:text-foreground"}`}
                                        >
                                            <Link to={href} className="flex items-center gap-2">
                                                {/* icon — with overlay badge in collapsed/icon mode */}
                                                <div className="relative shrink-0">
                                                    <Icon className={`mx-0.5 min-h-5 min-w-5 text-muted-foreground`} />
                                                    {showBadge && state === "collapsed" && (
                                                        <span className="absolute -top-1.5 -right-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white leading-none">
                                                            {unreadChatsCount > 9 ? "9+" : unreadChatsCount}
                                                        </span>
                                                    )}
                                                </div>
                                                <span>{label}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                        {/* badge in expanded mode — SidebarMenuBadge auto-hides when collapsed */}
                                        {showBadge && (
                                            <SidebarMenuBadge className="bg-primary text-white! rounded-full">
                                                {unreadChatsCount > 99 ? "99+" : unreadChatsCount}
                                            </SidebarMenuBadge>
                                        )}
                                    </SidebarMenuItem>
                                )
                            })}
                            <Separator className="mt-1 mb-3" />
                            <SidebarMenuItem title="AI Chatbot" key={"ai-chatbot"} className="min-w-10 min-h-10">
                                <SidebarMenuButton
                                    asChild
                                    className={`min-w-10 min-h-10 ${state=="collapsed"&&"rounded-full"} bg-linear-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 p-4 border border-primary/50 text-white font-semibold transition-all duration-200 shadow-lg shadow-primary/20`}
                                >
                                    <Link to={`/user/conversations/${aiChatbotConversationId}`} className="flex items-center gap-2">
                                        <div className="relative shrink-0">
                                            <Bot className="mx relative min-h-5 min-w-5" />
                                        </div>
                                        <span>AI Chatbot</span>
                                    </Link>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* ── Footer ──────────────────────────────────────── */}
            <SidebarFooter>
                <SidebarMenu className={"w-full mb-1" + (!isMobile && state === "collapsed" ? " items-center" : "")}>

                    {/* settings */}
                    <SidebarMenuItem key={"Account Settings"} className="flex min-w-10 min-h-10 items-center justify-center">
                        <SidebarMenuButton
                            asChild
                            title="Account Settings"
                            className="min-w-9 min-h-9"
                        >
                            <Link to={"/user/profile"} className="flex items-center gap-2">
                                {/* icon — with overlay badge in collapsed/icon mode */}
                                <div className="relative shrink-0">
                                    <Settings className="min-h-5 min-w-5 text-muted-foreground" />
                                </div>
                                <span>Account Settings</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    <Separator className="mb-2" />

                    {/* User info row */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="cursor-default hover:bg-primary/5 active:bg-primary/5 p-2 rounded-lg transition-colors duration-200"
                        >
                            <Avatar className="size-8 shrink-0 rounded-xl border border-primary/30 shadow-sm">
                                <AvatarImage src={user?.profilePic} alt={user?.name} />
                                <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/30 to-primary/20 text-xs font-bold text-primary">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex min-w-0 flex-col">
                                <span className="truncate text-sm font-semibold leading-tight text-foreground">{user?.name}</span>
                                <span className={cn(
                                    "truncate text-xs leading-tight",
                                    state === "expanded" ? "text-muted-foreground" : "hidden"
                                )}>{user?.email}</span>
                            </div>
                        </SidebarMenuButton>
                    </SidebarMenuItem>

                    {/* Logout */}
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            title="Log out"
                            onClick={handleLogout}
                            className="text-destructive hover:text-white hover:bg-linear-to-r hover:from-destructive/80 hover:to-destructive/90 active:from-destructive active:to-destructive min-h-10 min-w-10 transition-all duration-200 rounded-lg"
                        >
                            <LogOut className="min-h-5 min-w-5" />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>

            <SidebarRail />
        </Sidebar>
    )
}