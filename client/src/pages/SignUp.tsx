import { useState, useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff, ArrowLeft, MessageCircle, Zap, Shield, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { toast } from "sonner"

// Floating feature cards shown on large screens


export default function SignUp() {
    const navigate = useNavigate()
    const { register, user } = useAuth()

    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPass, setShowPass] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [loading, setLoading] = useState(false)

    // Redirect if already logged in
    useEffect(() => {
        if (user) navigate("/user/conversations", { replace: true })
    }, [user, navigate])

    const validate = () => {
        if (!name.trim()) return "Please enter your name."
        if (!email.trim()) return "Please enter your email address."
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email address."
        if (password.length < 6) return "Password must be at least 6 characters."
        if (password !== confirmPassword) return "Passwords do not match."
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        const validationError = validate()
        if (validationError) {
            toast.error(validationError)
            return
        }
        setLoading(true)
        try {
            await register(name.trim(), email.trim().toLowerCase(), password)
            navigate("/user/conversations", { replace: true })
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Registration failed. Try again.")
        } finally {
            setLoading(false)
        }
    }

    const passwordStrength = () => {
        if (!password) return null
        if (password.length < 6) return { level: 1, label: "Weak", color: "bg-destructive" }
        if (password.length < 10 || !/[A-Z]/.test(password) || !/[0-9]/.test(password))
            return { level: 2, label: "Fair", color: "bg-amber-400" }
        return { level: 3, label: "Strong", color: "bg-green-500" }
    }
    const strength = passwordStrength()

    return (
        <div className="relative h-full overflow-hidden bg-background">
            
            {/* Split Screen Layout */}
            <div className="relative z-10 h-full flex lg:flex-row flex-col">
                
                {/* LEFT SIDE - Hero Section (Hidden on mobile) */}
                <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-slate-900 via-slate-800 to-black flex-col items-center justify-center p-12 relative overflow-hidden">
                    
                    {/* Decorative circles */}
                    <div className="absolute top-10 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-10 left-20 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
                    
                    {/* Content */}
                    <div className="relative z-10 flex flex-col items-center gap-8">
                        
                        {/* Logo */}
                        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-white/15 border border-white/25 shadow-lg backdrop-blur-sm">
                            <MessageCircle className="h-8 w-8 text-white" strokeWidth={1.5} />
                        </div>
                        
                        {/* Branding */}
                        <div className="text-center">
                            <h1 className="text-5xl lg:text-6xl font-bold text-white tracking-tight">
                                Talkify
                            </h1>
                            <p className="mt-2 text-lg text-white/80 font-medium">
                                Chat. Connect. Communicate.
                            </p>
                        </div>
                        
                        {/* Features */}
                        <div className="mt-8 flex flex-col gap-6 w-full max-w-sm">
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                                    <Zap className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Lightning Fast</p>
                                    <p className="text-sm text-white/70">Messages delivered instantly</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                                    <Shield className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">Private & Secure</p>
                                    <p className="text-sm text-white/70">Your conversations stay private</p>
                                </div>
                            </div>
                            
                            <div className="flex items-start gap-4">
                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm">
                                    <Bot className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-white">AI Chatbot</p>
                                    <p className="text-sm text-white/70">Chat with your AI assistant</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* RIGHT SIDE - Form Section */}
                <div className="lg:w-2/5 w-full h-full overflow-y-auto flex flex-col items-center justify-center px-6 py-10 bg-background">
                    <div className="w-full max-w-sm flex flex-col gap-6">
                        
                        {/* Mobile Brand (Visible only on mobile) */}
                        <div className="lg:hidden flex flex-col items-center gap-3 text-center mb-4">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30 shadow-sm">
                                <MessageCircle className="h-7 w-7 text-primary" strokeWidth={1.8} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-foreground">Talkify</h1>
                                <p className="mt-1 text-sm text-muted-foreground">Create your account</p>
                            </div>
                        </div>

                        {/* Form card */}
                        <div className="w-full rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/10 dark:shadow-black/30 p-8">
                            <div className="mb-6">
                                <h2 className="text-3xl font-bold tracking-tight text-foreground">Create Account</h2>
                                <p className="text-sm text-muted-foreground mt-1">Join Talkify and start chatting</p>
                            </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Name */}
                            <div className="space-y-1.5">
                                <Label htmlFor="name">Full name</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="Jane Doe"
                                    autoComplete="name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* Email */}
                            <div className="space-y-1.5">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPass ? "text" : "password"}
                                        placeholder="Min. 6 characters"
                                        autoComplete="new-password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        disabled={loading}
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowPass((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {/* Strength bar */}
                                {strength && (
                                    <div className="space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3].map((i) => (
                                                <div
                                                    key={i}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${i <= strength.level ? strength.color : "bg-muted"}`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Strength: <span className="font-medium text-foreground">{strength.label}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Confirm Password */}
                            <div className="space-y-1.5">
                                <Label htmlFor="confirmPassword">Confirm password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirm ? "text" : "password"}
                                        placeholder="Repeat your password"
                                        autoComplete="new-password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={loading}
                                        className={`pr-10 ${confirmPassword && confirmPassword !== password
                                            ? "border-destructive focus-visible:ring-destructive/20"
                                            : ""
                                            }`}
                                    />
                                    <button
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => setShowConfirm((v) => !v)}
                                        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {confirmPassword && confirmPassword !== password && (
                                    <p className="text-xs text-destructive">Passwords do not match</p>
                                )}
                            </div>

                            <Button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 font-medium py-2.5"
                                disabled={loading}
                            >
                                {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                                {loading ? "Creating account…" : "Create account"}
                            </Button>
                        </form>
                        </div>

                        {/* Footer links */}
                        <div className="flex flex-col items-center gap-4 mt-6">
                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{" "}
                                <Link to="/login" className="font-semibold text-primary hover:underline transition-all">
                                    Sign in
                                </Link>
                            </p>
                            <Link to="/">
                                <Button variant="ghost" size="sm" className="text-muted-foreground text-xs h-8 hover:bg-primary/10">
                                    <ArrowLeft className="w-3 h-3 mr-1" />
                                    Back to home
                                </Button>
                            </Link>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    )
}