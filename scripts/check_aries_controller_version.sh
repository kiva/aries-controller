#!/usr/bin/env bash

# Note: we don't export directly because that will ignore any failures in the jq command
newVersion=$(jq -r '.version' package.json)
remoteVersion=$(npm show aries-controller version)

export NEW_VERSION=$newVersion
if [ "$newVersion" == "$remoteVersion" ]; then
  export VERSION_IS_UPDATED=false
else
  export VERSION_IS_UPDATED=true
fi

unset newVersion
unset remoteVersion
