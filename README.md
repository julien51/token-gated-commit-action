# Token Gating Pull Requests

This Github Action lets anyone token gate pull-requests so that people who have the correct NFT memberships (using [Unlock Protocol](https://unlock-protocol.com)) in their wallets can contribute to code.

This Github action can be used to restrict commit access to paying members of a community, or to members of a DAO... etc.

## How-to

In your repo, create (unless it already exists) a `.github/workflows` directory. There add an `token-gating.yml` file with the following

```yaml
on:
  pull_request:
    types: [opened, edited, reopened, ready_for_review]

jobs:
  check-signer:
    runs-on: ubuntu-latest
    name: Check membership status
    steps:
      - uses: julien51/token-gated-commit-action@v1.1
        with:
          locks: '{"0x0759070d28F788947a99828b1226b930C970027F": {"network": 4}, "0x1206b31eEd5Ceb34E91f53249339Ae221e673177": {"network": 4}}'
          GITHUB_TOKEN: ${{secrets.GITHUB_TOKEN}}
```

Make sure you change the `locks` section to include the locks you want to use in your application. This is a JSON object "stringified", with the keys as lock addressesm and the for each value an object including `network` for the corresponding EVM-based networks.

Final: you can [enable auto-merge for pull-requests](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/configuring-pull-request-merges/managing-auto-merge-for-pull-requests-in-your-repository) if you want to remove any manual admin operation!
