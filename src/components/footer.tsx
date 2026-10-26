import Link from "next/link";
import { Logo } from "./header";
import { ArrowUpRight, Heart } from "lucide-react";
export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div>
          <Logo />
          <p>
            A better tomorrow starts with
            <br />a conversation today.
          </p>
        </div>
        <div>
          <h4>Discover</h4>
          <Link href="/explore">Societal challenges</Link>
          <Link href="/innovations">Innovations</Link>
          <Link href="/impact">Community impact</Link>
          <Link href="/evidence">Impact evidence</Link>
          <Link href="/intelligence">AI lab</Link>
          <Link href="/#how-it-works">How it works</Link>
        </div>
        <div>
          <h4>Get involved</h4>
          <Link href="/app">Get the community app</Link>
          <Link href="/problems/new">Report a problem</Link>
          <Link href="/teams">Build a team</Link>
          <Link href="/organizations">Our ecosystem</Link>
        </div>
        <div className="footer-note">
          <span className="small-label">Built for collective progress</span>
          <p>
            Citizens. Campuses. Communities.
            <br />
            One bridge to a better India.
          </p>
          <Link href="/register">
            Find your place <ArrowUpRight size={15} />
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} CivicBridge. An independent SIH demonstration.</span>
        <span>
          Made with purpose. Built for people. <Heart size={12} />
        </span>
      </div>
    </footer>
  );
}
