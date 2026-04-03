import {
  createMemberInviteAction,
  resendMemberInviteAction,
  revokeMemberInviteAction,
} from "@/app/console/actions"
import { ConsoleAlerts } from "@/app/console/_components/console-alerts"
import {
  fetchTenantMembersAndInvites,
  requireConsoleContext,
} from "@/app/console/_lib/data"
import { firstParam, fmtDate } from "@/app/console/_lib/ui"
import { InviteLinkCopyButton } from "@/app/console/members/invite-link-copy-button"
import { MemberHostedAccessForm } from "@/app/console/members/member-hosted-access-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

function statusLabel(status: string) {
  if (status === "pending") return "承認待ち"
  if (status === "accepted") return "参加済み"
  return "失効"
}

function statusColor(status: string) {
  if (status === "pending") return "text-amber-700 dark:text-amber-400"
  if (status === "accepted") return "text-emerald-700 dark:text-emerald-400"
  return "text-red-500"
}

function resendCooldownLabel(emailSentAt: string | null): string | null {
  if (!emailSentAt) return null
  const remaining = new Date(emailSentAt).getTime() + 10 * 60 * 1000 - Date.now()
  if (remaining <= 0) return null
  const min = Math.ceil(remaining / 60000)
  return `${min}分後に再送可`
}

export default async function ConsoleMembersPage({ searchParams }: PageProps) {
  const params = (await searchParams) ?? {}
  const notice = firstParam(params.notice)
  const error = firstParam(params.error)

  const { membership } = await requireConsoleContext()
  if (!membership) return null
  const isEditor = membership.role === "editor"
  const data = await fetchTenantMembersAndInvites(membership.tenant_id)

  return (
    <div className="grid gap-4">
      <ConsoleAlerts notice={notice} error={error} />

      {/* 招待フォーム */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>メンバー招待</CardTitle>
          <CardDescription>
            Editorロールのメンバーが招待メールを送信できます。招待参加時のロールはReaderになります。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <form action={createMemberInviteAction} className="grid gap-3 md:grid-cols-[1fr_auto]">
            <input type="hidden" name="redirect_to" value="/console/members" />
            <Input name="email" type="email" placeholder="member@example.com" required disabled={!isEditor} />
            <Button type="submit" className="rounded-full" disabled={!isEditor}>
              招待メールを送信
            </Button>
          </form>
          <div className="rounded-md border border-sky-200/70 bg-sky-50/80 px-3 py-2 dark:border-sky-800/40 dark:bg-sky-950/30">
            <p className="text-xs text-sky-800 dark:text-sky-300">
              📨 招待メールが届かない場合は、迷惑メールフォルダをご確認ください。それでも届かない場合は招待履歴の「再送信」ボタンをお使いください。
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 所属メンバー */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>所属メンバー</CardTitle>
        </CardHeader>
        <CardContent>
          {/* モバイル */}
          <div className="grid gap-2 sm:hidden">
            {data.members.map((member) => (
              <div key={member.user_id} className="rounded-lg border border-black/20 p-3 dark:border-white/10">
                <p className="truncate text-sm font-medium">{data.emailByUserId.get(member.user_id) ?? member.user_id}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {member.role === "editor" ? "Editor" : "Reader"} ・ {member.is_active ? "有効" : "無効"} ・ {fmtDate(member.created_at)}
                </p>
              </div>
            ))}
          </div>
          {/* デスクトップ */}
          <div className="hidden overflow-x-auto sm:block">
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
                    <TableCell className="max-w-55 truncate">{data.emailByUserId.get(member.user_id) ?? member.user_id}</TableCell>
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

      {/* 招待履歴 */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>招待履歴</CardTitle>
          <CardDescription>直近50件を表示。有効期限は招待発行・再送信から3日間です。</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {data.invites.length === 0 && (
            <p className="text-sm text-muted-foreground">招待履歴がありません。</p>
          )}
          {data.invites.map((invite) => {
            const cooldown = invite.status === "pending" ? resendCooldownLabel(invite.email_sent_at) : null
            const sendCount = invite.email_send_count ?? 0
            const canResend = isEditor && invite.status === "pending" && sendCount < 5 && !cooldown

            return (
              <div
                key={invite.id}
                className="rounded-lg border border-black/20 p-3 dark:border-white/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1 text-sm">
                    <p className="font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">
                      ロール: {invite.role === "editor" ? "Editor" : "Reader"}
                      {" ／ "}
                      状態:{" "}
                      <span className={statusColor(invite.status)}>
                        {statusLabel(invite.status)}
                      </span>
                      {" ／ "}
                      期限: {fmtDate(invite.expires_at)}
                    </p>
                    {invite.status === "pending" && (
                      <p className="text-xs text-muted-foreground">
                        メール送信: {invite.email_sent_at ? fmtDate(invite.email_sent_at) : "未送信"}
                        {sendCount > 0 && ` (計${sendCount}回)`}
                        {sendCount >= 5 && (
                          <span className="ml-1 text-amber-600 dark:text-amber-400">・送信上限に達しました</span>
                        )}
                      </p>
                    )}
                  </div>

                  {invite.status === "pending" && (
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {/* リンク表示・コピー */}
                      {isEditor && <InviteLinkCopyButton inviteId={invite.id} />}
                      {/* 再送信 */}
                      <form action={resendMemberInviteAction}>
                        <input type="hidden" name="redirect_to" value="/console/members" />
                        <input type="hidden" name="invite_id" value={invite.id} />
                        <Button
                          type="submit"
                          size="sm"
                          variant="outline"
                          className="rounded-full"
                          disabled={!canResend}
                          title={cooldown ?? (sendCount >= 5 ? "送信上限に達しました" : undefined)}
                        >
                          {cooldown ? cooldown : "再送信"}
                        </Button>
                      </form>
                      {/* 取り消し */}
                      <form action={revokeMemberInviteAction}>
                        <input type="hidden" name="redirect_to" value="/console/members" />
                        <input type="hidden" name="invite_id" value={invite.id} />
                        <Button type="submit" size="sm" variant="outline" className="rounded-full" disabled={!isEditor}>
                          取り消し
                        </Button>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </CardContent>
      </Card>

      {/* Hosted URLアクセス制御 */}
      <Card className="border-black/20 bg-white/90 dark:border-white/10 dark:bg-slate-900/80">
        <CardHeader>
          <CardTitle>Hosted URLアクセス制御（Bot単位）</CardTitle>
          <CardDescription>
            デフォルトは全Botへのアクセス許可です。トグルをOFFにしたBotのみ、そのメンバーのアクセスを除外します。
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          {!data.hostedAccessControlReady ? (
            <p className="rounded-md border border-amber-300/70 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/30 dark:text-amber-200">
              Bot単位アクセス制御テーブルが未適用です。DBパッチ適用後にこの機能が有効になります。
            </p>
          ) : null}
          {data.hostedAccessControlError ? (
            <p className="rounded-md border border-rose-300/70 bg-rose-50 px-3 py-2 text-xs text-rose-900 dark:border-rose-500/40 dark:bg-rose-950/30 dark:text-rose-200">
              Bot単位アクセス制御のデータ取得に失敗しました。時間をおいて再読み込みしてください。
            </p>
          ) : null}
          {data.hostedBots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Botがまだ作成されていません。</p>
          ) : (
            data.members.map((member) => {
              const blockedBotIds = data.blockedBotIdsByUser.get(member.user_id) ?? new Set<string>()
              const initialAllowedBotIds = data.hostedBots
                .map((bot) => bot.id)
                .filter((botId) => !blockedBotIds.has(botId))
              return (
                <MemberHostedAccessForm
                  key={`bot-access-${member.user_id}`}
                  memberUserId={member.user_id}
                  memberLabel={data.emailByUserId.get(member.user_id) ?? member.user_id}
                  memberRole={member.role}
                  memberIsActive={member.is_active}
                  hostedBots={data.hostedBots}
                  initialAllowedBotIds={initialAllowedBotIds}
                  redirectTo="/console/members"
                  isEditor={isEditor}
                  hostedAccessControlReady={data.hostedAccessControlReady}
                />
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}
