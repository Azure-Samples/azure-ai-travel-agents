# AI OpSec Agent GitHub Action

This OpSec Agent automates comprehensive security audits for your repository using AI and static analysis. It leverages Azure AI models to generate a detailed, actionable Markdown security report.

---

## Features

- **Automated Security Audits:** Runs on pull requests or manually via workflow dispatch.
- **Multi-language Support:** Audits JavaScript, TypeScript, Python, Java, .NET (C#), and more.
- **Cloud & IaC Awareness:** Checks for Azure, ARM, Bicep, and GitHub Actions security best practices.
- **AI-Powered Reporting:** Uses an LLM to generate a structured Markdown report with code snippets, severity ratings, and actionable recommendations.
- **PR Integration:** Posts the audit report as a sticky comment on pull requests.
- **Artifacts:** Uploads the audit report as downloadable artifacts.

---

## Installation

1. **Copy the Workflow**

Copy the [`ai-opsec-agent.yml`](./ai-opsec-agent.yml) file into your repository under `.github/workflows/ai-opsec-agent/ai-opsec-agent.yml`.

2. **Create and deploy o3-mini LLM model**
   
In Azure AI Foundry, create a new o3-mini model. This model will be used for the security audit. Ensure it is deployed and accessible.
For more details on creating and deploying models, refer to the [Azure AI Foundry documentation](https://learn.microsoft.com/azure/ai-foundry/).

> [!NOTE]
> If you get rate limit errors, consider increasing the TPM (tokens per minute) for your model in Azure AI Foundry.

3. **Set Required Secrets**

In your repository settings, add the following secrets:
- `AZURE_OPENAI_API_KEY`: Your Azure OpenAI API key.
- `AZURE_OPENAI_ENDPOINT`: Your Azure OpenAI endpoint URL.

For more details on managing secrets, refer to the [GitHub documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets).

---

## Usage

### On Pull Requests

The workflow triggers automatically on pull requests that modify source code, configuration, or workflow files (e.g., `.py`, `.js`, `.ts`, `.java`, `.cs`, `.bicep`, `.yml`, `.json`).

If you need to audit more files or specific directories, you can adjust the `paths` filter in the workflow file.

### Manual Trigger

You can also run the workflow manually from the GitHub Actions tab using the "Run workflow" button.

---

## Output

- **security-audit.md:** A comprehensive Markdown report with:
  - Introduction & methodology
  - Detailed findings (with severity, file locations, code snippets, and recommendations)
  - Key findings table
  - Conclusion and prioritized action list

- **Artifacts:** Both the audit report and the Repomix summary are available as downloadable artifacts in the workflow run.

- **PR Comment:** The audit report is posted as a sticky comment on the pull request for easy review.

---

## Customization

- **Audit Scope:** Edit the `prompt.txt` section in the workflow to adjust the audit's focus or add organization-specific requirements.
- **Model Endpoint:** Change the `model` or endpoint in the `curl` command to use a different LLM or provider.
- **File Inclusion/Exclusion:** Adjust the `--include` and `--ignore` options in the Repomix step to fine-tune which files are audited.

---

## Example Workflow File

See [`ai-opsec-agent.yml`](./ai-opsec-agent.yml) for the full, ready-to-use workflow.

---

## Troubleshooting

- **400 Errors from API:** Ensure your prompt and code summary are encoded as valid JSON (the workflow uses `jq -Rs .` for this).
- **Empty or Null Model Response:** The workflow will fail if the AI model returns no content. Check your API key, endpoint, and model availability.
- **Missing PR Comments:** Ensure the workflow has `pull-requests: write` permission and that `GITHUB_TOKEN` is available.

---

## Contributing

Feel free to open issues or pull requests to improve the workflow or add new audit checks!
