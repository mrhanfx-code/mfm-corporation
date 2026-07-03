"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <div className="text-center p-8">
        <h1 className="text-4xl font-bold text-white mb-4">Login Error</h1>
        <p className="text-zinc-400 mb-6">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
