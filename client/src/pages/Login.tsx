import { useState, useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ArrowLeft, Eye, EyeOff, RotateCcw, MessageCircle, Zap, Shield, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { authApi } from "@/lib/api"
import { toast } from "sonner"
import { Card } from "@/components/ui/card"

export default function Login() {
    const navigate = useNavigate()
    const { login, loginWithOtp, user } = useAuth()

    // ── password tab ──────────────────────────────────────────────────
    const [pwEmail, setPwEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPass, setShowPass] = useState(false)
    const [pwLoading, setPwLoading] = useState(false)

    // ── otp tab ───────────────────────────────────────────────────────
    const [otpEmail, setOtpEmail] = useState("")
    const [otpCode, setOtpCode] = useState("")
    const [otpSent, setOtpSent] = useState(false)
    const [otpCountdown, setOtpCountdown] = useState(0)
    const [otpLoading, setOtpLoading] = useState(false)
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate("/user/conversations", { replace: true })
        }
    }, [user, navigate])

    // OTP countdown ticker
    useEffect(() => {
        if (otpCountdown > 0) {
            countdownRef.current = setInterval(() => {
                setOtpCountdown((c) => {
                    if (c <= 1) {
                        clearInterval(countdownRef.current!)
                        return 0
                    }
                    return c - 1
                })
            }, 1000)
        }
        return () => {
            clearInterval(countdownRef.current!)
        }
    }, [otpCountdown])

    // ── handlers ──────────────────────────────────────────────────────
    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!pwEmail || !password) {
            toast.error("Please fill in all fields.")
            return
        }
        setPwLoading(true)
        try {
            await login(pwEmail.trim(), password)
            navigate("/user/conversations", { replace: true })
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Login failed. Try again.")
        } finally {
            setPwLoading(false)
        }
    }

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!otpEmail) {
            toast.error("Please enter your email address.")
            return
        }
        setOtpLoading(true)
        try {
            await authApi.sendOtp(otpEmail.trim())
            setOtpSent(true)
            setOtpCountdown(60)
            toast.success("OTP sent! Check your inbox.")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to send OTP.")
        } finally {
            setOtpLoading(false)
        }
    }

    const handleOtpLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otpCode.length !== 6) {
            toast.error("Please enter the complete 6-digit OTP.")
            return
        }
        setOtpLoading(true)
        try {
            await loginWithOtp(otpEmail.trim(), otpCode)
            navigate("/user/conversations", { replace: true })
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Invalid OTP. Try again.")
        } finally {
            setOtpLoading(false)
        }
    }

    const handleResendOtp = async () => {
        if (otpCountdown > 0) return
        setOtpCode("")
        setOtpLoading(true)
        try {
            await authApi.sendOtp(otpEmail.trim())
            setOtpCountdown(60)
            toast.success("OTP resent! Check your inbox.")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to resend OTP.")
        } finally {
            setOtpLoading(false)
        }
    }

    return (
        <div className="relative h-full overflow-hidden bg-background">
            
              
            {/* Split Screen Layout */}
            <div className="relative z-10 h-full flex lg:flex-row flex-col">
                
                {/* LEFT SIDE - Hero Section (Hidden on mobile) */}
                <div className="hidden lg:flex lg:w-3/5 bg-linear-to-br from-slate-900 via-slate-800 to-black flex-col items-center justify-center p-12 relative overflow-hidden">
                    
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
                                <p className="mt-1 text-sm text-muted-foreground">Chat with anyone, anywhere</p>
                            </div>
                        </div>

                        {/* Form card */}
                        <Card className="w-full rounded-2xl border border-primary/20 bg-card/80 backdrop-blur-sm shadow-xl shadow-black/10 dark:shadow-black/30 p-8">
                        <div className="mb-6">
                            <h2 className="text-3xl font-bold tracking-tight text-foreground">Welcome back</h2>
                            <p className="text-sm text-muted-foreground mt-1">Sign in to your account to continue</p>
                        </div>

                        <Tabs defaultValue="password" className="w-full">
                            <TabsList className="w-full grid grid-cols-2 mb-5">
                                <TabsTrigger value="password">Password</TabsTrigger>
                                <TabsTrigger value="otp">OTP Login</TabsTrigger>
                            </TabsList>

                            {/* ── Password Tab ───────────────────────── */}
                            <TabsContent value="password">
                                <form onSubmit={handlePasswordLogin} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="pw-email">Email address</Label>
                                        <Input
                                            id="pw-email"
                                            type="email"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            value={pwEmail}
                                            onChange={(e) => setPwEmail(e.target.value)}
                                            disabled={pwLoading}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="pw-password">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="pw-password"
                                                type={showPass ? "text" : "password"}
                                                placeholder="••••••••"
                                                autoComplete="current-password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                disabled={pwLoading}
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
                                    </div>
                                    <Button
                                        type="submit"
                                        className="w-full bg-primary/90 hover:bg-primary"
                                        disabled={pwLoading}
                                    >
                                        {pwLoading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                                        {pwLoading ? "Signing in…" : "Sign in"}
                                    </Button>
                                </form>
                            </TabsContent>

                            {/* ── OTP Tab ─────────────────────────────── */}
                            <TabsContent value="otp">
                                <div className="space-y-4">
                                    {!otpSent ? (
                                        <form onSubmit={handleSendOtp} className="space-y-4">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="otp-email">Email address</Label>
                                                <Input
                                                    id="otp-email"
                                                    type="email"
                                                    placeholder="you@example.com"
                                                    autoComplete="email"
                                                    value={otpEmail}
                                                    onChange={(e) => setOtpEmail(e.target.value)}
                                                    disabled={otpLoading}
                                                />
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                We'll send a one-time password to your email. Valid for 5 minutes.
                                            </p>
                                            <Button
                                                type="submit"
                                                className="w-full bg-primary/90 hover:bg-primary"
                                                disabled={otpLoading}
                                            >
                                                {otpLoading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                                                {otpLoading ? "Sending OTP…" : "Send OTP"}
                                            </Button>
                                        </form>
                                    ) : (
                                        <form onSubmit={handleOtpLogin} className="space-y-4">
                                            <div className="space-y-2.5">
                                                <div className="flex items-center justify-between">
                                                    <Label>Enter OTP</Label>
                                                    <span className="text-xs text-muted-foreground">
                                                        Sent to{" "}
                                                        <span className="font-medium text-foreground">{otpEmail}</span>
                                                    </span>
                                                </div>
                                                <div className="flex justify-center pt-1">
                                                    <InputOTP
                                                        maxLength={6}
                                                        value={otpCode}
                                                        onChange={setOtpCode}
                                                        disabled={otpLoading}
                                                    >
                                                        <InputOTPGroup>
                                                            <InputOTPSlot index={0} />
                                                            <InputOTPSlot index={1} />
                                                            <InputOTPSlot index={2} />
                                                            <InputOTPSlot index={3} />
                                                            <InputOTPSlot index={4} />
                                                            <InputOTPSlot index={5} />
                                                        </InputOTPGroup>
                                                    </InputOTP>
                                                </div>
                                            </div>
                                            <Button
                                                type="submit"
                                                className="w-full bg-primary/90 hover:bg-primary"
                                                disabled={otpLoading || otpCode.length !== 6}
                                            >
                                                {otpLoading ? <Spinner className="w-4 h-4 mr-2" /> : null}
                                                {otpLoading ? "Verifying…" : "Login with OTP"}
                                            </Button>
                                            <div className="flex items-center justify-between text-xs">
                                                <button
                                                    type="button"
                                                    onClick={() => { setOtpSent(false); setOtpCode("") }}
                                                    className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
                                                >
                                                    ← Change email
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleResendOtp}
                                                    disabled={otpCountdown > 0 || otpLoading}
                                                    className="flex items-center gap-1 hover:opacity-80 disabled:opacity-40 transition-opacity"
                                                >
                                                    <RotateCcw className="w-3 h-3" />
                                                    {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend OTP"}
                                                </button>
                                            </div>
                                        </form>
                                    )}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </Card>

                    {/* Footer links */}
                    <div className="flex flex-col items-center gap-4 mt-6">
                        <p className="text-center text-sm text-muted-foreground">
                            Don't have an account?{" "}
                            <Link to="/signup" className="font-semibold text-primary hover:underline transition-all">
                                Create one
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
