# Identity Resolution Graph

**Proven edges form persons. Hints never silently merge identities.**

A visual graph that resolves one human across multiple systems — GitHub, Slack, email, device fingerprints, directory entries — but only when there is cryptographic or system-level proof. Suspicion stays suspicion.

**Live demo →** [identity-resolution-graph.vercel.app](https://identity-resolution-graph.vercel.app)

---

## The problem this addresses

In any company running multiple AI tools, the same person exists in a dozen systems simultaneously. They are a GitHub login, an SSO record, a Slack handle, a device fingerprint, and sometimes a personal account used once on a work laptop. No shared join key exists across all of them.

Most identity systems solve this by fuzzy-matching — if the name looks similar, collapse them. This produces confident wrong answers. Attribute one person's spend to the wrong cost center and every number downstream is wrong.

The harder constraint: **you should never assert an identifier you cannot prove.**

---

## The one rule

```js
// Only authoritative edges run through union-find.
// Hints are stored separately and never cause a merge.
for (const edge of authoritativeEdges) {
  uf.union(edge.from, edge.to)
}
```

 Every design decision in this project flows from that line.

---

## What the graph shows

**Solid edges** — authoritative proof: OAuth login, SSO record, git config on a device, corp directory sync. These form person clusters.

**Dashed edges** — hints: same network, name similarity, handle similarity. Visible in the graph but never cause a merge.

**Cluster bubbles** — each bubble is one resolved person. Nodes inside share at least one chain of authoritative edges.

### Interesting nodes to click

**`device:mac-xyz999`** — a device fingerprint connected to `slack:naman_k` only by `same_network`. It sits outside every cluster as its own unresolved identity. Same network is not proof. It could be a colleague, a home wifi, a VPN exit node. The system doesn't guess.

**`email:naman@oldco.com`** — a post-acquisition identity. We know it maps to `directory:naman.kumar` via corp directory. But the only link to `email:naman@company.com` is `name_similarity`, which is a hint. So this cluster stays separate — even though a human looking at it would say "obviously the same person." The system waits for proof.

Try adding an authoritative edge between them via the event log. Watch the clusters merge in real time.

---

## How this maps to the real world

In this demo, edges come from hardcoded seed data. In a production system, the exact same resolution logic runs — only the sources change:

| Edge source | Confidence | Why |
|---|---|---|
| OAuth login (tool → SSO) | authoritative | Cryptographic, system-issued |
| SSO record (Okta, Google Workspace) | authoritative | Company-controlled directory |
| Git config on a managed device | authoritative | IT-provisioned, verifiable |
| Corp directory sync post-acquisition | authoritative | HR system of record |
| Same network / IP | hint | Too many false positives |
| Name / handle similarity | hint | Coincidence is common |
| Device fingerprint alone | hint | Not tied to an identity system |

The rule doesn't change. What changes is the pipe feeding edges in — a webhook from your SSO provider, a sync from your MDM, a poll from your directory. Every new source produces edges with a confidence level. The graph re-runs. Clusters grow or stay split.

**The merger scenario plays out automatically.** When `naman@oldco.com` completes SSO migration to `naman@company.com`, a new authoritative edge arrives. The two clusters merge. Every downstream number — spend, usage, license count — now reflects one person instead of two. No manual reconciliation.

**The unresolved case is honest.** `mac-xyz999` might belong to naman. We don't know. So it stays as its own identity with an unresolved hint attached, and the system surfaces that gap rather than hiding it. A confidently wrong answer is worse than an honestly incomplete one.
