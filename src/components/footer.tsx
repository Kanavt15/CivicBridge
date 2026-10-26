import Link from "@/components/localized-fields";
import { Logo } from "./header";
import { Text } from "./i18n";
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-main">
        <div>
          <Logo />
          <p>
            <Text>Independent community platform</Text>
          </p>
        </div>
        <nav aria-label="Footer navigation">
          <Link href="/explore">
            <Text>Problems</Text>
          </Link>
          <Link href="/innovations">
            <Text>Solutions</Text>
          </Link>
          <Link href="/evidence">
            <Text>Impact evidence</Text>
          </Link>
          <Link href="/intelligence">
            <Text>AI lab</Text>
          </Link>
          <Link href="/app">
            <Text>Community app</Text>
          </Link>
        </nav>
        <span className="footer-copyright">
          © {new Date().getFullYear()} <Text>{" CivicBridge"}</Text>
        </span>
      </div>
    </footer>
  );
}
