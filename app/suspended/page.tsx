export default function SuspendedPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <div className="text-5xl">🛠️</div>
      <h1 className="mt-4 text-2xl font-bold">Service Temporarily Unavailable</h1>
      <p className="mt-2 text-black/60">Online ordering is paused for this restaurant. Please check back soon or contact the restaurant directly.</p>
    </div>
  );
}
