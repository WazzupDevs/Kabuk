# The perf trace's summary (perf/trace branch): where the app's frames go.
import sys
from perfetto.trace_processor import TraceProcessor, TraceProcessorConfig

trace, out = sys.argv[1], sys.argv[2]
tp = TraceProcessor(trace=trace, config=TraceProcessorConfig(verbose=False))
APP = "app.kabuk.mobil"  # comm is cut at 15 characters
lines = []
# The app forked from zygote after the trace began: its process keeps zygote's name. It is the
# process with the most slices outside the system's.
UPID = next(iter(tp.query("""
  select p.upid from slice sl join thread_track tt on sl.track_id = tt.id join thread t using(utid)
  join process p using(upid) where p.name like 'zygote%' or p.name like 'app.kabuk%'
  group by p.upid order by count(*) desc limit 1
"""))).upid

def table(title, sql, cols):
    rows = list(tp.query(sql))
    lines.append(f"### {title}\n")
    lines.append("| " + " | ".join(cols) + " |")
    lines.append("|" + "---|" * len(cols))
    for r in rows:
        lines.append("| " + " | ".join(str(getattr(r, c)) for c in cols) + " |")
    lines.append("")

table("Trace bounds", "select round((end_ts - start_ts)/1e9, 1) as seconds from trace_bounds", ["seconds"])
table("Stats (errors, data loss)", "select name, idx, severity, value from stats where value > 0 and severity in ('error', 'data_loss') order by value desc limit 30", ["name", "idx", "severity", "value"])
table("Processes by slice count", """
  select p.pid, p.name, count(*) as n from slice sl join thread_track tt on sl.track_id = tt.id
  join thread t using(utid) left join process p using(upid) group by p.pid, p.name order by n desc limit 25
""", ["pid", "name", "n"])
table("Processes like the app", f"""
  select pid, name, cmdline from process where name like 'app.kabuk%' or cmdline like 'app.kabuk%'
""", ["pid", "name", "cmdline"])

table("Frames (FrameTimeline)", f"""
  select count(*) as frames,
    sum(case when jank_type != 'None' then 1 else 0 end) as janky,
    round(avg(dur)/1e6, 1) as avg_ms,
    round(max(dur)/1e6, 1) as max_ms
  from actual_frame_timeline_slice a join process p using(upid)
  where p.upid = {UPID}
""", ["frames", "janky", "avg_ms", "max_ms"])

table("Jank types", f"""
  select jank_type, count(*) as n, round(avg(dur)/1e6,1) as avg_ms
  from actual_frame_timeline_slice a join process p using(upid)
  where p.upid = {UPID} group by jank_type order by n desc limit 15
""", ["jank_type", "n", "avg_ms"])

THREAD = {"RenderThread": "t.name = 'RenderThread'", "main": "t.tid = p.pid"}

def by_thread(thread, limit):
    table(f"{thread}: slices by self time", f"""
      with s as (
        select sl.id, sl.name, sl.dur, sl.depth,
          sl.dur - coalesce((select sum(c.dur) from slice c where c.parent_id = sl.id), 0) as self
        from slice sl join thread_track tt on sl.track_id = tt.id
          join thread t using(utid) join process p using(upid)
        where p.upid = {UPID} and {THREAD[thread]} and sl.dur > 0
      )
      select substr(name, 1, 70) as name, count(*) as n, round(sum(self)/1e6, 1) as self_ms,
        round(sum(dur)/1e6, 1) as total_ms, round(avg(dur)/1e3, 0) as avg_us
      from s group by name order by self_ms desc limit {limit}
    """, ["name", "n", "self_ms", "total_ms", "avg_us"])

by_thread("RenderThread", 60)
by_thread("main", 40)

table("Top-level slices on RenderThread (whole frames)", f"""
  select substr(sl.name,1,60) as name, count(*) as n, round(sum(sl.dur)/1e6,1) as total_ms,
    round(avg(sl.dur)/1e6,2) as avg_ms, round(max(sl.dur)/1e6,1) as max_ms
  from slice sl join thread_track tt on sl.track_id = tt.id join thread t using(utid)
    join process p using(upid)
  where p.upid = {UPID} and t.name = 'RenderThread' and sl.depth = 0
  group by sl.name order by total_ms desc limit 15
""", ["name", "n", "total_ms", "avg_ms", "max_ms"])

table("Threads of the app by running time", f"""
  select t.name as thread, round(sum(ts.dur)/1e9, 1) as running_s
  from thread_state ts join thread t using(utid) join process p using(upid)
  where p.upid = {UPID} and ts.state = 'Running'
  group by t.name order by running_s desc limit 15
""", ["thread", "running_s"])

table("RenderThread: Skia / mask / blur / layer slices", f"""
  select substr(sl.name,1,80) as name, count(*) as n, round(sum(sl.dur)/1e6,1) as total_ms,
    round(avg(sl.dur)/1e3,0) as avg_us, round(max(sl.dur)/1e3,0) as max_us
  from slice sl join thread_track tt on sl.track_id = tt.id join thread t using(utid)
    join process p using(upid)
  where p.upid = {UPID} and t.name = 'RenderThread' and (
    sl.name like '%lur%' or sl.name like '%ask%' or sl.name like '%hadow%' or sl.name like '%lip%'
    or sl.name like '%ayer%' or sl.name like '%ffect%' or sl.name like '%oftware%' or sl.name like '%path%'
    or sl.name like '%Path%' or sl.name like '%hader%' or sl.name like '%pload%' or sl.name like '%exture%')
  group by sl.name order by total_ms desc limit 50
""", ["name", "n", "total_ms", "avg_us", "max_us"])

table("main: draw recording and RN mounting", f"""
  select substr(sl.name,1,80) as name, count(*) as n, round(sum(sl.dur)/1e6,1) as total_ms,
    round(avg(sl.dur)/1e3,0) as avg_us, round(max(sl.dur)/1e3,0) as max_us
  from slice sl join thread_track tt on sl.track_id = tt.id join thread t using(utid)
    join process p using(upid)
  where p.upid = {UPID} and t.tid = p.pid and (
    sl.name like '%draw%' or sl.name like '%Draw%' or sl.name like '%ount%' or sl.name like '%ayout%'
    or sl.name like '%easure%' or sl.name like '%nflate%' or sl.name like 'Choreographer%'
    or sl.name like '%traversal%' or sl.name like '%animation%')
  group by sl.name order by total_ms desc limit 40
""", ["name", "n", "total_ms", "avg_us", "max_us"])

table("Frame durations (FrameTimeline, app): percentiles", f"""
  with f as (select a.dur from actual_frame_timeline_slice a join process p using(upid)
    where p.upid = {UPID} order by a.dur),
  n as (select count(*) c from f)
  select (select round(dur/1e6,1) from f limit 1 offset (select c*50/100 from n)) as p50_ms,
    (select round(dur/1e6,1) from f limit 1 offset (select c*90/100 from n)) as p90_ms,
    (select round(dur/1e6,1) from f limit 1 offset (select c*99/100 from n)) as p99_ms,
    (select c from n) as frames
""", ["p50_ms", "p90_ms", "p99_ms", "frames"])

# The 15 slowest DrawFrames on the RenderThread, with their biggest children.
rows = list(tp.query(f"""
  select sl.id, sl.ts, round(sl.dur/1e6,1) as ms, sl.name from slice sl
  join thread_track tt on sl.track_id = tt.id join thread t using(utid) join process p using(upid)
  where p.upid = {UPID} and t.name = 'RenderThread' and sl.depth = 0
  order by sl.dur desc limit 15
"""))
lines.append("### Slowest RenderThread frames and their parts\n")
for r in rows:
    lines.append(f"- {r.name} {r.ms} ms")
    kids = list(tp.query(f"""
      with recursive d(id, name, dur, depth) as (
        select id, name, dur, depth from slice where id = {r.id}
        union all select s.id, s.name, s.dur, s.depth from slice s join d on s.parent_id = d.id
      ) select substr(name,1,70) as name, count(*) as n, round(sum(dur)/1e6,1) as ms
        from d where id != {r.id} group by name order by ms desc limit 8
    """))
    for k in kids:
        lines.append(f"  - {k.name} x{k.n}: {k.ms} ms")
lines.append("")

table("All slice names in the app (top 120 by count)", f"""
  select substr(sl.name,1,60) as name, t.name as thread, count(*) as n
  from slice sl join thread_track tt on sl.track_id = tt.id join thread t using(utid)
    join process p using(upid)
  where p.upid = {UPID} group by sl.name, t.name order by n desc limit 120
""", ["name", "thread", "n"])

open(out, "w").write("\n".join(lines))
print("\n".join(lines))
