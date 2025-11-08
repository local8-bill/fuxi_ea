export default function NotFound() {
  return (
    <div className="max-w-xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="text-slate-600">Try the start page or a project route.</p>
      <div className="mt-4 flex gap-2">
        <a className="btn btn-primary" href="/">Start</a>
        <a className="btn" href="/project/demo/scoring">Demo Scoring</a>
      </div>
    </div>
  );
}
