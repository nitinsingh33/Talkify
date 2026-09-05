import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { MailWarning, X } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function EmailVerifyBanner() {
    const navigate = useNavigate()
    const [dismissed, setDismissed] = useState(false)

    if (dismissed) return null

    return (
        <div className="shrink-0 flex items-center gap-2.5 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-700 dark:text-amber-400 text-sm">
            <MailWarning className="size-4 shrink-0" />
            <span className="flex-1 min-w-0 truncate">
                Your email isn't verified yet.
            </span>
            <Button
                size="sm"
                variant="ghost"
                className="h-7 px-2.5 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15 hover:text-amber-700 dark:hover:text-amber-400 shrink-0"
                onClick={() => navigate("/verify-email")}
            >
                Verify now
            </Button>
            <button
                onClick={() => setDismissed(true)}
                className="shrink-0 text-amber-700/70 dark:text-amber-400/70 hover:text-amber-700 dark:hover:text-amber-400 transition-colors"
                title="Dismiss"
            >
                <X className="size-4" />
            </button>
        </div>
    )
}
