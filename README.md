# personal-website
An evolving repo with the goal of publishing a 'resume' site of some sort to parkerlacy.com. This is likely to be a pretty piecemeal process with lots of notetaking and learning about hosting, as well as configuring IaC with a cloud provider &amp; deciding on how to configure the React app.


## Documentation

To build the infrastructure, simply run tf init & apply from the `terraform` directory. Note this does not need to be re-done after being built - application code can be deployed by pushing the new `dist` folder to the s3 bucket directly via **AWS CLI**.




### After figuring out IaC for web hosting and serving on an IP

- https://www.namecheap.com/support/knowledgebase/article.aspx/9837/46/how-to-connect-a-domain-to-a-server-or-hosting/#hostingwus

- https://www.namecheap.com/support/knowledgebase/article.aspx/10686/29/how-to-deploy-reactjs-vitejs-react-native-and-nextjs-applications-in-cpanel/ 
    - probably doesn't apply because this is directly through namecheap^


## Goals
~~- Create _lightweight_ React project with basic photo/bio for now, with packaging commands & secrets set up~~
~~- Create basic IaC with chosen cloud provider (compare free tiers) to spin up a WAF and any other necessary security controls~~

~~- Integrate build & deploy from working app point, iterate.~~

- Build github actions pipelines to deploy infrastructure and to deploy application files that have changed - auto trigger on relevant file updates in `master` branch.


## Ideas
- Photo line/grid that pops in slowly after site is up at first
- Skills (look for good format/web design pattern to emulate)
- Easter Egg of some kind
- Project/work experience highlights - deep dive this repo itself
- Interactive command line with mini k8s cluster set up
    - contains stripped down resource list (if possible) with custom resources of some kind
    - alternatively is some sort of game simulation - i.e. two deployments playing card-style war with each other and trading pods or something similar
    - data sources such as workout data