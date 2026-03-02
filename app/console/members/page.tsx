import {
  createMemberInviteAction,
  revokeMemberInviteAction,
} from "@/app/console/actions"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import {
  fetchTenantMembersAndInvites,
  requireConsoleContext,
} from "@/app/console/_lib/data"
import { firstParam, fmtDate } from "@/app/console/_lib/ui"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function ConsoleMembersPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)
  const inviteLink = firstParam(params.invite_link)

  const { membership } = await requireConsoleContext()
  if (!membership) return null
  const isEditor = membership.role === "editor"
  const data = await fetchTenantMembersAndInvites(membership.tenant_id)

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} />

      {inviteLink ? (
        <Card className="border-cyan-200/60 bg-cyan-50/80 dark:border-cyan-900/50 dark:bg-cyan-950/30">
          <CardHeader>
            <CardTitle className="text-base">招待リンク（この表示時に共有してください）</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="overflow-x-auto rounded-lg border border-cyan-200/70 bg-white/80 p-3 text-xs dark:border-cyan-800/60 dark:bg-slate-900/70">
              <code>{inviteLink}</code>
            </pre>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>メンバー招待</CardTitle>
          <CardDescription>
            Editorロールのメンバーが招待リンクを発行できます。招待参加時のロールはReaderになります。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form action={createMemberInviteAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input type="hidden" name="redirect_to" value="/console/members" />
            <Input name="email" type="email" placeholder="member@example.com" required disabled={!isEditor} />
            <Button type="submit" className="rounded-full" disabled={!isEditor}>
              招待リンク発行
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>所属メンバー</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>メール</TableHead>
                <TableHead>ロール</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>参加日</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.members.map((member) => (
                <TableRow key={member.user_id}>
                  <TableCell>{data.emailByUserId.get(member.user_id) ?? member.user_id}</TableCell>
                  <TableCell>{member.role}</TableCell>
                  <TableCell>{member.is_active ? "有効" : "無効"}</TableCell>
                  <TableCell>{fmtDate(member.created_at)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>招待履歴</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.invites.map((invite) => (
            <div
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-black/20 p-3 dark:border-white/10"
            >
              <div className="text-sm">
                <p className="font-medium">{invite.email}</p>
                <p className="text-muted-foreground">
                  ロール: {invite.role === "editor" ? "Editor" : "Reader"} ／
                  状態: {invite.status === "pending" ? "承認待ち" : invite.status === "accepted" ? "参加済み" : "失効"} ／
                  期限: {fmtDate(invite.expires_at)}
                </p>
              </div>
              {invite.status === "pending" ? (
                <form action={revokeMemberInviteAction}>
                  <input type="hidden" name="redirect_to" value="/console/members" />
                  <input type="hidden" name="invite_id" value={invite.id} />
                  <Button type="submit" size="sm" variant="outline" disabled={!isEditor}>
                    取り消し
                  </Button>
                </form>
              ) : null}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
