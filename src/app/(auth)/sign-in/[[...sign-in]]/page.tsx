import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white mb-8">MCG Study App</h1>
        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto",
              card: "bg-slate-800 border border-slate-700",
              headerTitle: "text-white",
              headerSubtitle: "text-slate-400",
              socialButtonsBlockButton: "bg-slate-700 border-slate-600 text-white hover:bg-slate-600",
              formFieldLabel: "text-slate-300",
              formFieldInput: "bg-slate-700 border-slate-600 text-white",
              footerActionLink: "text-emerald-400 hover:text-emerald-300",
              formButtonPrimary: "bg-emerald-600 hover:bg-emerald-700",
            },
          }}
        />
      </div>
    </div>
  );
}
