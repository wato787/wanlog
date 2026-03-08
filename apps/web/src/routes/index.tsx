import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <div>
      <h1>わんログ</h1>
      <p>ホーム</p>
    </div>
  );
}
