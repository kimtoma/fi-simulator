import { SimulatorForm } from "@/components/simulator-form";
import { ThemeToggle } from "@/components/theme-toggle";

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-12">
      <header className="bg-card/80 backdrop-blur-xl sticky top-0 z-40 border-b border-border-light">
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 py-4">
          <div className="w-8" />
          <h1 className="font-display text-lg text-foreground">
            경제적 자유 시뮬레이터
          </h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-5 py-6">
        <SimulatorForm />
      </main>

      <footer className="text-center text-xs text-faint py-4">
        <a
          href="https://github.com/kimtoma/fi-simulator"
          className="hover:text-muted-foreground transition-colors"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
      </footer>
    </div>
  );
}
