"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GoogleSignInButton } from "@/components/google-sign-in-button"
import { useGoogleAuth } from "@/hooks/use-google-auth"
import { useToast } from "@/hooks/use-toast"

export function AuthForm() {
  const { isGoogleLoaded } = useGoogleAuth()
  const { toast } = useToast()

  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  // Show setup guide if Google Client ID is not configured
  if (!clientId || clientId === "demo-client-id") {
    return (
      <Card className="border-border/30 shadow-xl backdrop-blur-sm bg-card/95">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-semibold text-balance text-destructive">Google Setup Required</CardTitle>
          <CardDescription className="text-muted-foreground text-pretty leading-relaxed">
            Please configure Google Identity Services to enable authentication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg border border-border/50">
            <h3 className="font-medium text-foreground mb-2">Required Environment Variable:</h3>
            <ul className="text-sm text-muted-foreground space-y-1 font-mono">
              <li>• NEXT_PUBLIC_GOOGLE_CLIENT_ID</li>
            </ul>
          </div>
          <div className="bg-accent/50 p-4 rounded-lg border border-border/50">
            <p className="text-sm text-foreground">
              <strong>How to set up:</strong>
            </p>
            <ol className="text-sm text-muted-foreground mt-2 space-y-1">
              <li>1. Go to Google Cloud Console</li>
              <li>2. Create a new project or select existing</li>
              <li>3. Enable Google Identity Services API</li>
              <li>4. Create OAuth 2.0 credentials</li>
              <li>5. Add your domain to authorized origins</li>
              <li>6. Copy the Client ID</li>
              <li>7. Click gear icon (⚙️) in top right of v0</li>
              <li>8. Add NEXT_PUBLIC_GOOGLE_CLIENT_ID variable</li>
              <li>9. Refresh the page</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    )
  }

  const handleGoogleError = (error: string) => {
    toast({
      title: "Google sign in failed",
      description: error,
      variant: "destructive",
    })
  }

  return (
    <Card className="border-border/30 shadow-xl backdrop-blur-sm bg-card/95">
      <CardHeader className="space-y-2 text-center pb-6">
        <CardTitle className="text-2xl font-semibold text-balance">
          Welcome to TRAVELY
        </CardTitle>
        <CardDescription className="text-muted-foreground text-pretty leading-relaxed">
          구글 계정으로 간편하게 로그인하세요
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <GoogleSignInButton disabled={!isGoogleLoaded} onError={handleGoogleError} />

        <p className="text-center text-xs text-muted-foreground">
          구글 계정으로 로그인하면 자동으로 회원가입이 완료됩니다
        </p>
      </CardContent>
    </Card>
  )
}