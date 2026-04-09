export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <p className="text-6xl">🚫</p>
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p className="text-muted-foreground">
          You don&apos;t have permission to access this page.
        </p>
        <a
          href="/"
          className="inline-block text-primary underline hover:no-underline"
        >
          Go back home
        </a>
      </div>
    </div>
  )
}
