import { useEffect, useMemo, useState } from 'react';

import {
 Activity,
 ArrowUpRight,
 ArrowLeft,
 ArrowRight,
 BriefcaseBusiness,
 Building2,
 CalendarDays,
 Check,
 ChevronDown,
 ChevronRight,
 Clock3,
 ExternalLink,
 FileText,
 Globe2,
 History,
 Lightbulb,
 LoaderCircle,
 Search,
 ShieldCheck,
 Sparkles,
 Target,
 Users,
 AlertTriangle,
 Menu,
 X
} from 'lucide-react';

import {
 createBriefing,
 getBriefing,
 getHistory,
 health
} from '../services/api';

import type { Briefing, Meeting } from '../types';


const types = [
 'Sales meeting',
 'Partnership discussion',
 'Investor meeting',
 'Job interview',
 'Business development',
 'General meeting'
];


const meetingTypes = [
 {
  name: 'Sales meeting',
  description: 'Customers, products and market positioning',
  icon: BriefcaseBusiness
 },
 {
  name: 'Partnership discussion',
  description: 'Strategic fit and collaboration opportunities',
  icon: Users
 },
 {
  name: 'Investor meeting',
  description: 'Funding and company performance',
  icon: Activity
 },
 {
  name: 'Job interview',
  description: 'Company culture and leadership',
  icon: Target
 },
 {
  name: 'Business development',
  description: 'Growth and market opportunities',
  icon: Globe2
 },
 {
  name: 'General meeting',
  description: 'Company background and developments',
  icon: FileText
 }
];


const dateToday = (() => {
 const now = new Date();
 const offset = now.getTimezoneOffset();

 return new Date(now.getTime() - offset * 60000)
  .toISOString()
  .slice(0, 10);
})();


export default function App() {

 const [page, setPage] = useState<
  'dashboard' | 'progress' | 'report' | 'sources' | 'history'
 >('dashboard');

 const [meeting, setMeeting] = useState<Meeting>({
  subject: '',
  subject_kind: 'Company',
  meeting_date: dateToday,
  meeting_time: '10:00',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  meeting_type: 'Partnership discussion',
  objective: ''
 });

 const [wizardStep, setWizardStep] = useState(1);

 const [briefing, setBriefing] = useState<Briefing | null>(null);

 const [history, setHistory] = useState<any[]>([]);

 const [busy, setBusy] = useState(false);

 const [error, setError] = useState('');

 const [apiStatus, setApiStatus] = useState<any>(null);

 const [selectedClaim, setSelectedClaim] = useState<string | null>(null);

 const [mobileNav, setMobileNav] = useState(false);


 useEffect(() => {

  getHistory()
   .then(setHistory)
   .catch(() => {});

  health()
   .then(setApiStatus)
   .catch(() => setApiStatus(null));

 }, []);


 const nav = [
  ['dashboard', 'Overview', Target],
  ['history', 'Briefing history', History]
 ] as const;


 const claim = briefing?.claims.find(
  c => c.id === selectedClaim
 );


 const sourceById = useMemo(
  () => new Map(briefing?.sources.map(s => [s.id, s]) || []),
  [briefing]
 );


 function updateMeeting<K extends keyof Meeting>(
  key: K,
  value: Meeting[K]
 ) {
  setMeeting(previous => ({
   ...previous,
   [key]: value
  }));
 }


 function nextStep() {

  setError('');

  if (wizardStep === 1 && meeting.subject.trim().length < 2) {
   setError('Please enter a company or person name.');
   return;
  }

  if (wizardStep === 3 && !meeting.meeting_date) {
   setError('Please select a meeting date.');
   return;
  }

  setWizardStep(step => Math.min(step + 1, 4));
 }


 function previousStep() {

  setError('');

  setWizardStep(step => Math.max(step - 1, 1));

 }


 async function prepare() {

  setError('');

  if (meeting.subject.trim().length < 2) {
   setError('Please enter a valid company or person name.');
   setWizardStep(1);
   return;
  }

  if (!meeting.meeting_date || !meeting.timezone.trim()) {
   setError('Please complete the meeting schedule.');
   setWizardStep(3);
   return;
  }

  setBusy(true);
  setPage('progress');

  try {

   const result = await createBriefing(meeting);

   setBriefing(result);

   const updatedHistory = await getHistory();

   setHistory(updatedHistory);

   setPage('report');

  } catch (err: any) {

   setError(
    err.message || 'We could not prepare your briefing. Please try again.'
   );

   setPage('dashboard');

  } finally {

   setBusy(false);

  }

 }


 async function openHistory(id: string) {

  try {

   setError('');

   const result = await getBriefing(id);

   setBriefing(result);

   setPage('report');

  } catch (err: any) {

   setError(err.message || 'Could not open this briefing.');

  }

 }


 function badge(status: string) {

  return (
   <span
    className={`badge ${status.toLowerCase().replaceAll(' ', '-')}`}
   >
    {status}
   </span>
  );

 }


 function safeUrl(url: string) {

  try {

   const parsed = new URL(url);

   if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
    return parsed.href;
   }

  } catch {
   return undefined;
  }

  return undefined;

 }


 return (

  <div className="shell">

   {/* SIDEBAR */}

   <aside className={`sidebar ${mobileNav ? 'show' : ''}`}>

    <div className="brand">

     <div className="brandmark">
      <Sparkles size={18}/>
     </div>

     <div>
      <b>briefly<span>ai</span></b>
      <small>MEETING INTELLIGENCE</small>
     </div>

     <button
      className="close-nav"
      onClick={() => setMobileNav(false)}
      aria-label="Close navigation"
     >
      <X/>
     </button>

    </div>


    <div className="workspace">
     <span className="workspace-dot"/>
     PERSONAL WORKSPACE
     <ChevronDown size={13}/>
    </div>


    <div className="nav-label">WORKSPACE</div>


    {nav.map(([id, label, Icon]) => (

     <button
      key={id}
      className={`nav-item ${page === id ? 'active' : ''}`}
      aria-current={page === id ? 'page' : undefined}
      onClick={() => {
       setPage(id);
       setMobileNav(false);
      }}
     >

      <Icon size={17}/>

      {label}

      {id === 'history' && history.length > 0 && (
       <span className="nav-count">{history.length}</span>
      )}

     </button>

    ))}


    <div className="sidebar-bottom">

     <div className="integration-card">

      <div className="integration-top">
       <span className="pulse"/>
       SYSTEM STATUS
      </div>

      <div className="integration-row">
       <span>Tavily Search</span>

       <b className={
        apiStatus?.integrations?.tavily_configured
         ? 'online'
         : 'offline'
       }>
        {apiStatus?.integrations?.tavily_configured
         ? 'Connected'
         : 'Not configured'}
       </b>
      </div>

      <div className="integration-row">
       <span>Gemini AI</span>

       <b className={
        apiStatus?.integrations?.gemini_configured
         ? 'online'
         : 'offline'
       }>
        {apiStatus?.integrations?.gemini_configured
         ? 'Connected'
         : 'Not configured'}
       </b>
      </div>

     </div>


     <div className="profile">

      <div className="avatar">B</div>

      <div>
       <b>BrieflyAI workspace</b>
       <small>Research desk</small>
      </div>

      <ChevronDown size={15}/>

     </div>

    </div>

   </aside>


   {mobileNav && (
    <div
     className="scrim"
     onClick={() => setMobileNav(false)}
    />
   )}


   {/* MAIN */}

   <main className="main">


    {/* TOPBAR */}

    <header className="topbar">

     <button
      className="hamburger"
      onClick={() => setMobileNav(true)}
      aria-label="Open navigation"
     >
      <Menu/>
     </button>

     <div className="crumb">
      Workspace
      <ChevronRight size={14}/>

      <b>
       {page === 'dashboard'
        ? 'Overview'
        : page === 'progress'
        ? 'Research in progress'
        : page === 'report'
        ? 'Briefing report'
        : page === 'sources'
        ? 'Source explorer'
        : 'Briefing history'}
      </b>
     </div>

     <div className="top-right">
      <span className="live-dot"/>
      <span>Research workspace</span>
      <div className="top-avatar">B</div>
     </div>

    </header>


    {/* DASHBOARD */}

    {page === 'dashboard' && (

     <div className="content">

      <div className="welcome">

       <div>

        <div className="eyebrow">
         YOUR RESEARCH DESK
         <span className="eyebrow-line"/>
        </div>

        <h1>
         Walk into every meeting
         <br/>
         <em>better informed.</em>
        </h1>

        <p>
         Turn scattered information into a clear,
         source-backed briefing. Know what changed,
         why it matters, and what to ask next.
        </p>

       </div>


       <div className="welcome-art">

        <div className="art-orbit orbit-one"/>
        <div className="art-orbit orbit-two"/>

        <div className="art-core">
         <FileText size={34}/>
        </div>

        <div className="art-chip chip-a">
         <ShieldCheck size={15}/>
         Evidence checked
        </div>

        <div className="art-chip chip-b">
         <Globe2 size={15}/>
         Live research
        </div>

        <div className="art-chip chip-c">
         <Target size={15}/>
         Meeting-ready
        </div>

       </div>

      </div>


      <div className="section-head">

       <div>
        <div className="eyebrow">START WITH THE CONTEXT</div>
        <h2>Prepare a briefing</h2>
        <p>
         Tell us who you're meeting and what you need to get out of it.
        </p>
       </div>

       <div className="secure-note">
        <ShieldCheck size={15}/>
        Your keys stay on the backend
       </div>

      </div>


      {error && (

       <div className="error-box">

        <AlertTriangle size={17}/>

        <div>
         <b>We couldn't prepare this briefing</b>
         <span>{error}</span>
        </div>

        <button
         onClick={() => setError('')}
         aria-label="Dismiss error"
        >
         <X size={16}/>
        </button>

       </div>

      )}


      {/* FOUR-STEP WIZARD */}

      <div className="meeting-card wizard-card">


       <div className="wizard-header">

        <div>
         <span className="eyebrow">BRIEFING CONFIGURATION</span>

         <h3>Let's get the context right.</h3>

         <p>
          A few details help us make your research more relevant.
         </p>
        </div>

        <span className="wizard-count">
         0{wizardStep} <span>/ 04</span>
        </span>

       </div>


       <div className="wizard-progress">

        {[1, 2, 3, 4].map(step => (

         <div
          key={step}
          className={`wizard-progress-segment ${
           wizardStep >= step ? 'completed' : ''
          }`}
         />

        ))}

       </div>


       <div className="wizard-step-label">

        <span>STEP 0{wizardStep}</span>

        <b>
         {[
          'Meeting details',
          'Meeting context',
          'Schedule',
          'Review briefing'
         ][wizardStep - 1]}
        </b>

       </div>


       <div className="wizard-content">


        {/* STEP 1 */}

        {wizardStep === 1 && (

         <div className="wizard-section">

          <h2>Who are you meeting?</h2>

          <p>
           Start with the company or individual you want to research.
          </p>


          <div className="subject-toggle">

           <button
            type="button"
            className={
             meeting.subject_kind === 'Company' ? 'selected' : ''
            }
            aria-pressed={meeting.subject_kind === 'Company'}
            onClick={() => updateMeeting('subject_kind', 'Company')}
           >
            <Building2 size={18}/>
            Company
           </button>

           <button
            type="button"
            className={
             meeting.subject_kind === 'Individual' ? 'selected' : ''
            }
            aria-pressed={meeting.subject_kind === 'Individual'}
            onClick={() => updateMeeting('subject_kind', 'Individual')}
           >
            <Users size={18}/>
            Individual
           </button>

          </div>


          <label className="field">

           <span>
            {meeting.subject_kind === 'Company'
             ? 'COMPANY NAME'
             : 'PERSON NAME'}
           </span>

           <div className="input-wrap wizard-input">

            {meeting.subject_kind === 'Company'
             ? <Building2 size={18}/>
             : <Users size={18}/>}

            <input
             autoFocus
             required
             minLength={2}
             placeholder={
              meeting.subject_kind === 'Company'
               ? 'e.g. Google, Microsoft, Tata Motors'
               : 'e.g. Satya Nadella'
             }
             value={meeting.subject}
             onChange={e => updateMeeting('subject', e.target.value)}
            />

           </div>

          </label>


          <div className="wizard-hint">
           <Lightbulb size={16}/>

           <span>
            We'll research publicly available information and
            distinguish supported claims from uncertain ones.
           </span>
          </div>

         </div>

        )}


        {/* STEP 2 */}

        {wizardStep === 2 && (

         <div className="wizard-section">

          <h2>What's the purpose of this meeting?</h2>

          <p>
           Select the closest match. This helps shape the research focus.
          </p>


          <div className="meeting-type-grid">

           {meetingTypes.map(item => {

            const Icon = item.icon;

            return (

             <button
              type="button"
              key={item.name}
              className={`meeting-type-card ${
               meeting.meeting_type === item.name ? 'selected' : ''
              }`}
              aria-pressed={meeting.meeting_type === item.name}
              onClick={() => updateMeeting('meeting_type', item.name)}
             >

              <div className="meeting-type-icon">
               <Icon size={20}/>
              </div>

              <div>
               <b>{item.name}</b>
               <small>{item.description}</small>
              </div>

              {meeting.meeting_type === item.name && (
               <Check className="type-check" size={17}/>
              )}

             </button>

            );

           })}

          </div>

         </div>

        )}


        {/* STEP 3 */}

        {wizardStep === 3 && (

         <div className="wizard-section">

          <h2>When is the meeting?</h2>

          <p>
           We'll use this date to determine the research window.
          </p>


          <div className="form-grid wizard-schedule">

           <label className="field">

            <span>MEETING DATE</span>

            <div className="input-wrap">

             <CalendarDays size={17}/>

             <input
              type="date"
              required
              min={dateToday}
              value={meeting.meeting_date}
              onChange={e => updateMeeting(
               'meeting_date',
               e.target.value
              )}
             />

            </div>

           </label>


           <label className="field">

            <span>MEETING TIME</span>

            <div className="input-wrap">

             <Clock3 size={17}/>

             <input
              type="time"
              value={meeting.meeting_time}
              onChange={e => updateMeeting(
               'meeting_time',
               e.target.value
              )}
             />

            </div>

           </label>


           <label className="field full">

            <span>TIME ZONE</span>

            <div className="input-wrap">

             <Globe2 size={17}/>

             <input
              required
              value={meeting.timezone}
              onChange={e => updateMeeting(
               'timezone',
               e.target.value
              )}
             />

            </div>

           </label>

          </div>


          <div className="wizard-hint">
           <Clock3 size={16}/>

           <span>
            Your research window is calculated relative to the meeting date.
           </span>
          </div>

         </div>

        )}


        {/* STEP 4 */}

        {wizardStep === 4 && (

         <div className="wizard-section">

          <h2>What do you want to achieve?</h2>

          <p>
           Give the research agent some additional context.
          </p>


          <label className="field">

           <span>
            MEETING OBJECTIVE
            <small>OPTIONAL</small>
           </span>

           <textarea
            rows={5}
            autoFocus
            placeholder="e.g. Explore a strategic partnership, understand their latest product developments, and identify potential collaboration opportunities..."
            value={meeting.objective}
            onChange={e => updateMeeting(
             'objective',
             e.target.value
            )}
           />

          </label>


          <div className="review-card">

           <div className="review-heading">
            <ShieldCheck size={18}/>
            <b>Briefing overview</b>
           </div>

           <div className="review-row">
            <span>Research subject</span>
            <b>{meeting.subject}</b>
           </div>

           <div className="review-row">
            <span>Subject type</span>
            <b>{meeting.subject_kind}</b>
           </div>

           <div className="review-row">
            <span>Meeting type</span>
            <b>{meeting.meeting_type}</b>
           </div>

           <div className="review-row">
            <span>Date and time</span>
            <b>{meeting.meeting_date} · {meeting.meeting_time}</b>
           </div>

           <div className="review-row">
            <span>Timezone</span>
            <b>{meeting.timezone}</b>
           </div>

          </div>


          <div className="wizard-hint">
           <ShieldCheck size={16}/>

           <span>
            Your briefing will include research findings,
            source references, claim verification and a
            meeting readiness assessment.
           </span>
          </div>

         </div>

        )}

       </div>


       {/* WIZARD FOOTER */}

       <div className="wizard-footer">

        <button
         type="button"
         className="wizard-back"
         onClick={previousStep}
         disabled={wizardStep === 1}
        >
         <ArrowLeft size={16}/>
         Back
        </button>


        <span className="wizard-footer-note">
         {wizardStep === 4
          ? 'Ready to research'
          : 'Your progress is saved locally'}
        </span>


        {wizardStep < 4 ? (

         <button
          type="button"
          className="primary-btn"
          onClick={nextStep}
         >
          Continue
          <ArrowRight size={17}/>
         </button>

        ) : (

         <button
          type="button"
          className="primary-btn"
          disabled={busy || !meeting.subject.trim()}
          onClick={prepare}
         >
          Prepare my briefing
          <ArrowRight size={17}/>
         </button>

        )}

       </div>

      </div>


      {/* DASHBOARD BOTTOM PANELS */}

      <div className="bottom-grid">

       <div className="mini-panel">

        <div className="panel-heading">

         <div>
          <span className="eyebrow">HOW IT WORKS</span>
          <h3>Evidence before opinions.</h3>
         </div>

         <div className="mini-icon">
          <ShieldCheck/>
         </div>

        </div>


        <div className="process-mini">

         <div>
          <span>01</span>
          <b>Research</b>
          <small>Tavily searches the open web</small>
         </div>

         <div>
          <span>02</span>
          <b>Verify</b>
          <small>Claims are tied to evidence</small>
         </div>

         <div>
          <span>03</span>
          <b>Prepare</b>
          <small>Gemini generates your briefing</small>
         </div>

        </div>

       </div>


       <div className="mini-panel recent-panel">

        <div className="panel-heading">

         <div>
          <span className="eyebrow">YOUR WORKSPACE</span>
          <h3>Recent briefings</h3>
         </div>

         <button
          className="text-btn"
          onClick={() => setPage('history')}
         >
          View all
          <ArrowUpRight size={14}/>
         </button>

        </div>


        {history.length === 0 ? (

         <div className="empty-recent">
          Your completed briefings will appear here.
         </div>

        ) : (

         history.slice(0, 3).map((item: any) => (

          <button
           className="recent-row"
           key={item.id}
           onClick={() => openHistory(item.id)}
          >

           <div className="recent-icon">
            <FileText size={16}/>
           </div>

           <div>
            <b>{item.subject}</b>

            <small>
             {item.meeting_date} ·
             {' '}
             {new Date(item.created_at).toLocaleDateString()}
            </small>
           </div>

           <ChevronRight size={16}/>

          </button>

         ))

        )}

       </div>

      </div>

     </div>

    )}


    {/* RESEARCH PROGRESS */}

    {page === 'progress' && (

     <div className="progress-page">

      <div className="eyebrow">RESEARCH SESSION</div>

      <h1>
       Building your briefing<span>.</span>
      </h1>

      <p>
       We're gathering recent evidence and shaping it around your
       meeting objective.
      </p>


      <div className="progress-card">

       <div className="progress-title">

        <div className="loader-ring">
         <LoaderCircle className="spin"/>
        </div>

        <div>
         <b>Research request submitted for {meeting.subject}</b>

         <small>
          Research window: {meeting.meeting_date}
         </small>
        </div>

        <span className="running">RUNNING</span>

       </div>


       <div className="progress-steps">

        <div className="progress-step">
         <span className="step-index">01</span>
         <div className="step-line"/>
         <span className="step-name">
          Meeting-aware research and source retrieval
         </span>
         <span className="step-state">
          <LoaderCircle className="spin" size={16}/>
         </span>
        </div>

        <div className="progress-step">
         <span className="step-index">02</span>
         <div className="step-line"/>
         <span className="step-name">
          Evidence analysis and briefing synthesis
         </span>
         <span className="step-state">
          <span className="pending-dot"/>
         </span>
        </div>

        <div className="progress-step">
         <span className="step-index">03</span>
         <div className="step-line"/>
         <span className="step-name">
          Readiness assessment and saved report
         </span>
         <span className="step-state">
          <span className="pending-dot"/>
         </span>
        </div>

       </div>


       <div className="progress-foot">
        <span>
         <Activity size={15}/>
         Backend request is running
        </span>

        <span>
         Stage percentages are not fabricated.
        </span>
       </div>

      </div>


      <div className="progress-disclaimer">
       <ShieldCheck size={17}/>
       BrieflyAI only displays claims returned with supporting
       source references.
      </div>

     </div>

    )}


    {/* REPORT */}

    {page === 'report' && briefing && (

     <div className="report-page">


      <div className="report-toolbar">

       <button
        className="back-btn"
        onClick={() => setPage('dashboard')}
       >
        <ArrowLeft size={16}/>
        Workspace
       </button>


       <div>

        <span className="complete-pill">
         <Check size={13}/>
         RESEARCH COMPLETE
        </span>

        <button
         className="outline-btn"
         onClick={() => {
          setSelectedClaim(null);
          setPage('sources');
         }}
        >
         <Globe2 size={15}/>
         Explore sources
        </button>

       </div>

      </div>


      <div className="report-heading">

       <div className="eyebrow">
        MEETING INTELLIGENCE BRIEF
        <span className="eyebrow-line"/>
       </div>

       <h1>{briefing.meeting.subject}</h1>

       <p>
        {briefing.meeting.meeting_type}
        <span>·</span>
        {briefing.meeting.meeting_date}
        <span>·</span>
        {briefing.meeting.meeting_time}
        {briefing.meeting.timezone}
       </p>

       <div className="report-meta">

        <span>
         <CalendarDays size={14}/>
         30-day research window:
         {briefing.research_window.start}
         to
         {briefing.research_window.end}
        </span>

        <span>
         <ShieldCheck size={14}/>
         {briefing.provider}
        </span>

       </div>

      </div>


      <div className="report-layout">

       <div className="report-main">


        {/* EXECUTIVE SUMMARY */}

        <section className="report-section">

         <div className="section-kicker">
          <span>01</span>
          EXECUTIVE SUMMARY
         </div>

         <p className="summary-text">
          {briefing.executive_summary}
         </p>

         {briefing.meeting.objective && (

          <div className="objective-box">
           <b>YOUR OBJECTIVE</b>
           <p>{briefing.meeting.objective}</p>
          </div>

         )}

        </section>


        {/* DEVELOPMENTS */}

        <section className="report-section">

         <div className="section-kicker">
          <span>02</span>
          WHAT'S HAPPENING RIGHT NOW
          <small>{briefing.developments.length} DEVELOPMENTS</small>
         </div>


         {briefing.developments.length ? (

          briefing.developments.map((d: any, i: number) => (

           <article className="development" key={i}>

            <div className="development-top">
             <b>{d.title}</b>

             <span className={`importance ${d.importance || 'medium'}`}>
              {d.importance || 'medium'} impact
             </span>
            </div>

            <p>{d.summary}</p>

            <div className="why">
             <Lightbulb size={15}/>
             <span>
              <b>Why it matters</b>
              {d.why_it_matters}
             </span>
            </div>

            <div className="source-tags">
             {(d.source_ids || []).map((id: string) => (
              <button
               key={id}
               onClick={() => {
                setPage('sources');
                setSelectedClaim(null);
               }}
              >
               Source ↗
              </button>
             ))}
            </div>

           </article>

          ))

         ) : (

          <div className="empty-state">
           No supported developments were found in this research
           window. This is a meaningful result, not a reason to
           invent news.
          </div>

         )}

        </section>


        {/* KEY PEOPLE */}

        <section className="report-section">

         <div className="section-kicker">
          <span>03</span>
          KEY PEOPLE
         </div>

         {briefing.key_people.length ? (

          briefing.key_people.map((person: any, i: number) => (

           <div className="person-row" key={i}>

            <div className="person-avatar">
             <Users size={16}/>
            </div>

            <div>
             <b>{person.name}</b>
             <small>
              {person.role || 'Public role not established'}
             </small>
             <p>{person.context}</p>
            </div>

           </div>

          ))

         ) : (

          <div className="muted-empty">
           No relevant people developments were confirmed.
          </div>

         )}

        </section>


        {/* OPPORTUNITIES AND RISKS */}

        <section className="report-section">

         <div className="section-kicker">
          <span>04</span>
          OPPORTUNITIES & RISKS
         </div>

         <div className="op-risk">

          <div>
           <h4>
            <span className="green-dot"/>
            Potential opportunities
           </h4>

           {briefing.opportunities.length ? (
            briefing.opportunities.map((item, i) => (
             <p key={i}>{item}</p>
            ))
           ) : (
            <p className="muted-empty">
             No evidence-backed opportunities identified.
            </p>
           )}
          </div>


          <div>
           <h4>
            <span className="amber-dot"/>
            Points to watch
           </h4>

           {briefing.risks.length ? (
            briefing.risks.map((item, i) => (
             <p key={i}>{item}</p>
            ))
           ) : (
            <p className="muted-empty">
             No specific risks identified from available sources.
            </p>
           )}
          </div>

         </div>

        </section>


        {/* QUESTIONS */}

        <section className="report-section">

         <div className="section-kicker">
          <span>05</span>
          QUESTIONS YOU SHOULD ASK
          <small>{briefing.questions.length} QUESTIONS</small>
         </div>

         <div className="questions">

          {briefing.questions.map((question, i) => (

           <div key={i}>
            <span>0{i + 1}</span>
            <p>{question}</p>
           </div>

          ))}

         </div>

        </section>


        {/* CLAIM VERIFICATION */}

        <section className="report-section">

         <div className="section-kicker">
          <span>06</span>
          CLAIM VERIFICATION
          <small>{briefing.claims.length} CLAIMS</small>
         </div>

         {briefing.claims.length ? (

          briefing.claims.map(c => (

           <button
            className="claim-row"
            key={c.id}
            onClick={() => setSelectedClaim(c.id)}
           >
            <span>{c.text}</span>
            {badge(c.status)}
            <ChevronRight size={15}/>
           </button>

          ))

         ) : (

          <div className="muted-empty">
           No factual claims could be extracted from the
           available evidence.
          </div>

         )}

        </section>


        {/* SOURCES */}

        <section className="report-section">

         <div className="section-kicker">
          <span>07</span>
          SOURCE REFERENCES
          <small>{briefing.sources.length} SOURCES</small>
         </div>

         {briefing.sources.slice(0, 8).map(source => {

          const url = safeUrl(source.url);

          return (

           <div className="source-row" key={source.id}>

            <div className="source-favicon">
             {source.domain.slice(0, 1).toUpperCase()}
            </div>

            <div>
             <b>{source.title}</b>
             <small>
              {source.domain}
              {' · '}
              {source.published_date || 'Publication date unavailable'}
             </small>
            </div>

            {url && (
             <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${source.title}`}
             >
              <ExternalLink size={15}/>
             </a>
            )}

           </div>

          );

         })}

         {briefing.sources.length > 8 && (

          <button
           className="text-btn"
           onClick={() => setPage('sources')}
          >
           View all sources
           <ArrowRight size={14}/>
          </button>

         )}

        </section>

       </div>


       {/* REPORT SIDEBAR */}

       <aside className="report-aside">


        <div className="readiness-card">

         <div className="aside-label">MEETING READINESS</div>

         <div
          className="score-ring"
          style={{
           '--score': `${briefing.readiness.score}%`
          } as React.CSSProperties}
         >

          <div>
           <strong>{briefing.readiness.score}</strong>
           <small>/100</small>
          </div>

         </div>

         <b>Research readiness</b>

         <p>
          How complete and evidence-backed this briefing is.
          Not a prediction of meeting success.
         </p>


         <div className="score-breakdown">

          {Object.entries(briefing.readiness.components).map(
           ([key, value]) => (

            <div key={key}>
             <span>{key}</span>
             <b>{value}%</b>

             <i>
              <span style={{ width: `${value}%` }}/>
             </i>
            </div>

           )
          )}

         </div>

        </div>


        <div className="transparency-card">

         <div className="aside-label">
          RESEARCH TRANSPARENCY
         </div>

         <div className="metric">
          <b>{briefing.transparency.searches_performed}</b>
          <span>Searches completed</span>
         </div>

         <div className="metric">
          <b>{briefing.transparency.unique_sources}</b>
          <span>Unique sources</span>
         </div>

         <div className="metric">
          <b>{briefing.transparency.claims_extracted}</b>
          <span>Claims extracted</span>
         </div>

         <div className="metric">
          <b>{briefing.transparency.claims_verified}</b>
          <span>Claims verified</span>
         </div>

         <div className="transparency-note">
          <Check size={14}/>
          {briefing.transparency.completion?.replaceAll('_', ' ')}
         </div>

        </div>


        <div className="aside-note">
         <ShieldCheck size={16}/>

         <span>
          <b>Evidence-first by design</b>
          Every claim links back to retrieved sources.
          Freshness is not treated as proof of accuracy.
         </span>
        </div>

       </aside>

      </div>

     </div>

    )}


    {/* SOURCE EXPLORER */}

    {page === 'sources' && briefing && (

     <div className="content history-page">

      <button
       className="back-btn"
       onClick={() => setPage('report')}
      >
       <ArrowLeft size={16}/>
       Back to briefing
      </button>

      <div className="eyebrow">RESEARCH TRANSPARENCY</div>

      <h1>Source explorer</h1>

      <p className="page-intro">
       Inspect what the research agent found, where it came
       from, and which claims it supports.
      </p>


      {claim && (

       <div className="selected-claim">

        <div className="section-kicker">
         SELECTED CLAIM
         {badge(claim.status)}
        </div>

        <h3>{claim.text}</h3>

        <p>{claim.explanation}</p>

        {claim.source_ids.map(id => {

         const source = sourceById.get(id);

         if (!source) return null;

         const url = safeUrl(source.url);

         return (

          <div className="source-row" key={id}>

           <div>
            <b>{source.title}</b>
            <small>
             {source.domain}
             {' · '}
             {source.published_date || 'Date unavailable'}
            </small>
           </div>

           {url && (
            <a
             href={url}
             target="_blank"
             rel="noopener noreferrer"
             aria-label={`Open ${source.title}`}
            >
             <ExternalLink size={15}/>
            </a>
           )}

          </div>

         );

        })}

       </div>

      )}


      <div className="source-explorer-list">

       {briefing.sources.map(source => {

        const url = safeUrl(source.url);

        return (

         <article className="explorer-source" key={source.id}>

          <div className="source-top">

           <div>
            <span className="source-domain">
             {source.domain}
            </span>

            <h3>{source.title}</h3>

            <small>
             {source.published_date
              ? `Published ${source.published_date}`
              : 'Publication date not provided by source'}
            </small>
           </div>

           {url && (
            <a
             href={url}
             target="_blank"
             rel="noopener noreferrer"
             aria-label={`Open ${source.title}`}
            >
             <ExternalLink size={16}/>
            </a>
           )}

          </div>


          <p>
           {source.content.slice(0, 500)}
           {source.content.length > 500 ? '…' : ''}
          </p>


          <div className="source-query">
           <Search size={13}/>
           Found via: {source.query}
          </div>


          <div className="supported-claims">

           {briefing.claims
            .filter(c => c.source_ids.includes(source.id))
            .map(c => (

             <button
              key={c.id}
              onClick={() => setSelectedClaim(c.id)}
             >
              {c.text.slice(0, 95)}
              {c.text.length > 95 ? '…' : ''}
              <ChevronRight size={13}/>
             </button>

            ))}

          </div>

         </article>

        );

       })}

      </div>

     </div>

    )}


    {/* HISTORY */}

    {page === 'history' && (

     <div className="content history-page">

      <div className="eyebrow">YOUR RESEARCH ARCHIVE</div>

      <h1>Briefing history</h1>

      <p className="page-intro">
       Pick up where your last meeting preparation left off.
      </p>


      {history.length === 0 ? (

       <div className="history-empty">

        <div>
         <History size={25}/>
        </div>

        <h3>No briefings yet</h3>

        <p>
         Your research archive will grow as you prepare
         for upcoming meetings.
        </p>

        <button
         className="primary-btn"
         onClick={() => setPage('dashboard')}
        >
         Create your first briefing
         <ArrowRight size={16}/>
        </button>

       </div>

      ) : (

       <div className="history-list">

        {history.map((item: any) => (

         <button
          key={item.id}
          className="history-item"
          onClick={() => openHistory(item.id)}
         >

          <div className="history-file">
           <FileText/>
          </div>

          <div>
           <b>{item.subject}</b>

           <small>
            {item.meeting_date}
            {' · Prepared '}
            {new Date(item.created_at).toLocaleString()}
           </small>
          </div>

          <span className="complete-pill">
           <Check size={13}/>
           COMPLETE
          </span>

          <ChevronRight size={17}/>

         </button>

        ))}

       </div>

      )}

     </div>

    )}


    <footer className="footer">

     <span>
      BRIEFLYAI <i>·</i> WALK INTO EVERY MEETING INFORMED
     </span>

     <span>Research with receipts.</span>

    </footer>

   </main>


   {/* CLAIM INSPECTOR DRAWER */}

   {selectedClaim && claim && (

    <div
     className="drawer-scrim"
     onClick={() => setSelectedClaim(null)}
    >

     <aside
      className="claim-drawer"
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-drawer-title"
      onClick={e => e.stopPropagation()}
     >

      <button
       className="drawer-close"
       onClick={() => setSelectedClaim(null)}
       aria-label="Close claim details"
      >
       <X/>
      </button>

      <div className="eyebrow">EVIDENCE INSPECTOR</div>

      <h2 id="claim-drawer-title">Claim details</h2>

      {badge(claim.status)}

      <h3>{claim.text}</h3>

      <p>{claim.explanation}</p>


      <div className="drawer-section">

       <b>SUPPORTING SOURCES</b>

       {claim.source_ids.length ? (

        claim.source_ids.map(id => {

         const source = sourceById.get(id);

         if (!source) return null;

         const url = safeUrl(source.url);

         return (

          <div key={id} className="drawer-source">

           <div>
            <b>{source.title}</b>

            <small>
             {source.domain}
             {' · '}
             {source.published_date || 'Publication date unavailable'}
            </small>
           </div>

           {url && (
            <a
             href={url}
             target="_blank"
             rel="noopener noreferrer"
             aria-label={`Open ${source.title}`}
            >
             <ExternalLink size={14}/>
            </a>
           )}

          </div>

         );

        })

       ) : (

        <span>No supporting source was attached.</span>

       )}

      </div>


      <div className="drawer-foot">
       <ShieldCheck size={16}/>
       Freshness indicates recency, not factual accuracy.
      </div>

     </aside>

    </div>

   )}

  </div>

 );

}