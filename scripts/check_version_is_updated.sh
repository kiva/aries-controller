#!/usr/bin/env bash

# Note: we don't export directly because that will ignore any failures in the jq command
localVersion=$(jq -r '.version' package.json)
remoteVersion=$(npm show aries-controller version)

export LOCAL_VERSION=$localVersion
if [ "$localVersion" == "$remoteVersion" ]; then
  export VERSION_IS_UPDATED=false
else
  export VERSION_IS_UPDATED=true
fi

unset localVersion
unset remoteVersion
