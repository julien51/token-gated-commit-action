const core = require("@actions/core");
const github = require("@actions/github");
const { context } = require("@actions/github/lib/utils");
const ethers = require("ethers");
const { authorized } = require("./utils");

let signatureInstructions = `Please, make sure you sign the HEAD hash for this pull request using your crypto wallet to your pull request description with the following syntax: signature: 0x___. You can use https://app.mycrypto.com/sign-message`;

/**
 * Helper function to mark the build as failed
 * @param {*} core
 * @param {*} octokit
 * @param {*} owner
 * @param {*} repo
 * @param {*} issue_number
 * @param {*} message
 * @returns
 */
const failBuild = async (core, octokit, owner, repo, issue_number, message) => {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number,
    body: message,
  });

  return core.setFailed(message);
};

/**
 *
 */
const run = async () => {
  const {
    context: {},
  } = github;
  const { pull_request } = context.payload;
  const body = pull_request.body;
  const sha = pull_request.head.sha;

  const octokit = github.getOctokit(core.getInput("GITHUB_TOKEN"));
  const { owner, repo } = context.repo;

  let locks;
  try {
    if (core.getInput("locks")) {
      locks = JSON.parse(core.getInput("locks"));
    }
  } catch (error) {
    return failBuild(
      core,
      octokit,
      owner,
      repo,
      pull_request.number,
      `Lock config is not valid: ${error}`
    );
  }

  if (!locks || Object.keys(locks).length == 0) {
    return failBuild(
      core,
      octokit,
      owner,
      repo,
      pull_request.number,
      "Missing locks in the workflow config!"
    );
  }

  const [_, signature] = (body || "").match(
    `signature: (0[xX][0-9a-fA-F]+)`
  ) || [null, null];
  signatureInstructions = `Please, make sure you sign \`${sha}\` (the HEAD commit hash) for this pull request using your crypto wallet. Add the signature at the end of the pull request description using the following syntax:\n \`signature: 0x___\`. \n\nFor signatures, you can use [MyCrypto](https://app.mycrypto.com/sign-message).`;

  if (!signature) {
    return failBuild(
      core,
      octokit,
      owner,
      repo,
      pull_request.number,
      signatureInstructions
    );
  }

  const isMember = await authorized(
    signature,
    sha,
    Object.keys(locks).map((address) => ({
      address,
      network: locks[address].network,
    }))
  );

  if (isMember) {
    octokit.rest.issues.createComment({
      ...context.repo,
      issue_number: pull_request.number,
      body: "The signer owns a valid membership! This pull-request can be merged!",
    });

    return 0;
  }

  // Not a member let's prompt a purchase!
  const redirectUri = pull_request.html_url;
  const paywallConfig = {
    pessimistic: true,
    locks,
  };
  const checkoutUrl = `https://app.unlock-protocol.com/checkout?redirectUri=${encodeURIComponent(
    redirectUri
  )}&paywallConfig=${encodeURIComponent(JSON.stringify(paywallConfig))}`;
  const noValidMembershipError = `Signer of \`${sha}\` does not own a valid membership to any of configured locks. [Get a membership](${checkoutUrl}) and then trigger the action again!`;

  return failBuild(
    core,
    octokit,
    owner,
    repo,
    pull_request.number,
    noValidMembershipError
  );
};

/**
 *
 */
try {
  run();
} catch (error) {
  console.error("There was an error");
  console.error(error);
}
