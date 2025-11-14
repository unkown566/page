export default function InvalidLinkPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-6">
      <div className="max-w-md bg-white shadow-md rounded-xl p-8">
        <div className="mb-6">
          <svg
            className="w-16 h-16 mx-auto text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold mb-4 text-gray-900">
          Invalid or Expired Link
        </h1>
        <p className="text-gray-600 mb-3">
          This secure access link is invalid or has expired.
        </p>
        <p className="text-gray-600 mb-6">
          Please open the link directly from your email, or ask the sender to
          resend a new one.
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
        >
          Return to Home
        </a>
      </div>
      <footer className="text-sm text-gray-500 mt-10">
        Secure Document Access © {new Date().getFullYear()}
      </footer>
    </main>
  )
}






