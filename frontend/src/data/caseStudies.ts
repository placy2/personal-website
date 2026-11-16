export type CaseStudySection = 'context' | 'problem' | 'whatIDid' | 'result' | 'wouldChange';

export interface CaseStudyImage {
  // Path under frontend/public, e.g. '/images/work/<slug>/diagram.svg'. Plain
  // public paths (not imports) so the Playwright smoke tests can load this file.
  src: string;
  alt: string;
  // Intrinsic size, so the browser reserves space before the image loads.
  width: number;
  height: number;
}

export interface CaseStudyFigure {
  // The section this figure is shown directly after.
  after: CaseStudySection;
  // One image, or two shown side by side.
  images: CaseStudyImage[];
  caption: string;
}

export interface CaseStudy {
  slug: string;
  // 'work' (the default) is listed under Case studies on /work; 'side' under
  // Side projects. Both get a /work/<slug> page.
  kind?: 'work' | 'side';
  title: string;
  summary: string;
  tags: string[];
  context: string;
  problem: string;
  whatIDid: string;
  result: string;
  // Optional: omit when there's nothing honest to say yet (e.g. a rollout still in progress).
  wouldChange?: string;
  figures?: CaseStudyFigure[];
}

// Each entry becomes a /work/<slug> page. Keep `summary` under ~200 characters
// (it doubles as the meta / Open Graph description). Array order is display
// order on /work (and sitemap order); keep 'side' entries after the work ones.
export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'self-patching-build-agents',
    title: 'Build agents that patch themselves every week',
    summary:
      'How I turned a three-day manual update of our build-agent image into a weekly automated rebuild with test gates, paging and a tested rollback.',
    tags: ['EC2 Image Builder', 'Azure DevOps', 'Renovate', 'Go', 'Grafana'],
    context:
      'My team runs self-hosted Azure DevOps build agents on AWS. Three Linux pools (build, test and deploy) scale up to about 120 agents and run over 5,000 pipeline jobs a week. A teammate and I built them about a year ago.',
    problem:
      'Updating the image meant bumping a pinned Ubuntu AMI by hand, then rebuilding and redeploying with little error checking and no tested way back. Security scans made us do it every month or two. Each round took about three days of work, mostly slow test and debug cycles, and a bad image hit every pool at once.',
    whatIDid:
      "I designed and built the automation. Renovate opens the AMI bump, using a small Go app I wrote to find new Ubuntu AMIs. EC2 Image Builder won't accept an image until a test agent registers with an Azure DevOps test pool. The pipeline then updates the launch template, and our nightly refresh moves each pool to the new image. A weekly rebuild picks up apt patches in between. The pipeline fails when it should, like when a redeploy would change more than expected, and Grafana pages us through PagerDuty if pools run low before a workday. I also wrote a rollback runbook and tested it in a drill.",
    result:
      "Updates now take around 15 minutes of hands-on time instead of three days, and agents get patched weekly. The rollback drill took under 15 minutes from diagnosis to fix. It's still early, with two or three Renovate bumps and two weekly rebuilds so far.",
    wouldChange:
      "Renovate only watches the base AMI right now. I want it tracking the tool versions in our Image Builder components next. I also found bugs in the Lambda that scales the agents' Auto Scaling groups, and those fixes are on the list.",
  },
  {
    slug: 'audited-access-with-teleport',
    title: 'Audited access to clusters and databases behind SSO',
    summary:
      'How I put audited, SSO-based access in front of our Kubernetes clusters and a few dozen Postgres databases, and onboarded engineers onto it.',
    tags: ['Teleport', 'Kubernetes', 'PostgreSQL', 'Okta', 'AWS'],
    context:
      'My team runs several Kubernetes clusters and a few dozen Postgres databases, split between production and non-production. Engineers need hands-on access to them to debug and support production. Teleport is now the access layer in front of all of it, signed in through our company SSO.',
    problem:
      "Access was mostly granted through AWS account-level permissions. That is broad by nature, and it left real gaps in production: anyone with the account access could reach far more than they needed. Nothing recorded what someone did inside a session, so we couldn't answer who ran what. It was also hard to scope access to a person or a task. A compliance audit was coming, and it needed least-privilege access and session-level auditing. The replacement also had to be easy enough that people would use it instead of working around it.",
    whatIDid:
      'I owned the Teleport agent and configuration for every cluster and database. I deployed an agent to each cluster, registered each database, and mapped SSO groups to roles, with production scoped more tightly than non-production. I also owned communication through the rollout. I told users what would change and when, and onboarded about a dozen engineers one by one over a month or two, as each was approved for a license. I fixed the rough edges they hit before the next person started.',
    result:
      "Every cluster and database is registered in Teleport, with sessions tied to a named person and recorded. I'm now moving production over so Teleport is the only way in, and that is what makes production fully audited. About a dozen engineers are onboarded. The access controls held up in the compliance audit we passed.",
  },
  {
    slug: 'ai-agents-that-patrol-grafana',
    title: 'Hackathon (3rd place prize): AI agents that patrol our Grafana',
    summary:
      'A hackathon team built a prize-winning solution: AI agents that investigate Grafana alerts and find monitoring gaps. I built their backbone and the guard that protects shared monitoring.',
    tags: [
      'Amazon Bedrock',
      'Grafana',
      'FastAPI',
      'Docker Compose',
      'Claude Code',
      'SQLite',
      'Github',
    ],
    context:
      'Our Grafana fires a steady stream of alerts. Most get skimmed, acknowledged or ignored, and whatever someone learns investigating one is gone by the next time it fires. In a hackathon week, four of us built Ranger: AI agents that patrol Grafana, investigate what fires, and write up each result with a root cause, evidence and a recommendation. A person reviews each one in a web UI and accepts or dismisses it. When they accept, an agent files the ticket, opens the pull request, or writes the alert rule change for someone to apply. One agent looks for failure signals nothing alerts on, like crash-looping containers or API error rates, and proposes one rule per gap that covers every service.',
    problem:
      "Agents that query monitoring run against the same log and metrics servers everyone's alerts depend on, so a careless run can break alerting for everyone else. They also had to stay cheap, never change Grafana on their own, and make sense to someone who wasn't on the team. And four people building in parallel needed a shared contract on day one, or we'd spend the week blocking each other.",
    whatIDid:
      "On the first day I built the API, the SQLite knowledgebase schema and migrations, the Docker Compose setup and CI, so the UI and agent work could start right away and we could run and rebuild the app locally without any issue. Then I built a load guard. It watches the log and metrics servers' own health while agents run. It slows agents' queries when the servers are busy, holds new runs when they're saturated, and stops runs when other callers start failing. I also built an alert history service that pulls 30 days of fires from Grafana with no AI involved. It ranks the noisiest rules, and it tells the alerts agent which rules it has already investigated, so a repeat fire just gets counted.",
    result:
      "The guard got a real test mid-week. Before proposing a rule, the gap-finding agent replays it against past data to check it wouldn't be noisy, and long replays over high-cardinality metrics overloaded our shared metrics server. I sized replays by what they cost and taught the guard to watch the server's memory. It now trips far less often on ordinary load and still catches the pressure that matters. By the demo the whole loop worked: an agent spotted a problem in Grafana, a person accepted the fix, and an agent filed the ticket and opened pull requests across 3 repositories simultaneously.",
    wouldChange:
      "I'd have the guard watch the servers' raw metrics from the start, not just their query queues. My first version tripped on ordinary queries and tried too hard to catch 'ramp up patterns', ending up acting like a hair trigger that blocked local work an annoying amount. It also still managed to miss the memory pressure that mattered. I'd also spend more time on the interaction patterns with agent issues, but this project will enter actual usage among several teams, so I may get that chance.",
  },
  {
    slug: 'self-hosted-baby-tracker',
    kind: 'side',
    title: 'A baby tracker that costs less than the app it replaced',
    summary:
      'How I replaced a $10/month baby-tracking app with my own, built to cost under $5 a month, with keyless deploys and backup monitoring.',
    tags: ['Go', 'SQLite', 'Terraform', 'GitHub Actions', 'AWS SSM', 'Caddy'],
    context:
      "My wife and I originally tracked our baby's feeds, sleeps and pumping sessions in a subscription app that cost $10 a month. I built a replacement: a mobile web app that installs to our iPhones' home screens, loads quickly, and works one-handed. It covers the three things we log constantly, plus growth and solid foods behind a menu. It also has a visual weekly timeline and reports that we continue to add to and refine for our individual usage. We both use it every day.",
    problem:
      "Replacing a $10 subscription only makes sense if my hosted solution costs less, so I set a target of under $5 a month: no managed database, no load balancer, nothing billed per request. However, that leaves one small server holding the only live copy of our records, without pre-existing monitoring. As a result, failure monitoring & safe deployments are a must. Our history also had to come over from the old app's export without silently dropping data or losing fidelity.",
    whatIDid:
      'I built a single Go binary with a SQLite file-based db, used Caddy for HTTPS, and spun up the instance and all related infra with Terraform. Only the web ports are open, with no SSH. A deploy is a manual workflow_dispatch in GitHub Actions: it runs the tests, builds the binary, and signs in to AWS with short-lived OIDC credentials, so no keys are stored anywhere. The binary goes to S3, SSM tells the server to pull it and restart, and a smoke test confirms the site came back. Every hour a backup goes to S3, and the health check starts failing when the last backup is more than three hours old. For the import, I wrote a separate one-time tool. The importer handles idempotency, parses some specific data scenarios unique to our feeding history, and reports relevant details and any skipped rows when run.',
    result:
      "After building the 'MVP' and getting initial feedback within 1 week, we made the full switch in late September and this has been our only tracker since. In about two months it grew to around 85 commits, mostly from rounds of feedback after using it ourselves. The Go code is about 11,000 lines, with only four direct dependencies - much of that is testing, which has already proven useful. It's designed to run for under $5 a month. So far it has performed well, has supported new code and changes without regressions, and has effectively 100% uptime (excluding blips from deploys restarting the service).",
    wouldChange:
      "I've learned this lesson before, but still thought I could chase down GitHub OIDC trust policy stuff as a 'partway through' item. I had forgotten new repos send OIDC claims with numeric IDs instead of names, and was scratching my head over rejected deploys until I stopped, added debugging steps to just examine the claims directly, and realized what was happening. It would have been smart to have a 'basic' deploy simply dropping a text file on the instance first, instead of wrangling with the deploy while telling my wife, \"we can start testing on it today... oh shoot - once I fix this.\"",
    figures: [
      {
        after: 'context',
        images: [
          {
            src: '/images/work/self-hosted-baby-tracker/log.png',
            alt: 'The Log screen: three status boxes showing how long the baby has been asleep, time since the last feed and its volume, and time since the last pump and its volume, above large buttons to end the sleep or log a feed.',
            width: 780,
            height: 1691,
          },
          {
            src: '/images/work/self-hosted-baby-tracker/week.png',
            alt: 'The Week screen: seven day columns from midnight to midnight, with blue blocks for sleeps, green for feeds, pink for pumps and teal for solid foods.',
            width: 780,
            height: 1691,
          },
        ],
        caption: 'The Log and Week screens, shown with sample data.',
      },
      {
        after: 'whatIDid',
        images: [
          {
            src: '/images/work/self-hosted-baby-tracker/architecture.svg',
            // The SVG's own <desc> is not exposed through <img>, so the full
            // description lives here.
            alt: 'Architecture diagram. A manual GitHub Actions deploy gets short-lived AWS credentials through OIDC, uploads the binary to an S3 bucket and sends an SSM command; the instance pulls the binary and restarts. On the instance, Caddy serves HTTPS in front of a single Go binary that uses one SQLite file, and an hourly job backs the database up to S3. Phones reach the app over HTTPS, and an uptime monitor calls a health check that fails if the last backup is more than three hours old. All of it is provisioned with Terraform.',
            width: 560,
            height: 640,
          },
        ],
        caption:
          'Deploys run through GitHub OIDC, S3 and SSM, and the server never accepts an SSH connection.',
      },
    ],
  },
];
