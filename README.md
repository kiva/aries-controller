# Aries Controller

This it the generic code that can be used in all controller implementations.
This is published as a npm package. Specific controllers can then pull in each module as needed.

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
