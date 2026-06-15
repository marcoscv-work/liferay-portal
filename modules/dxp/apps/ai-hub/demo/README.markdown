# Image Descriptor Agent Demo (LPD-94494)

Demo-only assets for the Image Descriptor accessibility agent. Nothing in this folder ships; it documents and preserves the local demo built on top of the `LPD-94494-demo` branch (the PR branch plus the OpenAI swap commits).

## What the Demo Shows

Three content pages in the CMS site. The first two invoke the Liferay AI Hub agent from the browser; the third bypasses the agent and calls a local model directly, for contrast.

- **Accessibility Alt** (`/web/cms/accesibilidad`) — `fragment-alt-text`: pick one image, optional page context, and a "Generate Alt Text" button. Informative images get a proposed `alt`; decorative images resolve to `alt=""`.
- **Bulk img alt** (`/web/cms/alt-batch`) — `fragment-bulk-alt`: drag and drop several images; a sequential queue analyzes them one by one. An "Autogenerate Alt Text" checkbox (checked by default) disables the generation when unchecked.
- **Local AI** (`/web/cms/local-ai`) — `fragment-local-ai`: the same bulk experience, but it does NOT use the Liferay agent. The browser sends each image directly to a local Ollama vision model (`gemma4:e4b` at `192.168.40.33:11434`, configurable at the top of `main.js`), so images never leave the local network. The page states this explicitly ("No Liferay Agent" badge). The Ollama server must allow CORS for the portal origin (`Access-Control-Allow-Origin`).

On the two agent-backed pages, each run opens a fresh SSE channel (`GET /o/ai-hub/v1.0/agent-instances/subscribe`, the `Subscribe` event carries the sink key), then `POST /o/ai-hub/v1.0/agent-instances` with the agent ERC `L_IMAGE_DESCRIPTOR`, the image as a base64 data URI, the context, and the key. The result arrives as an SSE event named `L_IMAGE_DESCRIPTOR`; an absent or empty `data` field means decorative. A fresh channel per run avoids stale-key hangs after SSE reconnects, and a 120s timeout surfaces failures. The Local AI page does not use this flow at all — it POSTs straight to the Ollama `/api/chat` endpoint and reads the response synchronously.

The REST endpoint requires session/cookie authentication: any non-Bearer `Authorization` header (e.g. Basic) is rejected by `OAuth2ApplicationIdResolverUtil` with a silent 403.

## Runtime Prerequisites

- Tomcat started with `OPENAI_API_KEY` exported (the demo branch swaps Vertex for OpenAI `gpt-4o-mini` when the variable is present).
- Alternatively, export `OLLAMA_BASE_URL` (e.g. `http://192.168.40.33:11434`) to run against a local Ollama server instead — it takes precedence over OpenAI. The model defaults to `gemma4:e4b` and can be overridden with `OLLAMA_MODEL`; it must be a vision-capable model. Validated against the raw Ollama API with the agent's prompt: the informative sample resolved to a correct (if less detailed) alt text in ~20s and the decorative sample returned a fully empty response, so the `alt=""` contract holds locally and no image ever leaves the network.
- `feature.flag.LPD-62272=true` in `portal-ext.properties` (gates all AI Hub REST).
- Runtime flag `LPS-178052` enabled (headless site-pages POST), e.g. via `POST /o/com-liferay-feature-flag-web/set-enabled`.

## Seeded Data

- AI Hub account `L_AI_HUB` with its site group, plus a second customer account; the invoking user must belong to exactly two accounts (`AccountEntryUtil` contract).
- Workflow `Image Descriptor` v1 deployed in the AI Hub account group.
- `AIHubAgentDefinition` object entry with ERC `L_IMAGE_DESCRIPTOR`. The object definition is `accountEntryRestricted`, so the entry's `r_accountToAIHubAgentDefinitions_accountEntryId` must point at the `L_AI_HUB` account or every REST call 403s.

## Folder Contents

- `fragment-alt-text/`, `fragment-bulk-alt/`, `fragment-local-ai/` — fragment HTML/CSS/JS, created in the site's fragment library (collection "Demo Accesibilidad"). The first two call the agent; `fragment-local-ai/` calls Ollama directly.
- `pages/` — headless-delivery `site-pages` payloads used to create the three pages (cms-master master page, CMS theme). The sidebar links are `layout`-type site navigation menu items on "CMS Primary Navigation" with `displayIcon=accessibility`.
- `images/` — sample informative (product card) and decorative (gradient) images.
- `watch-openai.sh` — terminal watcher for recordings: samples `nettop` once per second and prints the live upload/download traffic between the Liferay JVM and `api.openai.com` while the agent runs.
