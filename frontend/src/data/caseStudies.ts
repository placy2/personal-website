export interface CaseStudy {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  context: string;
  problem: string;
  whatIDid: string;
  result: string;
  wouldChange: string;
}

// Each entry becomes a /work/<slug> page. Keep `summary` under ~160 characters
// (it doubles as the meta / Open Graph description).
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
    slug: 'ai-agents-that-patrol-grafana',
    title: 'Hackathon (3rd place prize): AI agents that patrol our Grafana',
    summary:
      'A hackathon team built a prize-winning solution: AI agents that investigate Grafana alerts and find monitoring gaps. I built their backbone and the guard that protects shared monitoring.',
    tags: ['Claude Agent SDK', 'Amazon Bedrock', 'Grafana', 'FastAPI', 'Docker Compose'],
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
];
