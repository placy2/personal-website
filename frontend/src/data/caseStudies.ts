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
];
