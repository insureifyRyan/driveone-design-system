import crypto from 'node:crypto';
const CADENCE=[0,3,7,12,18,25,32,40,48,60];
const CAP=200;
const key=d=>d.toISOString().slice(0,10);

// mode 'next'  : slip forward to next allowed day (current behaviour)
// mode 'spread': slip to the person's own preferred allowed weekday
function run(label, sendDays, mode, intakePerDay, total=148){
  const SEND=new Set(sendDays);
  const allowed=[...SEND].sort();
  const perDay=new Map();
  // build intake groups
  let d=new Date('2026-09-29T14:00:00Z'), assigned=0, people=[];
  while(assigned<total){
    while(!SEND.has(d.getUTCDay())) d.setUTCDate(d.getUTCDate()+1);
    const n=Math.min(intakePerDay,total-assigned);
    for(let i=0;i<n;i++) people.push({start:new Date(d), id:'p'+(assigned+i)});
    assigned+=n; d.setUTCDate(d.getUTCDate()+1);
  }
  for(const p of people){
    const pref=allowed[parseInt(crypto.createHash('md5').update(p.id).digest('hex').slice(0,4),16)%allowed.length];
    for(const off of CADENCE){
      const due=new Date(p.start); due.setUTCDate(due.getUTCDate()+off);
      if(mode==='next'){ while(!SEND.has(due.getUTCDay())) due.setUTCDate(due.getUTCDate()+1); }
      else { while(due.getUTCDay()!==pref) due.setUTCDate(due.getUTCDate()+1); }
      const k=key(due); perDay.set(k,(perDay.get(k)||0)+1);
    }
  }
  const days=[...perDay.entries()].sort();
  const peak=Math.max(...days.map(([,n])=>n));
  console.log(label.padEnd(46), 'peak/day', String(peak).padStart(4),
    peak>CAP?'OVER CAP':'ok', '| send days', String(days.length).padStart(3),
    '| first 8:', days.slice(0,8).map(([dd,n])=>dd.slice(5)+':'+n).join(' '));
  return peak;
}
console.log('cohort 148, cap 200\n');
run('Tue/Wed/Thu, slip-to-next, 148 at once','2,3,4'.split(',').map(Number),'next',148);
run('Tue/Wed/Thu, slip-to-next, 30/day',[2,3,4],'next',30);
run('Tue/Wed/Thu, own-weekday, 30/day',[2,3,4],'spread',30);
run('Mon-Fri, slip-to-next, 30/day',[1,2,3,4,5],'next',30);
run('Mon-Fri, own-weekday, 30/day',[1,2,3,4,5],'spread',30);
run('Mon-Fri, own-weekday, 20/day',[1,2,3,4,5],'spread',20);
