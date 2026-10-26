"use client";
import { useSession } from "next-auth/react";
import { ArrowUpRight, Lightbulb, Plus, Compass } from "lucide-react";
import Link from "@/components/localized-fields";
import { Text } from "@/components/i18n";
import { Loading } from "@/components/common";

export default function CreatePost() {
  const { data: session, status } = useSession();
  if (status === "loading") return <Loading />;
  const report = !session || ["CITIZEN", "ADMIN"].includes(session.user.role);
  const propose = !session || ["RESEARCHER", "INSTITUTION", "ADMIN"].includes(session.user.role);
  return (
    <div className="app-create-page">
      <div className="app-page-heading">
        <h1>
          <Text>Make a contribution</Text>
        </h1>
        <p>
          <Text>Choose what you want to do.</Text>
        </p>
      </div>
      <div className="app-compose-options">
        {report && (
          <Link href="/problems/new">
            <span className="compose-icon">
              <Plus size={27} />
            </span>
            <h2>
              <Text>Post a problem</Text>
            </h2>
            <p>
              <Text>A photo. A location. A better starting point.</Text>
            </p>
            <ArrowUpRight size={23} />
          </Link>
        )}
        {propose && (
          <Link href="/solutions/new">
            <span className="compose-icon">
              <Lightbulb size={27} />
            </span>
            <h2>
              <Text>Propose a solution</Text>
            </h2>
            <p>
              <Text>Bring an idea to an open problem.</Text>
            </p>
            <ArrowUpRight size={23} />
          </Link>
        )}
        {!report && !propose && (
          <Link href="/explore">
            <span className="compose-icon">
              <Compass size={27} />
            </span>
            <h2>
              <Text>Find a problem</Text>
            </h2>
            <p>
              <Text>Find a problem you can help solve.</Text>
            </p>
            <ArrowUpRight size={23} />
          </Link>
        )}
      </div>
      {!session && (
        <p className="app-create-note">
          <Text>Sign in to post and follow progress.</Text>{" "}
          <Link href="/login">
            <Text>Sign in</Text>
          </Link>
        </p>
      )}
    </div>
  );
}
