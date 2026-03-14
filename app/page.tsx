import { redirect } from "next/navigation";

// Root landing page for the app.
// Automatically redirects to the manifest view as the default dashboard.
export default function Home() {
  redirect("/manifest");
}

