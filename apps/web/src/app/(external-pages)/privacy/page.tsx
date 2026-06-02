export default function PrivacyPage() {
  return (
    <div className="flex flex-col">
      <section className="px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-medium text-primary tracking-wide uppercase mb-3">
            Legal
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Privacy Policy
          </h1>
          <p className="mt-4 text-muted-foreground">
            Last updated: June 2025
          </p>

          <div className="mt-12 space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-3">What We Collect</h2>
              <p className="text-muted-foreground leading-relaxed">
                We collect your email address (via Google OAuth) and the photos you upload
                for generation. We do not collect any other personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">How We Use Your Photos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your uploaded selfies are used solely to generate your dating photos.
                They are automatically deleted from our servers after 24 hours. We never
                use your photos to train AI models, and we never share them with third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Data Storage</h2>
              <p className="text-muted-foreground leading-relaxed">
                Generated photos are stored securely using encrypted cloud storage.
                You can delete your projects and associated photos at any time from your dashboard.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Third Parties</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use Supabase for authentication and data storage, and EvoLink for AI
                image generation. Both services maintain strict data privacy standards.
                We do not sell or share your data with any other third parties.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>
              <p className="text-muted-foreground leading-relaxed">
                You have the right to access, correct, or delete your personal data at any time.
                Contact us at hello@datingimage.app to exercise these rights.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">Contact</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this privacy policy, please contact us at{' '}
                <a href="mailto:hello@datingimage.app" className="text-primary hover:underline">
                  hello@datingimage.app
                </a>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </div>
  );
}
