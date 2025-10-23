import Link from 'next/link'

export default function AuthCodeError() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-4 text-gray-600">
            There was a problem signing you in. This usually happens when:
          </p>
          <ul className="mt-4 text-left text-sm text-gray-500 space-y-2">
            <li>• The authentication link expired</li>
            <li>• GitHub OAuth is not properly configured</li>
            <li>• The redirect URL doesn't match Supabase settings</li>
          </ul>
          <div className="mt-8">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
