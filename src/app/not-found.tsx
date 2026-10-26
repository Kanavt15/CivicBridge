import { Text } from "@/components/i18n";
import Link from "@/components/localized-fields";
import { Empty } from "@/components/common";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <Empty
      title="This bridge leads somewhere else"
      description="The page could not be found. Explore the community’s latest challenges."
      action={
        <Button asChild>
          <Link href="/explore">
            <Text>{"Explore challenges"}</Text>
          </Link>
        </Button>
      }
    />
  );
}
