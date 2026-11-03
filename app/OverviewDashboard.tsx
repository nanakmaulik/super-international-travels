'use client';

import {useMemo} from 'react';
import type {Employee,Event} from '@/lib/payroll';

type AttendanceEvent=Event&{
 id:string;
 similarity:number|null;
};

type Device={
 id:string;
 name:string;
 active:boolean;
};

type Props={
 employees:Employee[];
 events:AttendanceEvent[];
 devices:Device[];
 company:string;
 onNavigate:(v:'employees'|'attendance'|'payroll'|'kiosks')=>void;
 onRefresh:()=>void;
};

const dateKey=(d:Date)=>{
 const y=d.getFullYear();
 const m=String(d.getMonth()+1).padStart(2,'0');
 const day=String(d.getDate()).padStart(2,'0');
 return `${y}-${m}-${day}`;
};

const time=(s:string)=>new Date(s).toLocaleTimeString('en-IN',{
 hour:'numeric',minute:'2-digit',hour12:true
});

const stamp=(s:string)=>new Date(s).toLocaleDateString('en-IN',{
 day:'2-digit',month:'short',year:'numeric'
});

export default function OverviewDashboard({
 employees,events,devices,company,onNavigate,onRefresh
}:Props){

 const now=new Date();
 const today=dateKey(now);

 const data=useMemo(()=>{
  const active=employees.filter(e=>e.active);

  const sorted=[...events].sort(
   (a,b)=>new Date(b.happened_at).getTime()-
          new Date(a.happened_at).getTime()
  );

  const todayEvents=sorted.filter(
   e=>dateKey(new Date(e.happened_at))===today
  );

  const clockedIn=new Set(
   todayEvents.filter(e=>e.event_type==='in')
   .map(e=>e.employee_id)
  );

  const latest=new Map<string,AttendanceEvent>();

  for(const e of sorted){
   if(!latest.has(e.employee_id)){
    latest.set(e.employee_id,e);
   }
  }

  const currentlyIn=active.filter(
   e=>latest.get(e.id)?.event_type==='in'
  ).length;

  const activeDevices=devices.filter(d=>d.active).length;

  const confidenceScores=todayEvents
   .map(e=>Number(e.similarity))
   .filter(v=>Number.isFinite(v)&&v>0);

  const confidence=confidenceScores.length?
   confidenceScores.reduce((a,b)=>a+b,0)/
   confidenceScores.length:null;

  return {
   active,sorted,todayEvents,
   clockedIn:clockedIn.size,
   currentlyIn,activeDevices,
   confidence
  };
 },[employees,events,devices,today]);

 const percentage=data.confidence===null?'—':
  (data.confidence<=1?
   data.confidence*100:data.confidence).toFixed(1)+'%';

 return <div className="wp-overview">

  <section className="wp-overview-hero">
   <div>
    <div className="wp-overview-kicker">
     WORKFORCE COMMAND CENTER
    </div>
    <h2>Good to see you.</h2>
    <p>
     Here's what's happening at {company} today.
    </p>
    <div className="wp-overview-date">
     ◷ {now.toLocaleDateString('en-IN',{
      weekday:'long',day:'numeric',
      month:'long',year:'numeric'
     })}
    </div>
   </div>

   <div className="wp-overview-hero-actions">
    <button onClick={onRefresh} className="wp-overview-ghost">
     ↻ Refresh Data
    </button>
    <button
     onClick={()=>onNavigate('attendance')}
     className="wp-overview-primary">
     View Attendance →
    </button>
   </div>
  </section>

  <div className="wp-overview-metrics">
   {[
    ['Total Employees',data.active.length,
     'Active workforce','blue','♙'],
    ['Currently In',data.currentlyIn,
     'Latest recorded event is IN','green','◉'],
    ['Clock-ins Today',data.clockedIn,
     'Unique employees today','purple','◷'],
    ['Active Devices',data.activeDevices,
     `${devices.length} registered in total`,'teal','▣']
   ].map(([title,value,sub,tone,icon])=>
    <section className={'wp-overview-metric '+tone} key={String(title)}>
     <div className="wp-overview-metric-top">
      <span>{title}</span>
      <div className="wp-overview-metric-icon">{icon}</div>
     </div>
     <strong>{value}</strong>
     <small>{sub}</small>
    </section>
   )}
  </div>

  <div className="wp-overview-grid">
   <section className="wp-overview-panel">
    <div className="wp-overview-section-head">
     <div>
      <h3>Recent Attendance Activity</h3>
      <p>Latest recorded face attendance events</p>
     </div>
     <button
      className="wp-overview-link"
      onClick={()=>onNavigate('attendance')}>
      View All →
     </button>
    </div>

    <div className="wp-overview-table-scroll">
     <table className="wp-overview-table">
      <thead>
       <tr>
        <th>Employee</th>
        <th>Event</th>
        <th>Date</th>
        <th>Time</th>
        <th>Recognition</th>
       </tr>
      </thead>
      <tbody>
       {data.sorted.slice(0,8).map(e=>{
        const employee=employees.find(x=>x.id===e.employee_id);
        const score=Number(e.similarity);
        const scoreText=Number.isFinite(score)&&score>0?
         (score<=1?score*100:score).toFixed(1)+'%':'—';

        return <tr key={e.id}>
         <td>
          <div className="wp-overview-person">
           <span className="wp-overview-avatar">
            {(employee?.name||'E').slice(0,1).toUpperCase()}
           </span>
           <span>
            <b>{employee?.name||'Employee'}</b>
            <small>{employee?.employee_code||''}</small>
           </span>
          </div>
         </td>
         <td>
          <span className={
           'wp-overview-event '+e.event_type
          }>
           {e.event_type==='in'?'● Clock In':'○ Clock Out'}
          </span>
         </td>
         <td>{stamp(e.happened_at)}</td>
         <td>{time(e.happened_at)}</td>
         <td><b>{scoreText}</b></td>
        </tr>;
       })}
       {!data.sorted.length&&
        <tr><td colSpan={5} className="wp-overview-empty">
         No attendance events recorded yet.
        </td></tr>
       }
      </tbody>
     </table>
    </div>
   </section>

   <aside className="wp-overview-right">
    <section className="wp-overview-panel wp-overview-operations">
     <div className="wp-overview-section-head">
      <div>
       <h3>Today's Operations</h3>
       <p>Daily workforce snapshot</p>
      </div>
     </div>

     <div className="wp-overview-operation-row">
      <span>Active employees</span>
      <strong>{data.active.length}</strong>
     </div>
     <div className="wp-overview-operation-row">
      <span>Recorded clock-ins</span>
      <strong>{data.clockedIn}</strong>
     </div>
     <div className="wp-overview-operation-row">
      <span>Today's events</span>
      <strong>{data.todayEvents.length}</strong>
     </div>
     <div className="wp-overview-operation-row">
      <span>Avg. recognition score</span>
      <strong>{percentage}</strong>
     </div>
     <div className="wp-overview-operation-row">
      <span>Active attendance devices</span>
      <strong>{data.activeDevices}</strong>
     </div>

     <p className="wp-overview-footnote">
      Employee presence is based on the latest recorded
      attendance event, not live camera tracking.
     </p>
    </section>

    <section className="wp-overview-panel wp-overview-shortcuts">
     <div className="wp-overview-section-head">
      <div>
       <h3>Quick Actions</h3>
       <p>Manage your workforce</p>
      </div>
     </div>

     <button onClick={()=>onNavigate('employees')}>
      ♙ Manage Employees <span>→</span>
     </button>
     <button onClick={()=>onNavigate('attendance')}>
      ◷ Attendance Records <span>→</span>
     </button>
     <button onClick={()=>onNavigate('payroll')}>
      ▤ Monthly Payroll <span>→</span>
     </button>
     <button onClick={()=>onNavigate('kiosks')}>
      ▣ Attendance Devices <span>→</span>
     </button>
    </section>
   </aside>
  </div>
 </div>;
}
