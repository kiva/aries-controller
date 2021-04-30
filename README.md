# Aries Controller

This it the generic code that can be used in all controller implementations.
This is published as a npm package. Specific controllers can then pull in each module as needed.
Each controller can be set up as a single or multi controller, single controllers typically have custom code or extra security restrictions
that require them to be separate. Mutli controllers are easier to setup as a new controller can be added and configured via APIs without deploying
any new servers.
Each controller can also interact with single or multi agents (eg multitenant). Single agents are useful if there is just one agent that the controller
needs to control or there are extra security concerns. Multi agents are useful when a controller needs to control multi agents (eg an agency).
Any combination of single/multi controller/agent can exist, each with their own use cases
Single agent single controller - eg a big government issuer which custom processes
Multi agent single controller - eg an agency that's managing lots of agents
Single agent multi controller - eg FSPs or issuers that want the security of a stand alone agent but doesn't want to set up it's own controller
Multi agent multi controller - eg FSPs that just want the simplest way of interacting with the system without any additional setup

# Notes
- The developer is expected to bump the package.json version for each PR. When the PR is merged to master it will automatically publish a new package to npm
- For local development you may not want to publish an npm package until you're sure things work. You can use npm link for this:
  ```
  npm run build
  cp package.json dist/package.json
  npm link
  ```
  And then in the folder you want to pull in the latest local code
  ```
  npm link aries-controller
  ```
  This will link the aries-controller dependency code to the node_modules in the other repo.
  When you are done testing, run `npm unlink`  
- For local development using docker containers npm link won't work since symbolic links on the mac won't work in a docker container.
  Instead you need to map the dist folder from your mac into the node_modules in the container. Something like this (the relative path may vary)
  ```
  volumes:
    - ../aries-controller/dist:/www/node_modules/aries-controller
  ```
