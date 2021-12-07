#!/usr/bin/env bash

# Note: we don't export directly because that will ignore any failures in the jq command
localVersion=$(jq -r '.version' package.json)
export NEW_VERSION=$localVersion
unset localVersion
