import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/10">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b border-border/50 backdrop-blur-md bg-background/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">AI</span>
            </div>
            <span className="font-semibold text-lg">Contract AI</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition">Features</a>
            <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition">Pricing</a>
            <a href="#docs" className="text-sm text-muted-foreground hover:text-foreground transition">Docs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block px-3 py-1 rounded-lg bg-accent/10 border border-accent/20">
                <span className="text-sm font-medium text-accent">AI-Powered Intelligence</span>
              </div>
              <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-pretty">
                Intelligent Contract Review in Minutes
              </h1>
              <p className="text-xl text-muted-foreground text-pretty max-w-lg">
                Leverage artificial intelligence to analyze, detect risks, and ensure compliance across all your contracts. Transform legal workflows with machine-powered insights.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/register">
                <Button size="lg" className="w-full sm:w-auto">
                  Start Free Trial
                </Button>
              </Link>
              <Link href="#features">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </Link>
            </div>

            <div className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                <span>Enterprise-grade security</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                <span>Deploy in minutes</span>
              </div>
            </div>
          </div>

          <div className="relative h-96 lg:h-full rounded-2xl border border-border/50 bg-gradient-to-br from-primary/5 to-accent/5 flex items-center justify-center overflow-hidden">
            <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
            <div className="relative z-10 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 mb-4">
                <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <p className="text-muted-foreground">Advanced AI Analysis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-background/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2024 Contract AI. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">Privacy</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">Terms</a>
              <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition">Contact</a>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
