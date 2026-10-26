"use client";
import { LocalDate } from "@/components/i18n";

import { Control } from "@/components/localized-fields";
import { Text } from "@/components/i18n";

import Link from "@/components/localized-fields";
import { Bell, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { api, useData } from "@/lib/client";
import { date } from "@/lib/utils";
import { markAllNotificationsRead } from "@/app/actions";
import { PageIntro, Loading, ErrorState, Empty } from "@/components/common";
import { Button } from "@/components/ui/button";
export default function Notifications() {
  const { data, error, loading, reload } = useData("notifications");
  async function mark(id?: string) {
    try {
      if (id) await api(`notifications/${id}`, "PATCH");
      else await markAllNotificationsRead();
      await reload();
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  return (
    <div className="container page-wrap">
      <PageIntro
        eyebrow="Stay in the loop"
        title="Your community, in motion."
        description="Updates to your reports, proposals, invitations, and collaborations—all in one place."
        action={
          <Button
            variant="outline"
            onClick={() => mark()}
            disabled={!data?.some((n: any) => !n.read)}
          >
            <CheckCheck size={16} />
            <Text>{"Mark all as read"}</Text>
          </Button>
        }
      />
      {loading ? (
        <Loading />
      ) : error ? (
        <ErrorState error={error} retry={reload} />
      ) : !data?.length ? (
        <Empty
          title="You’re all caught up"
          description="Your next update will appear here when something moves forward."
        />
      ) : (
        data.map((n: any) => (
          <div key={n.id} className={`notification ${n.read ? "" : "unread"}`}>
            <span className="mini-icon teal">
              <Bell size={16} />
            </span>
            <Link
              href={n.href}
              onClick={() => {
                if (!n.read) void mark(n.id);
              }}
            >
              <h3>{n.title}</h3>
              <p>{n.body}</p>
              <small>
                <LocalDate value={n.createdAt} />
              </small>
            </Link>
            {!n.read && (
              <Control
                className="icon-btn"
                onClick={() => mark(n.id)}
                aria-label={`Mark ${n.title} as read`}
              >
                <Check size={17} />
              </Control>
            )}
          </div>
        ))
      )}
    </div>
  );
}
