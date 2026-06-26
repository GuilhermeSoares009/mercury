#!/usr/bin/env bun
import { parseFlags } from "./flags.ts";
import { initCmd } from "./init.ts";
import { recruiterCmd } from "./recruiter.ts";
import {
  jobCmd,
  metricCmd,
  scoreCmd,
  interviewCmd,
  applicationCmd,
  activityCmd,
} from "./records.ts";
import { importJourneyCmd } from "./import-journey.ts";

const HELP = `mercury — AI-powered job search companion

Usage:
  mercury init                       Scaffold ~/.mercury/ + database
  mercury dashboard [--port N] [--no-open] [--provider opencode|claude-code]
  mercury import-journey <FILE.md>   Migrate a legacy JOURNEY.md into the db

Write API (used by skills):
  mercury recruiter add --name <n> [--company --username --title --location --degree --status --note]
  mercury recruiter update --id <n> [--status --note]
  mercury job save [--linkedin-id --title --company --location --work-type --comp --fit --link --status]
  mercury metric record [--search-appearances --profile-views --post-impressions --connections --score]
  mercury score record --value <n> [--signals <json>]
  mercury interview add --company <c> [--when --stage --status --note]
  mercury application add [--job-id --resume-path --cover-path --report-path --keyword-score --status]
  mercury activity log [--kind --skill --summary --payload]

Options:
  -h, --help        Show this help
  -v, --version     Show version
`;

async function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === "-h" || cmd === "--help") {
    console.log(HELP);
    return;
  }
  if (cmd === "-v" || cmd === "--version") {
    console.log("mercury 0.1.0");
    return;
  }

  const rest = argv.slice(1);
  const { positionals, flags } = parseFlags(rest);

  switch (cmd) {
    case "init":
      initCmd();
      break;
    case "dashboard": {
      const { dashboardCmd } = await import("../server/index.ts");
      await dashboardCmd(flags);
      break;
    }
    case "import-journey": {
      const file = positionals[0];
      if (!file) {
        console.error("error: usage: mercury import-journey <FILE.md>");
        process.exit(1);
      }
      await importJourneyCmd(file);
      break;
    }
    case "recruiter":
      await recruiterCmd(positionals[0] ?? "", flags);
      break;
    case "job":
      await jobCmd(positionals[0] ?? "", flags);
      break;
    case "metric":
      await metricCmd(flags); // `record` subcommand is implicit
      break;
    case "score":
      await scoreCmd(flags);
      break;
    case "interview":
      await interviewCmd(positionals[0] ?? "", flags);
      break;
    case "application":
      await applicationCmd(positionals[0] ?? "", flags);
      break;
    case "activity":
      await activityCmd(flags);
      break;
    default:
      console.error(`unknown command: ${cmd}\n`);
      console.log(HELP);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
