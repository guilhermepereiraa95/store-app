'user client';
import { Dashboard } from "./components/Dashboard";
import { LayoutWrapper } from "./components/LayoutWrapper";

export default function Home() {
  return (
    <LayoutWrapper>
      <Dashboard />
    </LayoutWrapper>
  );
}
