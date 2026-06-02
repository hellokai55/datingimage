export default function AuthErrorPage() {
  return (
    <div className="text-center space-y-4">
      <h1 className="text-2xl font-semibold">Authentication Error</h1>
      <p className="text-muted-foreground">
        An error occurred during authentication. Please try again.
      </p>
    </div>
  );
}
