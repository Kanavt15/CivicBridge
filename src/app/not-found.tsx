import Link from "next/link";
import { Empty } from "@/components/common";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <Empty
      title="This bridge leads somewhere else"
      description="The page could not be found. Explore the community’s latest challenges."
      action={
        <Button asChild>
          <Link href="/explore">Explore challenges</Link>
        </Button>
      }
    />
  );
}
