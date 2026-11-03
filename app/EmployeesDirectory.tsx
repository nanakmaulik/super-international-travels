'use client';

import {useMemo,useState} from 'react';
import type {Employee} from '@/lib/payroll';

type Props={
 employees:Employee[];
 onEnroll:(id:string)=>void;
 onEditSalary:(employee:Employee)=>void;
};

const money=(n:number)=>
 '₹'+Number(n||0).toLocaleString('en-IN',{
  maximumFractionDigits:2
 });

export default function EmployeesDirectory({
 employees,onEnroll,onEditSalary
}:Props){

 const [search,setSearch]=useState('');
 const [department,setDepartment]=useState('all');
 const [faceFilter,setFaceFilter]=useState('all');

 const departments=useMemo(
  ()=>Array.from(new Set(
   employees.map(e=>e.department||'General')
  )).sort(),
  [employees]
 );

 const active=employees.filter(e=>e.active);
 const enrolled=active.filter(e=>!!e.face_id).length;
 const pending=active.length-enrolled;

 const enrollmentPct=active.length?
  Math.round(enrolled/active.length*100):0;

 const filtered=useMemo(()=>employees.filter(e=>{
  const q=search.trim().toLowerCase();

  const matchesSearch=(
   (e.name||'')+' '+
   (e.employee_code||'')+' '+
   (e.department||'')
  ).toLowerCase().includes(q);

  const matchesDepartment=
   department==='all'||
   (e.department||'General')===department;

  const matchesFace=
   faceFilter==='all'||
   (faceFilter==='enrolled'&&!!e.face_id)||
   (faceFilter==='pending'&&!e.face_id);

  return matchesSearch&&matchesDepartment&&matchesFace;
 }),[employees,search,department,faceFilter]);

 return <div className="wp-employees-pro">

  <section className="wp-employees-heading">
   <div>
    <div className="wp-employees-eyebrow">
     PEOPLE & ORGANIZATION
    </div>
    <h2>Employee Directory</h2>
    <p>
     Manage your team, compensation and secure face enrollment.
    </p>
   </div>
   <div className="wp-employees-total">
    <span>Workforce</span>
    <strong>{active.length} active</strong>
   </div>
  </section>

  <div className="wp-employee-metrics">
   <div className="wp-employee-metric">
    <span className="wp-employee-metric-icon blue">♙</span>
    <span>Total Employees</span>
    <strong>{employees.length}</strong>
    <small>Registered in your organization</small>
   </div>

   <div className="wp-employee-metric">
    <span className="wp-employee-metric-icon green">✓</span>
    <span>Face Enrolled</span>
    <strong>{enrolled}</strong>
    <small>Active staff with face templates</small>
   </div>

   <div className="wp-employee-metric">
    <span className="wp-employee-metric-icon orange">◷</span>
    <span>Enrollment Pending</span>
    <strong>{pending}</strong>
    <small>Active staff not yet enrolled</small>
   </div>

   <div className="wp-employee-metric">
    <span className="wp-employee-metric-icon purple">%</span>
    <span>Enrollment Coverage</span>
    <strong>{enrollmentPct}%</strong>
    <div className="wp-employee-progress">
     <div style={{width:`${enrollmentPct}%`}}/>
    </div>
   </div>
  </div>

  <section className="wp-employee-panel">
   <div className="wp-employee-panel-head">
    <div>
     <h3>All Employees</h3>
     <p>
      View employee details, enrollment status and salary setup.
     </p>
    </div>
    <span className="wp-employee-count">
     {filtered.length} results
    </span>
   </div>

   <div className="wp-employee-toolbar">
    <input
     aria-label="Search employees"
     placeholder="Search by name, employee ID or department..."
     value={search}
     onChange={e=>setSearch(e.target.value)}
    />

    <select
     aria-label="Filter department"
     value={department}
     onChange={e=>setDepartment(e.target.value)}
    >
     <option value="all">All Departments</option>
     {departments.map(d=>
      <option key={d} value={d}>{d}</option>
     )}
    </select>

    <select
     aria-label="Filter face status"
     value={faceFilter}
     onChange={e=>setFaceFilter(e.target.value)}
    >
     <option value="all">All Face Statuses</option>
     <option value="enrolled">Enrolled</option>
     <option value="pending">Pending Enrollment</option>
    </select>
   </div>

   <div className="wp-employee-table-scroll">
    <table className="wp-employee-table">
     <thead>
      <tr>
       <th>Employee</th>
       <th>Department</th>
       <th>Compensation</th>
       <th>Face Recognition</th>
       <th>Actions</th>
      </tr>
     </thead>
     <tbody>
      {filtered.map(e=>
       <tr key={e.id}>
        <td>
         <div className="wp-employee-person">
          <div className="wp-employee-avatar">
           {e.name.slice(0,2).toUpperCase()}
          </div>
          <div>
           <strong>{e.name}</strong>
           <small>{e.employee_code}</small>
          </div>
         </div>
        </td>

        <td>
         <span className="wp-employee-department">
          {e.department||'General'}
         </span>
        </td>

        <td>
         <div className="wp-employee-pay">
          <strong>{money(e.salary_rate)}</strong>
          <small>
           {e.salary_type==='monthly'?'Per month':'Per hour'}
          </small>
         </div>
        </td>

        <td>
         <span className={
          'wp-employee-face '+(e.face_id?'enrolled':'pending')
         }>
          {e.face_id?'✓ Enrolled':'◷ Pending'}
         </span>
        </td>

        <td>
         <div className="wp-employee-actions">
          <button
           onClick={()=>onEnroll(e.id)}
           className="wp-employee-action-primary"
          >
           {e.face_id?'Re-enroll Face':'Enroll Face'}
          </button>

          <button
           onClick={()=>onEditSalary(e)}
           className="wp-employee-action-secondary"
          >
           Edit Salary
          </button>
         </div>
        </td>
       </tr>
      )}
      {!filtered.length&&
       <tr>
        <td colSpan={5} className="wp-employee-empty">
         No employees match these filters.
        </td>
       </tr>
      }
     </tbody>
    </table>
   </div>

   <div className="wp-employee-footer">
    Showing {filtered.length} of {employees.length} employees
    <span>
     Face enrollment requires employee authorization.
    </span>
   </div>
  </section>
 </div>;
}
