'use client';
import {useMemo,useState} from 'react';
import type {Employee,Event} from '@/lib/payroll';

type AttendanceEvent = Event & {
  id:string;
  similarity:number|null;
};

type Period='today'|'yesterday'|'week'|'month'|'custom';

const dayKey=(d:Date)=>{
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
};

const parseDay=(s:string)=>new Date(`${s}T12:00:00`);

const addDays=(d:Date,n:number)=>{
  const x=new Date(d);
  x.setDate(x.getDate()+n);
  return x;
};

const clock=(value?:string)=>{
  if(!value)return '—';
  return new Date(value).toLocaleTimeString('en-IN',{
    hour:'numeric',minute:'2-digit',hour12:true
  });
};

const readableDate=(value:string)=>{
  return parseDay(value).toLocaleDateString('en-IN',{
    weekday:'short',day:'numeric',month:'short',year:'numeric'
  });
};

const duration=(ms:number)=>{
  const mins=Math.max(0,Math.floor(ms/60000));
  return `${Math.floor(mins/60)}h ${String(mins%60).padStart(2,'0')}m`;
};

const csvCell=(v:unknown)=>'"'+String(v??'').replaceAll('"','""')+'"';

export default function AttendanceDashboard({
  employees,events
}:{
  employees:Employee[];
  events:AttendanceEvent[];
}){
  const [period,setPeriod]=useState<Period>('today');
  const [custom,setCustom]=useState(dayKey(new Date()));
  const [query,setQuery]=useState('');
  const [eventFilter,setEventFilter]=useState('all');
  const [selectedEmployee,setSelectedEmployee]=useState('all');

  // Recalculate after midnight without requiring browser reload.
  const [now,setNow]=useState(()=>new Date());

  const range=useMemo(()=>{
    const today=new Date(now);
    let from=dayKey(today);
    let to=from;

    if(period==='yesterday'){
      from=to=dayKey(addDays(today,-1));
    }else if(period==='week'){
      const offset=(today.getDay()+6)%7;
      from=dayKey(addDays(today,-offset));
    }else if(period==='month'){
      from=dayKey(new Date(today.getFullYear(),today.getMonth(),1));
    }else if(period==='custom'){
      from=to=custom;
    }
    return {from,to};
  },[period,custom,now]);

  const filteredEvents=useMemo(
    ()=>events.filter(e=>{
      const date=dayKey(new Date(e.happened_at));
      return date>=range.from&&date<=range.to;
    }).sort((a,b)=>a.happened_at.localeCompare(b.happened_at)),
    [events,range]
  );

  const activeEmployees=employees.filter(e=>e.active);

  const rows=useMemo(()=>{
    return activeEmployees.map(employee=>{
      const punches=filteredEvents.filter(
        e=>e.employee_id===employee.id
      );

      const firstIn=punches.find(e=>e.event_type==='in');
      const lastOut=[...punches].reverse().find(
        e=>e.event_type==='out'
      );

      // Sum completed IN -> OUT pairs.
      let opened:AttendanceEvent|null=null;
      let worked=0;
      let incomplete=false;

      for(const p of punches){
        if(p.event_type==='in'){
          if(opened)incomplete=true;
          opened=p;
        }else if(opened){
          const start=new Date(opened.happened_at).getTime();
          const end=new Date(p.happened_at).getTime();
          if(end>start&&end-start<=86400000){
            worked+=end-start;
          }else{
            incomplete=true;
          }
          opened=null;
        }else{
          incomplete=true;
        }
      }

      if(opened)incomplete=true;

      const latest=punches.at(-1);
      const status=!punches.length?'no-record':
        latest?.event_type==='in'?'working':'completed';

      const scores=punches
        .map(p=>Number(p.similarity))
        .filter(v=>Number.isFinite(v)&&v>0);

      const confidence=scores.length?
        scores.reduce((a,b)=>a+b,0)/scores.length:null;

      return {
        employee,punches,firstIn,lastOut,
        worked,incomplete,status,confidence
      };
    });
  },[activeEmployees,filteredEvents]);

  const displayed=rows.filter(r=>{
    const text=(
      r.employee.name+' '+
      r.employee.employee_code+' '+
      r.employee.department
    ).toLowerCase();

    return text.includes(query.toLowerCase()) &&
      (selectedEmployee==='all'||r.employee.id===selectedEmployee) &&
      (eventFilter==='all'||r.status===eventFilter);
  });

  const present=rows.filter(r=>r.status==='working').length;
  const completed=rows.filter(r=>r.status==='completed').length;
  const recorded=rows.filter(r=>r.punches.length>0).length;
  const noRecord=rows.length-recorded;

  function exportCSV(){
    const lines=[
      ['Employee ID','Employee','Department','Status',
       'First Clock In','Last Clock Out',
       'Completed Work Duration','Recognition'].map(csvCell).join(','),
      ...displayed.map(r=>[
        r.employee.employee_code,r.employee.name,
        r.employee.department,r.status,
        r.firstIn?.happened_at||'',
        r.lastOut?.happened_at||'',
        duration(r.worked),
        r.confidence===null?'':r.confidence.toFixed(1)+'%'
      ].map(csvCell).join(','))
    ];

    const blob=new Blob(['\uFEFF'+lines.join('\r\n')],{
      type:'text/csv;charset=utf-8'
    });
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`workpulse-attendance-${range.from}-${range.to}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const rangeTitle=range.from===range.to?
    readableDate(range.from):
    `${readableDate(range.from)} – ${readableDate(range.to)}`;

  return <div className="att-dashboard">
    <div className="att-heading">
      <div>
        <p className="att-kicker">WORKFORCE / ATTENDANCE</p>
        <h2>Daily Attendance</h2>
        <p>Track attendance, working hours and recognition quality.</p>
      </div>
      <button className="att-refresh" onClick={()=>setNow(new Date())}>
        ↻ Update Date
      </button>
    </div>

    <section className="att-panel att-filter-panel">
      <div className="att-periods">
        {([
          ['today','Today'],
          ['yesterday','Yesterday'],
          ['week','This Week'],
          ['month','This Month'],
          ['custom','Custom Date']
        ] as [Period,string][]).map(([key,label])=>
          <button
            key={key}
            type="button"
            className={period===key?'selected':''}
            onClick={()=>setPeriod(key)}
          >{label}</button>
        )}
      </div>

      <div className="att-date-row">
        <div className="att-date-label">
          <span>Selected period</span>
          <strong>▣ {rangeTitle}</strong>
        </div>
        <label className="att-date-input">
          <span>Select date</span>
          <input type="date" value={custom}
            max={dayKey(new Date())}
            onChange={e=>{
              setCustom(e.target.value);
              setPeriod('custom');
            }}/>
        </label>
      </div>
    </section>

    <div className="att-metrics">
      {[
        ['Employees',rows.length,'Total active staff','neutral'],
        ['Currently In',present,'Last event: Clock In','green'],
        ['Clocked Out',completed,'Last event: Clock Out','blue'],
        ['No Record',noRecord,'No events in selected period','orange']
      ].map(([title,value,sub,tone])=>
        <div className={'att-metric att-'+tone} key={String(title)}>
          <div className="att-metric-title">{title}</div>
          <div className="att-metric-value">{value}</div>
          <div className="att-metric-sub">{sub}</div>
        </div>
      )}
    </div>

    <section className="att-panel att-list">
      <div className="att-list-head">
        <div>
          <h3>Employee Attendance</h3>
          <p>{rangeTitle} · {recorded} employees with recorded events</p>
        </div>
        <button className="att-export" onClick={exportCSV}>
          ↓ Export CSV
        </button>
      </div>

      <div className="att-toolbar">
        <input
          aria-label="Search employees"
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="⌕ Search employee name or ID..."
        />
        <select aria-label="Filter employee"
          value={selectedEmployee}
          onChange={e=>setSelectedEmployee(e.target.value)}>
          <option value="all">All Employees</option>
          {activeEmployees.map(e=>
            <option value={e.id} key={e.id}>{e.name}</option>
          )}
        </select>
        <select aria-label="Filter status"
          value={eventFilter}
          onChange={e=>setEventFilter(e.target.value)}>
          <option value="all">All Statuses</option>
          <option value="working">Currently In</option>
          <option value="completed">Clocked Out</option>
          <option value="no-record">No Record</option>
        </select>
      </div>

      <div className="att-table-scroll">
        <table className="att-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Status</th>
              <th>First In</th>
              <th>Last Out</th>
              <th>Completed Hours</th>
              <th>Recognition</th>
            </tr>
          </thead>
          <tbody>
            {displayed.map(r=><tr key={r.employee.id}>
              <td>
                <div className="att-person">
                  <div className="att-avatar">
                    {r.employee.name.slice(0,1).toUpperCase()}
                  </div>
                  <div>
                    <strong>{r.employee.name}</strong>
                    <small>{r.employee.employee_code} · {r.employee.department}</small>
                  </div>
                </div>
              </td>
              <td>
                <span className={'att-status '+r.status}>
                  {r.status==='working'?'● Currently In':
                   r.status==='completed'?'✓ Clocked Out':'○ No Record'}
                </span>
              </td>
              <td>{clock(r.firstIn?.happened_at)}</td>
              <td>{clock(r.lastOut?.happened_at)}</td>
              <td>
                <strong>{r.punches.length?duration(r.worked):'—'}</strong>
                {r.incomplete&&<small className="att-warning">Unpaired punch</small>}
              </td>
              <td>
                {r.confidence===null?'—':<>
                  <strong>{r.confidence.toFixed(1)}%</strong>
                  <div className="att-confidence">
                    <span style={{width:`${Math.max(0,Math.min(100,r.confidence))}%`}}/>
                  </div>
                </>}
              </td>
            </tr>)}
            {!displayed.length&&
              <tr><td colSpan={6} className="att-empty">
                No employees match the selected filters.
              </td></tr>
            }
          </tbody>
        </table>
      </div>
      <div className="att-table-footer">
        Showing {displayed.length} of {rows.length} employees
        <span>All times displayed in your browser's local timezone</span>
      </div>
    </section>
    <p className="att-note">
      Note: No Record is not an approved absence or leave.
      Unpaired punches require review. Work duration includes
      completed IN/OUT pairs only; overnight and period-boundary
      shifts need additional reconciliation.
    </p>
  </div>;
}
