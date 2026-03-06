import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center pb-32">
      <div className="flex flex-col items-center w-full max-w-[480px] px-6">
        <h1 className="text-5xl font-medium text-gray-900 tracking-tight mb-10">
          velox
        </h1>

        <p className="text-gray-500 text-sm text-center leading-relaxed mb-10">
          Please sign in or register for full access to Velox content and services.
        </p>

        <div className="flex flex-col w-full gap-3">
          <Link
            href="/signin"
            className="block w-full text-dark font-semibold text-center text-sm bg-brand py-[18px] rounded-xl transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="block w-full text-dark font-semibold text-center text-sm bg-light-bg py-[18px] rounded-xl transition-colors"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
