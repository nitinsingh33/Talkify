import { Button } from "@/components/ui/button"
import { Link, Navigate } from "react-router-dom"
import { useAuth } from "@/hooks/use-auth"
import { MessageCircle, ArrowRight } from "lucide-react"

const Home = () => {
    const { user } = useAuth()

    if (user) return <Navigate to="/user/conversations" replace />

    return (
        <div className="min-h-screen w-full bg-gradient-to-b from-background to-background/80 flex flex-col">
            
            {/* NAVBAR */}
            <nav className="border-b border-border/50 backdrop-blur-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="flex items-center gap-2 group">
                        <MessageCircle className="h-6 w-6 text-primary" />
                        <span className="text-2xl font-bold text-foreground">Talkify</span>
                    </Link>

                    <div className="flex items-center gap-3">
                        <Link to="/login">
                            <Button variant="ghost" size="sm">Login</Button>
                        </Link>
                        <Link to="/signup">
                            <Button size="sm" className="bg-primary hover:bg-primary/90">Sign Up</Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex items-center justify-center px-6 py-20">
                <div className="max-w-2xl w-full space-y-8 text-center">
                    
                    {/* Hero */}
                    <div className="space-y-4">
                        <h1 className="text-5xl md:text-6xl font-bold text-foreground">
                            Connect with Anyone, Instantly
                        </h1>
                        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                            Simple, fast, and secure messaging with AI-powered assistance. Connect with anyone, anywhere.
                        </p>
                    </div>

                    {/* CTA Buttons */}
                    <div className="flex justify-center pt-4">
                        <Link to="/signup" className="w-full sm:w-auto">
                            <Button size="lg" className="w-full sm:w-auto bg-primary hover:bg-primary/90 font-semibold text-base">
                                Get Started
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </Link>
                    </div>

                    {/* Features - Simple */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                        <div className="space-y-2">
                            <p className="font-semibold text-foreground">Lightning Fast</p>
                            <p className="text-sm text-muted-foreground">Real-time messaging</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-semibold text-foreground">AI Assistant</p>
                            <p className="text-sm text-muted-foreground">Powered by Gemini</p>
                        </div>
                        <div className="space-y-2">
                            <p className="font-semibold text-foreground">Secure</p>
                            <p className="text-sm text-muted-foreground">Your data is private</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="border-t border-border/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
                    <p>© 2026 Talkify. All rights reserved.</p>
                </div>
            </footer>
        </div>
    )
}

export default Home