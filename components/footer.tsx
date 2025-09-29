export function Footer() {
  return (
    <footer className="mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-6">
            <a
              href="/whitepaper"
              className="hover:text-foreground transition-colors"
            >
              Security whitepaper
            </a>
            <a
              href={process.env.NEXT_PUBLIC_GITHUB_URL || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
