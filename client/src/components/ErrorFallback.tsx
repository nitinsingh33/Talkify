import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function ErrorFallback() {
    return (
        <div className="flex h-dvh w-dvw flex-col items-center justify-center gap-4 p-6 text-center">
            <AlertTriangle className="size-10 text-destructive" />
            <div className="space-y-1">
                <h1 className="text-lg font-semibold">Something went wrong</h1>
                <p className="text-sm text-muted-foreground">
                    An unexpected error occurred. Try reloading the page.
                </p>
            </div>
            <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
    )
}
