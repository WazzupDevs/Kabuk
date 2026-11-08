import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database, Json } from '../../supabase/functions/_shared/pure/database.ts';

// `pnpm admin:reports` (docs/OPS.md → Moderasyon): reading and closing what people reported.
//   list [all]          open reports, oldest first (all: reviewed ones too)
//   done <reportId>     marks one reviewed
// Reports are deleted 30 days after they were made (private.delete_old_reports), so the list is
// read at least weekly. Acting on one is `pnpm admin:ban <userId>` or `pnpm admin:remove-photo`.

export type ReportCommand = { kind: 'list'; all: boolean } | { kind: 'done'; reportId: string };

export const REPORT_USAGE = [
  'pnpm admin:reports list [all]',
  'pnpm admin:reports done <reportId>',
].join('\n');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseReportCommand(args: readonly string[]): ReportCommand | null {
  const [verb, arg, ...rest] = args;
  if (rest.length > 0) return null;
  if (verb === 'list' && (arg === undefined || arg === 'all')) {
    return { kind: 'list', all: arg === 'all' };
  }
  if (verb === 'done' && arg !== undefined && UUID.test(arg))
    return { kind: 'done', reportId: arg };
  return null;
}

export type ReportRow = Pick<
  Database['public']['Tables']['reports']['Row'],
  | 'id'
  | 'created_at'
  | 'status'
  | 'reason'
  | 'target_type'
  | 'reported_user_id'
  | 'reporter_id'
  | 'messages_snapshot'
  | 'profile_snapshot'
  | 'photo_copy'
  | 'cover_copy'
>;

const LINE_MAX = 160;

function oneLine(value: Json | null): string | null {
  if (value === null) return null;
  const text = JSON.stringify(value);
  return text.length > LINE_MAX ? `${text.slice(0, LINE_MAX - 1)}…` : text;
}

// What the owner reads in the terminal: when, why, about whom, and what was kept as evidence.
export function formatReport(r: ReportRow): string {
  const lines = [
    `${r.id}  ${r.created_at.slice(0, 16).replace('T', ' ')}  ${r.status}  ${r.target_type} / ${r.reason}`,
    `  reported user: ${r.reported_user_id ?? '(deleted)'}   reporter: ${r.reporter_id ?? '(deleted)'}`,
  ];
  const messages = oneLine(r.messages_snapshot);
  if (messages) lines.push(`  messages: ${messages}`);
  const profile = oneLine(r.profile_snapshot);
  if (profile) lines.push(`  profile: ${profile}`);
  const files = [r.photo_copy, r.cover_copy].filter((f): f is string => f !== null);
  if (files.length > 0) lines.push(`  kept files: ${files.join(', ')}`);
  return lines.join('\n');
}

export async function runReportCommand(
  admin: SupabaseClient<Database>,
  command: ReportCommand,
): Promise<string> {
  if (command.kind === 'done') {
    const { data, error } = await admin
      .from('reports')
      .update({ status: 'reviewed' })
      .eq('id', command.reportId)
      .select('id');
    if (error) throw error;
    return data.length === 0 ? `No report ${command.reportId}` : `Reviewed ${command.reportId}`;
  }
  let query = admin
    .from('reports')
    .select(
      'id, created_at, status, reason, target_type, reported_user_id, reporter_id, messages_snapshot, profile_snapshot, photo_copy, cover_copy',
    )
    .order('created_at', { ascending: true })
    .limit(200);
  if (!command.all) query = query.eq('status', 'open');
  const { data, error } = await query;
  if (error) throw error;
  if (data.length === 0) return command.all ? 'No reports.' : 'No open reports.';
  return data.map(formatReport).join('\n\n');
}
