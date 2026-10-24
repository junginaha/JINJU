'use client';
import { useEffect, useState } from 'react';
import { koreaDay, nextKoreaDay, type TodaysPearl as Pick } from '../lib/todays-pearl';
import styles from './TodaysPearl.module.css';

export default function TodaysPearl({ initialPearl }: { initialPearl?: Pick | null }) {
  const [pearl,setPearl] = useState(initialPearl ?? null);
  useEffect(() => {
    let stopped=false;
    let timer: ReturnType<typeof setTimeout>;
    const controller=new AbortController();
    async function refresh() {
      try {
        const response=await fetch('/api/todays-pearl',{cache:'no-store',signal:controller.signal});
        if (!response.ok) throw new Error('unavailable');
        const data=await response.json() as {pearl:Pick|null};
        if (!stopped) setPearl(data.pearl);
      } catch { if (!stopped) setPearl(current => current?.day===koreaDay(Date.now()) ? current : null); }
    }
    function schedule() {
      timer=setTimeout(async()=>{ await refresh(); if(!stopped)schedule(); },nextKoreaDay(Date.now())-Date.now()+1000);
    }
    function onVisible() { if(document.visibilityState==='visible')void refresh(); }
    void refresh();schedule();
    document.addEventListener('visibilitychange',onVisible);
    return()=>{stopped=true;controller.abort();clearTimeout(timer);document.removeEventListener('visibilitychange',onVisible);};
  },[]);
  if(!pearl)return null;
  return <aside className={styles.card} aria-label="오늘의 진주">
    <a className={styles.link} href={`/post/${encodeURIComponent(pearl.id)}`}>
      <div className={styles.top}><span className={styles.label}><span className={styles.pearl} aria-hidden="true" />오늘의 진주</span></div>
      <h2>{pearl.title}</h2>
      <p className={styles.excerpt}>{pearl.excerpt}</p>
      <div className={styles.bottom}><span>{pearl.reason}</span><strong>함께 읽기 <span aria-hidden="true">↗</span></strong></div>
    </a>
  </aside>;
}
