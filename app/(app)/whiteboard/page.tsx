import type { Metadata } from "next";
import { WhiteboardPage } from "@/components/whiteboard/WhiteboardPage";

export const metadata: Metadata = {
  title: "Whiteboard | KlickUp",
  description: "ClickUp-style interactive infinite whiteboard canvas",
};

export default function Page() {
  return <WhiteboardPage />;
}
